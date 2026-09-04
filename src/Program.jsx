import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatIDR, todayISO } from "./api";
import { Plus, Trash2, Pencil, X, Target } from "lucide-react";

export default function Program() {
  const [programs, setPrograms] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", target_amount: 0, start_date: todayISO(), end_date: "", status: "aktif" });

  const load = () => api.get("/programs").then((r) => setPrograms(r.data)).catch(() => setPrograms([]));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: "", description: "", target_amount: 0, start_date: todayISO(), end_date: "", status: "aktif" }); setModal("add"); };
  const openEdit = (p) => { setForm(p); setModal("edit"); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, target_amount: parseFloat(form.target_amount) || 0 };
      if (modal === "add") await api.post("/programs", payload);
      else await api.put(`/programs/${form.id}`, payload);
      toast.success("Program tersimpan"); setModal(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus program ini?")) return;
    await api.delete(`/programs/${id}`);
    toast.success("Program dihapus"); load();
  };

  return (
    <div className="space-y-6" data-testid="programs-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Program & Kegiatan</h1>
          <p className="text-slate-600 mt-1">Kelola program masjid dengan target dana</p>
        </div>
        <button data-testid="btn-add-program" onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold">
          <Plus className="w-4 h-4" /> Tambah Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-10 text-center text-slate-400 border border-dashed border-slate-200">
            Belum ada program. Contoh: Renovasi Kubah, Santunan Yatim.
          </div>
        )}
        {programs.map((p) => {
          const pct = p.target_amount ? Math.min(100, Math.round((p.collected / p.target_amount) * 100)) : 0;
          return (
            <div key={p.id} data-testid={`program-card-${p.id}`} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-emerald-950">{p.name}</div>
                  <div className="text-sm text-slate-600 mt-1">{p.description || "—"}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-semibold ${p.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-bold text-emerald-800">{formatIDR(p.collected || 0)}</div>
                  <div className="text-sm text-slate-500">/ {formatIDR(p.target_amount || 0)}</div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="h-full gold-shimmer rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 text-xs text-amber-700 font-semibold">{pct}% tercapai</div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-1">
                <button data-testid={`edit-program-${p.id}`} onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700"><Pencil className="w-4 h-4" /></button>
                <button data-testid={`delete-program-${p.id}`} onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-emerald-950/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-emerald-950">{modal === "add" ? "Tambah" : "Edit"} Program</h2>
              <button type="button" onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Nama Program</label>
                <input data-testid="program-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Deskripsi</label>
                <textarea data-testid="program-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Target Dana (IDR)</label>
                <input data-testid="program-target" type="number" min={0} value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Mulai</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Selesai</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Status</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["aktif", "selesai"].map((s) => (
                    <button type="button" key={s} onClick={() => setForm({ ...form, status: s })} className={`py-2 rounded-xl border font-medium capitalize ${form.status === s ? "bg-emerald-800 text-white border-emerald-800" : "bg-white text-slate-700 border-slate-200"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50">Batal</button>
              <button data-testid="program-submit" className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
