import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatIDR, formatTanggalPendek, todayISO } from "./api";
import { Plus, Search, Trash2, ArrowUpRight, ArrowDownRight, X } from "lucide-react";

function apiErr(e) {
  const d = e?.response?.data?.detail;
  if (!d) return e.message;
  if (typeof d === "string") return d;
  return JSON.stringify(d);
}

export default function Transaksi() {
  const [txs, setTxs] = useState([]);
  const [cats, setCats] = useState([]);
  const [donors, setDonors] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [filter, setFilter] = useState({ type: "", category_id: "", q: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: "pemasukan", amount: "", category_id: "", date: todayISO(),
    description: "", donor_id: "", program_id: "", is_friday_infaq: false,
  });

  const load = () => {
    const params = {};
    if (filter.type) params.type = filter.type;
    if (filter.category_id) params.category_id = filter.category_id;
    if (filter.q) params.q = filter.q;
    api.get("/transactions", { params }).then((r) => setTxs(r.data));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);
  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data)).catch(() => setCats([]));
    api.get("/donors").then((r) => setDonors(r.data)).catch(() => setDonors([]));
    api.get("/programs").then((r) => setPrograms(r.data)).catch(() => setPrograms([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/transactions", { ...form, amount: parseFloat(form.amount) });
      toast.success("Transaksi berhasil ditambahkan");
      setModalOpen(false);
      setForm({ ...form, amount: "", description: "" });
      load();
    } catch (e) { toast.error(apiErr(e)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus transaksi ini?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Transaksi dihapus");
      load();
    } catch (e) { toast.error(apiErr(e)); }
  };

  const filteredCats = cats.filter((c) => !form.type || c.type === form.type);

  return (
    <div className="space-y-6" data-testid="transactions-management-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Transaksi</h1>
          <p className="text-slate-600 mt-1">Kelola pemasukan & pengeluaran masjid</p>
        </div>
        <button
          data-testid="btn-add-transaction"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            data-testid="filter-search"
            value={filter.q}
            onChange={(e) => setFilter({ ...filter, q: e.target.value })}
            placeholder="Cari deskripsi..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
          />
        </div>
        <select
          data-testid="filter-type"
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
        >
          <option value="">Semua Tipe</option>
          <option value="pemasukan">Pemasukan</option>
          <option value="pengeluaran">Pengeluaran</option>
        </select>
        <select
          data-testid="filter-category"
          value={filter.category_id}
          onChange={(e) => setFilter({ ...filter, category_id: e.target.value })}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
        >
          <option value="">Semua Kategori</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50/70 text-emerald-900">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Tanggal</th>
              <th className="px-4 py-3 font-semibold">Deskripsi</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 font-semibold">Donatur</th>
              <th className="px-4 py-3 font-semibold text-right">Jumlah</th>
              <th className="px-4 py-3 font-semibold w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {txs.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Belum ada transaksi</td></tr>
            )}
            {txs.map((t) => (
              <tr key={t.id} data-testid={`tx-row-${t.id}`} className="hover:bg-emerald-50/40">
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatTanggalPendek(t.date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.type === "pemasukan" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {t.type === "pemasukan" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </span>
                    <div>
                      <div className="font-medium text-slate-800">{t.description || "-"}</div>
                      {t.is_friday_infaq && <span className="text-[10px] uppercase tracking-widest text-amber-600">Infaq Jumat</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: (t.category?.color || "#065F46") + "22", color: t.category?.color || "#065F46" }}>
                    {t.category?.name || "Tanpa kategori"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.donor?.name || "-"}</td>
                <td className={`px-4 py-3 text-right font-bold ${t.type === "pemasukan" ? "text-emerald-700" : "text-rose-700"}`}>
                  {t.type === "pemasukan" ? "+" : "-"} {formatIDR(t.amount)}
                </td>
                <td className="px-4 py-3">
                  <button data-testid={`delete-tx-${t.id}`} onClick={() => remove(t.id)} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-emerald-950/60 z-50 flex items-center justify-center p-4" data-testid="tx-modal">
          <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-emerald-950">Tambah Transaksi</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {["pemasukan", "pengeluaran"].map((t) => (
                  <button
                    type="button"
                    key={t}
                    data-testid={`tx-type-${t}`}
                    onClick={() => setForm({ ...form, type: t, category_id: "" })}
                    className={`py-2.5 rounded-xl border font-medium capitalize ${
                      form.type === t
                        ? t === "pemasukan"
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Jumlah (IDR)</label>
                <input
                  data-testid="tx-amount"
                  required type="number" min={1} step="1000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="100000"
                  className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-lg font-semibold font-mono"
                />
                {form.amount && <div className="text-xs text-emerald-700 mt-1">{formatIDR(form.amount)}</div>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Kategori</label>
                  <select data-testid="tx-category" required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none">
                    <option value="">Pilih kategori</option>
                    {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Tanggal</label>
                  <input data-testid="tx-date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Donatur (opsional)</label>
                  <select data-testid="tx-donor" value={form.donor_id} onChange={(e) => setForm({ ...form, donor_id: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none">
                    <option value="">-</option>
                    {donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Program (opsional)</label>
                  <select data-testid="tx-program" value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none">
                    <option value="">-</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Deskripsi</label>
                <input data-testid="tx-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" placeholder="Contoh: Infaq kotak amal Jumat" />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input data-testid="tx-friday" type="checkbox" checked={form.is_friday_infaq} onChange={(e) => setForm({ ...form, is_friday_infaq: e.target.checked })} className="w-4 h-4 accent-amber-500" />
                Tandai sebagai Infaq Jumat (kotak amal)
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium">Batal</button>
              <button data-testid="tx-submit" type="submit" className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


