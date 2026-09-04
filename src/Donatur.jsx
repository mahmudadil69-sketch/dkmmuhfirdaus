import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatIDR } from "./api";
import { Plus, Trash2, Pencil, X, User } from "lucide-react";

const TAGS = [
  { value: "reguler", label: "Reguler", color: "#065F46" },
  { value: "loyal", label: "Donatur Loyal", color: "#D4AF37" },
  { value: "qurban", label: "Donatur Qurban", color: "#DC2626" },
  { value: "yatim", label: "Donatur Yatim", color: "#0D9488" },
];

export default function Donatur() {
  const [donors, setDonors] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", tag: "reguler" });

  const load = () => api.get("/donors").then((r) => setDonors(r.data)).catch(() => setDonors([]));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: "", phone: "", email: "", address: "", tag: "reguler" }); setModal("add"); };
  const openEdit = (d) => { setForm(d); setModal("edit"); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (modal === "add") await api.post("/donors", form);
      else await api.put(`/donors/${form.id}`, form);
      toast.success("Donatur tersimpan");
      setModal(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus donatur ini?")) return;
    await api.delete(`/donors/${id}`);
    toast.success("Donatur dihapus"); load();
  };

  return (
    <div className="space-y-6" data-testid="donors-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Donatur & Jamaah</h1>
          <p className="text-slate-600 mt-1">Daftar pemberi infaq, shadaqah, dan wakaf</p>
        </div>
        <button data-testid="btn-add-donor" onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold">
          <Plus className="w-4 h-4" /> Tambah Donatur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {donors.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-10 text-center text-slate-400 border border-dashed border-slate-200">
            Belum ada donatur. Tambahkan donatur pertama Anda.
          </div>
        )}
        {donors.map((d) => {
          const tag = TAGS.find((t) => t.value === d.tag) || TAGS[0];
          return (
            <div key={d.id} data-testid={`donor-card-${d.id}`} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-emerald-950 truncate">{d.name}</div>
                  <div className="text-xs text-slate-500 truncate">{d.phone || d.email || "—"}</div>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: tag.color + "22", color: tag.color }}>{tag.label}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Total Kontribusi</div>
                  <div className="font-bold text-emerald-800">{formatIDR(d.total_contribution || 0)}</div>
                  <div className="text-[11px] text-slate-500">{d.contribution_count || 0} transaksi</div>
                </div>
                <div className="flex gap-1">
                  <button data-testid={`edit-donor-${d.id}`} onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700"><Pencil className="w-4 h-4" /></button>
                  <button data-testid={`delete-donor-${d.id}`} onClick={() => remove(d.id)} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-emerald-950/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-emerald-950">{modal === "add" ? "Tambah" : "Edit"} Donatur</h2>
              <button type="button" onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Nama</label>
                <input data-testid="donor-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">No. HP</label>
                  <input data-testid="donor-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Email</label>
                  <input data-testid="donor-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Alamat</label>
                <input data-testid="donor-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Kategori Donatur</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {TAGS.map((t) => (
                    <button type="button" key={t.value} data-testid={`donor-tag-${t.value}`} onClick={() => setForm({ ...form, tag: t.value })} className={`py-2 px-3 rounded-xl border font-medium text-sm ${form.tag === t.value ? "bg-emerald-800 text-white border-emerald-800" : "bg-white text-slate-700 border-slate-200"}`}>{t.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50">Batal</button>
              <button data-testid="donor-submit" className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
