from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ── Mongo setup ───────────────────────────────────────────────────────────────
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "masjid_finance_db")]

app = FastAPI(title="Keuangan Masjid API")
api = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", "development-only-change-me")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


# ── Auth utils ────────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": now_utc() + timedelta(hours=12),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": now_utc() + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def user_public(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "bendahara"),
    }


async def get_current_user(request: Request) -> dict:
    return {"_id": "public", "email": "publik@masjid.local", "name": "Akses Publik", "role": "admin"}

    # Login is intentionally disabled for this public mosque dashboard.
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Belum login")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token tidak valid")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesi habis, silakan login ulang")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=60 * 60 * 12, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=60 * 60 * 24 * 7, path="/")


# ── Models ────────────────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    role: Literal["admin", "bendahara"] = "bendahara"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class CategoryIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    type: Literal["pemasukan", "pengeluaran"]
    color: str = "#065F46"
    icon: str = "wallet"


class TransactionIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    type: Literal["pemasukan", "pengeluaran"]
    amount: float = Field(gt=0)
    category_id: str
    date: str  # ISO date string
    description: str = ""
    donor_id: Optional[str] = None
    program_id: Optional[str] = None
    is_friday_infaq: bool = False


class MutationRow(BaseModel):
    date: str
    description: str = "Mutasi rekening BSI"
    amount: float = Field(gt=0)
    reference: str = ""


class MutationImportIn(BaseModel):
    rows: List[MutationRow]


class DonorIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""
    tag: str = "reguler"  # reguler, loyal, qurban, yatim


class ProgramIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    description: str = ""
    target_amount: float = 0
    start_date: str = ""
    end_date: str = ""
    status: Literal["aktif", "selesai"] = "aktif"


