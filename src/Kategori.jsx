import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "./api";
import { Plus, Trash2, Pencil, X, Tags } from "lucide-react";

const COLORS = ["#065F46", "#D4AF37", "#0D9488", "#F59E0B", "#10B981", "#EF4444", "#7C3AED", "#0EA5E9", "#DC2626", "#B45309"];

export default function Kategori() {
  const [cats, setCats] = useState([]);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", type: "pemasukan", color: "#065F46", icon: "wallet" });

  const load = () => api.get("/categories").then((r) => {
    setCats(r.data);
    setApiUnavailable(false);
  }).catch(() => {
    setApiUnavailable(true);
    setCats([]);
  });
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: "", type: "pemasukan", color: "#065F46", icon: "wallet" }); setModal("add"); };
  const openEdit = (c) => { setForm(c); setModal("edit"); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (modal === "add") await api.post("/categories", form);
      else await api.put(`/categories/${form.id}`, form);
      toast.success("Kategori tersimpan");
      setModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus kategori ini?")) return;
    await api.delete(`/categories/${id}`);
    toast.success("Kategori dihapus");
    load();
  };

  const groupedIn = cats.filter((c) => c.type === "pemasukan");
  const groupedOut = cats.filter((c) => c.type === "pengeluaran");

  return (
    <div className="space-y-6" data-testid="categories-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Kategori</h1>
          <p className="text-slate-600 mt-1">Atur kategori pemasukan & pengeluaran</p>
        </div>
        <button data-testid="btn-add-category" onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "Pemasukan", items: groupedIn, tone: "emerald" },
          { title: "Pengeluaran", items: groupedOut, tone: "rose" },
        ].map((g) => (
          <div key={g.title} className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className={`text-lg font-semibold mb-4 ${g.tone === "emerald" ? "text-emerald-800" : "text-rose-700"}`}>{g.title}</h2>
            <div className="space-y-2">
              {g.items.length === 0 && <div className="text-sm text-slate-400 py-6 text-center">Belum ada kategori</div>}
              {g.items.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + "22", color: c.color }}>
                    <Tags className="w-4 h-4" />
                  </div>
                  <div className="flex-1 font-medium">{c.name}</div>
                  <button data-testid={`edit-cat-${c.id}`} onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700"><Pencil className="w-4 h-4" /></button>
                  <button data-testid={`delete-cat-${c.id}`} onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {apiUnavailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          API belum tersambung. Tampilan tetap bisa dibuka, tetapi data kategori akan muncul setelah backend aktif.
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-emerald-950/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-emerald-950">{modal === "add" ? "Tambah" : "Edit"} Kategori</h2>
              <button type="button" onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Nama</label>
                <input data-testid="cat-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Tipe</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {["pemasukan", "pengeluaran"].map((t) => (
                    <button type="button" key={t} data-testid={`cat-type-${t}`} onClick={() => setForm({ ...form, type: t })} className={`py-2 rounded-xl border font-medium capitalize ${form.type === t ? "bg-emerald-800 text-white border-emerald-800" : "bg-white text-slate-700 border-slate-200"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Warna</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className={`w-9 h-9 rounded-lg border-2 ${form.color === c ? "border-slate-900" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50">Batal</button>
              <button data-testid="cat-submit" className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