def clean_id(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Auth routes ───────────────────────────────────────────────────────────────
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "created_at": iso(now_utc()),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    user = user_public(doc)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": user, "access_token": access}


@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    pub = user_public(user)
    access = create_access_token(pub["id"], pub["email"], pub["role"])
    refresh = create_refresh_token(pub["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": pub, "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_public(user)


# ── Categories ────────────────────────────────────────────────────────────────
@api.get("/categories")
async def list_categories(user: dict = Depends(get_current_user)):
    cursor = db.categories.find().sort("name", 1)
    return [clean_id(c) for c in await cursor.to_list(500)]


@api.post("/categories")
async def create_category(body: CategoryIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["created_at"] = iso(now_utc())
    res = await db.categories.insert_one(doc)
    doc["_id"] = res.inserted_id
    return clean_id(doc)


@api.put("/categories/{cid}")
async def update_category(cid: str, body: CategoryIn, user: dict = Depends(get_current_user)):
    await db.categories.update_one({"_id": ObjectId(cid)}, {"$set": body.model_dump()})
    doc = await db.categories.find_one({"_id": ObjectId(cid)})
    return clean_id(doc)


@api.delete("/categories/{cid}")
async def delete_category(cid: str, user: dict = Depends(get_current_user)):
    await db.categories.delete_one({"_id": ObjectId(cid)})
    return {"ok": True}


# ── Donors ────────────────────────────────────────────────────────────────────
@api.get("/donors")
async def list_donors(user: dict = Depends(get_current_user)):
    cursor = db.donors.find().sort("name", 1)
    donors = [clean_id(d) for d in await cursor.to_list(1000)]
    # attach total contribution
    for d in donors:
        pipeline = [
            {"$match": {"donor_id": d["id"], "type": "pemasukan"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        ]
        agg = await db.transactions.aggregate(pipeline).to_list(1)
        d["total_contribution"] = agg[0]["total"] if agg else 0
        d["contribution_count"] = agg[0]["count"] if agg else 0
    return donors


@api.post("/donors")
async def create_donor(body: DonorIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["created_at"] = iso(now_utc())
    res = await db.donors.insert_one(doc)
    doc["_id"] = res.inserted_id
    return clean_id(doc)


@api.put("/donors/{did}")
async def update_donor(did: str, body: DonorIn, user: dict = Depends(get_current_user)):
    await db.donors.update_one({"_id": ObjectId(did)}, {"$set": body.model_dump()})
    return clean_id(await db.donors.find_one({"_id": ObjectId(did)}))


@api.delete("/donors/{did}")
async def delete_donor(did: str, user: dict = Depends(get_current_user)):
    await db.donors.delete_one({"_id": ObjectId(did)})
    return {"ok": True}


# ── Programs ──────────────────────────────────────────────────────────────────
@api.get("/programs")
async def list_programs(user: dict = Depends(get_current_user)):
    cursor = db.programs.find().sort("created_at", -1)
    programs = [clean_id(p) for p in await cursor.to_list(500)]
    for p in programs:
        pipeline = [
            {"$match": {"program_id": p["id"], "type": "pemasukan"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        agg = await db.transactions.aggregate(pipeline).to_list(1)
        p["collected"] = agg[0]["total"] if agg else 0
    return programs


@api.post("/programs")
async def create_program(body: ProgramIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["created_at"] = iso(now_utc())
    res = await db.programs.insert_one(doc)
    doc["_id"] = res.inserted_id
    return clean_id(doc)


@api.put("/programs/{pid}")
async def update_program(pid: str, body: ProgramIn, user: dict = Depends(get_current_user)):
    await db.programs.update_one({"_id": ObjectId(pid)}, {"$set": body.model_dump()})
    return clean_id(await db.programs.find_one({"_id": ObjectId(pid)}))


@api.delete("/programs/{pid}")
async def delete_program(pid: str, user: dict = Depends(get_current_user)):
    await db.programs.delete_one({"_id": ObjectId(pid)})
    return {"ok": True}


# ── Transactions ──────────────────────────────────────────────────────────────
async def enrich_transaction(t: dict) -> dict:
    if t.get("category_id"):
        cat = await db.categories.find_one({"_id": ObjectId(t["category_id"])})
        t["category"] = clean_id(cat) if cat else None
    if t.get("donor_id"):
        d = await db.donors.find_one({"_id": ObjectId(t["donor_id"])})
        t["donor"] = clean_id(d) if d else None
    if t.get("program_id"):
        p = await db.programs.find_one({"_id": ObjectId(t["program_id"])})
        t["program"] = clean_id(p) if p else None
    return t


@api.get("/transactions")
async def list_transactions(
    user: dict = Depends(get_current_user),
    type: Optional[str] = None,
    category_id: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 200,
):
    match: dict = {}
    if type in ("pemasukan", "pengeluaran"):
        match["type"] = type
    if category_id:
        match["category_id"] = category_id
    if start or end:
        rng: dict = {}
        if start:
            rng["$gte"] = start
        if end:
            rng["$lte"] = end
        match["date"] = rng
    if q:
        match["description"] = {"$regex": q, "$options": "i"}
    cursor = db.transactions.find(match).sort("date", -1).limit(limit)
    txs = [clean_id(t) for t in await cursor.to_list(limit)]
    for t in txs:
        await enrich_transaction(t)
    return txs


@api.post("/transactions")
async def create_transaction(body: TransactionIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["created_at"] = iso(now_utc())
    doc["created_by"] = str(user.get("_id", "public"))
    res = await db.transactions.insert_one(doc)
    doc["_id"] = res.inserted_id
    t = clean_id(doc)
    await enrich_transaction(t)
    return t


@api.put("/transactions/{tid}")
async def update_transaction(tid: str, body: TransactionIn, user: dict = Depends(get_current_user)):
    await db.transactions.update_one({"_id": ObjectId(tid)}, {"$set": body.model_dump()})
    t = clean_id(await db.transactions.find_one({"_id": ObjectId(tid)}))
    await enrich_transaction(t)
    return t


@api.delete("/transactions/{tid}")
async def delete_transaction(tid: str, user: dict = Depends(get_current_user)):
    await db.transactions.delete_one({"_id": ObjectId(tid)})
    return {"ok": True}


@api.post("/mutations/import")
async def import_bsi_mutations(body: MutationImportIn, user: dict = Depends(get_current_user)):
    category = await db.categories.find_one({"name": "Transfer BSI", "type": "pemasukan"})
    if not category:
        result = await db.categories.insert_one({
            "name": "Transfer BSI",
            "type": "pemasukan",
            "color": "#0D9488",
            "icon": "landmark",
            "created_at": iso(now_utc()),
        })
        category_id = str(result.inserted_id)
    else:
        category_id = str(category["_id"])

    imported = 0
    skipped = 0
    for row in body.rows:
        reference = row.reference.strip()
        if reference and await db.transactions.find_one({"bank_reference": reference}):
            skipped += 1
            continue
        document = {
            "type": "pemasukan",
            "amount": row.amount,
            "category_id": category_id,
            "date": row.date,
            "description": row.description or "Mutasi rekening BSI",
            "is_friday_infaq": False,
            "bank_name": "BSI",
            "bank_reference": reference,
            "source": "mutasi_bsi",
            "created_at": iso(now_utc()),
            "created_by": "public",
        }
        await db.transactions.insert_one(document)
        imported += 1
    return {"imported": imported, "skipped": skipped}


# ── Dashboard / Reports ───────────────────────────────────────────────────────
@api.get("/dashboard/summary")
async def dashboard_summary(user: dict = Depends(get_current_user)):
    now = now_utc()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).date().isoformat()

    async def sum_by(match):
        agg = await db.transactions.aggregate([
            {"$match": match},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]).to_list(1)
        return agg[0]["total"] if agg else 0

    total_in = await sum_by({"type": "pemasukan"})
    total_out = await sum_by({"type": "pengeluaran"})
    month_in = await sum_by({"type": "pemasukan", "date": {"$gte": month_start}})
    month_out = await sum_by({"type": "pengeluaran", "date": {"$gte": month_start}})
    friday_infaq = await sum_by({"type": "pemasukan", "is_friday_infaq": True, "date": {"$gte": month_start}})

    # by category (pemasukan & pengeluaran) — current month
    def cat_pipeline(txn_type):
        return [
            {"$match": {"type": txn_type, "date": {"$gte": month_start}}},
            {"$group": {"_id": "$category_id", "total": {"$sum": "$amount"}}},
        ]

    async def category_breakdown(txn_type):
        rows = await db.transactions.aggregate(cat_pipeline(txn_type)).to_list(50)
        out = []
        for r in rows:
            cat = None
            if r["_id"]:
                cat = await db.categories.find_one({"_id": ObjectId(r["_id"])})
            out.append({
                "category_id": r["_id"],
                "name": cat["name"] if cat else "Tanpa Kategori",
                "color": cat.get("color", "#065F46") if cat else "#94a3b8",
                "total": r["total"],
            })
        return out

    # monthly comparison last 6 months
    months = []
    for i in range(5, -1, -1):
        target = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        start = target.date().isoformat()
        if i == 0:
            end = None
        else:
            next_month = (target + timedelta(days=32)).replace(day=1)
            end = next_month.date().isoformat()
        m = {"$gte": start}
        if end:
            m["$lt"] = end
        month_in_v = await sum_by({"type": "pemasukan", "date": m})
        month_out_v = await sum_by({"type": "pengeluaran", "date": m})
        months.append({
            "label": target.strftime("%b %Y"),
            "pemasukan": month_in_v,
            "pengeluaran": month_out_v,
        })

    # cash trend last 12 months (cumulative)
    trend = []
    running = 0
    for i in range(11, -1, -1):
        target = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        start = target.date().isoformat()
        next_month = (target + timedelta(days=32)).replace(day=1)
        end = next_month.date().isoformat()
        rng = {"$gte": start, "$lt": end}
        mi = await sum_by({"type": "pemasukan", "date": rng})
        mo = await sum_by({"type": "pengeluaran", "date": rng})
        running += (mi - mo)
        trend.append({"label": target.strftime("%b %y"), "saldo": running})

    recent = await db.transactions.find().sort("date", -1).limit(5).to_list(5)
    recent = [clean_id(t) for t in recent]
    for t in recent:
        await enrich_transaction(t)

    return {
        "saldo": total_in - total_out,
        "total_pemasukan": total_in,
        "total_pengeluaran": total_out,
        "bulan_ini_pemasukan": month_in,
        "bulan_ini_pengeluaran": month_out,
        "infaq_jumat_bulan_ini": friday_infaq,
        "pie_pemasukan": await category_breakdown("pemasukan"),
        "pie_pengeluaran": await category_breakdown("pengeluaran"),
        "bar_monthly": months,
        "line_trend": trend,
        "recent": recent,
    }


@api.get("/reports/friday")
async def friday_report(
    date: Optional[str] = Query(None, description="ISO date of Friday"),
    user: dict = Depends(get_current_user),
):
    """Weekly Friday report — week runs Saturday..Friday ending on `date`."""
    if date:
        end = datetime.fromisoformat(date).date()
    else:
        today = now_utc().date()
        # find nearest Friday (today or previous)
        offset = (today.weekday() - 4) % 7
        end = today - timedelta(days=offset)
    start = end - timedelta(days=6)
    match_range = {"$gte": start.isoformat(), "$lte": end.isoformat()}

    txs = await db.transactions.find({"date": match_range}).sort("date", 1).to_list(500)
    txs = [clean_id(t) for t in txs]
    for t in txs:
        await enrich_transaction(t)

    total_in = sum(t["amount"] for t in txs if t["type"] == "pemasukan")
    total_out = sum(t["amount"] for t in txs if t["type"] == "pengeluaran")
    infaq_jumat = sum(t["amount"] for t in txs if t.get("is_friday_infaq"))

    pemasukan_by_category = {}
    for transaction in txs:
        if transaction["type"] != "pemasukan":
            continue
        category = transaction.get("category", {}).get("name") if transaction.get("category") else "Tanpa Kategori"
        pemasukan_by_category[category] = pemasukan_by_category.get(category, 0) + transaction["amount"]

    # comparison last 4 Fridays
    comparison = []
    for i in range(3, -1, -1):
        friday = end - timedelta(days=7 * i)
        wk_start = friday - timedelta(days=6)
        wk_txs = await db.transactions.find({
            "date": {"$gte": wk_start.isoformat(), "$lte": friday.isoformat()},
        }).to_list(500)
        wk_in = sum(t["amount"] for t in wk_txs if t["type"] == "pemasukan")
        wk_out = sum(t["amount"] for t in wk_txs if t["type"] == "pengeluaran")
        wk_infaq = sum(t["amount"] for t in wk_txs if t.get("is_friday_infaq"))
        comparison.append({
            "label": friday.strftime("%d %b"),
            "date": friday.isoformat(),
            "pemasukan": wk_in,
            "pengeluaran": wk_out,
            "infaq_jumat": wk_infaq,
        })

    return {
        "week_start": start.isoformat(),
        "week_end": end.isoformat(),
        "friday_date": end.isoformat(),
        "total_pemasukan": total_in,
        "total_pengeluaran": total_out,
        "infaq_jumat": infaq_jumat,
        "pemasukan_by_category": [
            {"name": name, "total": total}
            for name, total in pemasukan_by_category.items()
        ],
        "saldo_pekan": total_in - total_out,
        "transactions": txs,
        "comparison": comparison,
    }


@api.get("/reports/period")
async def period_report(
    start: str = Query(...),
    end: str = Query(...),
    user: dict = Depends(get_current_user),
):
    txs = await db.transactions.find({"date": {"$gte": start, "$lte": end}}).sort("date", 1).to_list(2000)
    txs = [clean_id(t) for t in txs]
    for t in txs:
        await enrich_transaction(t)
    total_in = sum(t["amount"] for t in txs if t["type"] == "pemasukan")
    total_out = sum(t["amount"] for t in txs if t["type"] == "pengeluaran")

    by_cat = {}
    for t in txs:
        key = t.get("category", {}).get("name") if t.get("category") else "Tanpa Kategori"
        row = by_cat.setdefault(key, {"name": key, "pemasukan": 0, "pengeluaran": 0})
        row[t["type"]] += t["amount"]
    return {
        "start": start,
        "end": end,
        "total_pemasukan": total_in,
        "total_pengeluaran": total_out,
        "saldo": total_in - total_out,
        "by_category": list(by_cat.values()),
        "transactions": txs,
    }


# ── Startup ───────────────────────────────────────────────────────────────────
DEFAULT_CATEGORIES = [
    {"name": "Infaq Jumat", "type": "pemasukan", "color": "#D4AF37", "icon": "hand-coins"},
    {"name": "Zakat", "type": "pemasukan", "color": "#059669", "icon": "hand-heart"},
    {"name": "Shadaqah", "type": "pemasukan", "color": "#10B981", "icon": "gift"},
    {"name": "Donasi Program", "type": "pemasukan", "color": "#0D9488", "icon": "target"},
    {"name": "Operasional", "type": "pengeluaran", "color": "#EF4444", "icon": "zap"},
    {"name": "Kebersihan", "type": "pengeluaran", "color": "#F59E0B", "icon": "sparkles"},
    {"name": "Renovasi", "type": "pengeluaran", "color": "#DC2626", "icon": "hammer"},
    {"name": "Konsumsi Kajian", "type": "pengeluaran", "color": "#B45309", "icon": "utensils"},
]


async def seed():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "change-this-password")
    admin_name = os.environ.get("ADMIN_NAME", "Admin DKM")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_pw),
            "name": admin_name,
            "role": "admin",
            "created_at": iso(now_utc()),
        })
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

    if await db.categories.count_documents({}) == 0:
        docs = [dict(c, created_at=iso(now_utc())) for c in DEFAULT_CATEGORIES]
        await db.categories.insert_many(docs)


@app.on_event("startup")
async def on_startup():
    await seed()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)