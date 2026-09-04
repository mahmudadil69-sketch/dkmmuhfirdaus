import { useEffect, useState } from "react";
import { api, formatIDR, formatTanggalPendek, todayISO } from "./api";
import { CalendarDays, Printer, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

function firstOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

const COLORS = ["#065F46", "#D4AF37", "#0D9488", "#F59E0B", "#10B981", "#EF4444", "#7C3AED", "#0EA5E9"];

export default function LaporanPeriode() {
  const [start, setStart] = useState(firstOfMonthISO());
  const [end, setEnd] = useState(todayISO());
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get("/reports/period", { params: { start, end } }).then((r) => {
      setData(r.data);
      setError(false);
    }).catch(() => setError(true));
  }, [start, end]);

  if (!data) return <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error ? "Backend belum tersambung. Laporan akan tersedia setelah API aktif." : "Memuat laporan..."}</div>;

  return (
    <div className="space-y-6" data-testid="period-reports-page">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Bulanan & Tahunan</div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Laporan Periode</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input data-testid="period-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none" />
          </div>
          <span className="text-slate-500">—</span>
          <div className="relative">
            <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input data-testid="period-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none" />
          </div>
          <button data-testid="btn-print-period" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium">
            <Printer className="w-4 h-4" /> Cetak
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: "Total Pemasukan", value: data.total_pemasukan, cls: "from-emerald-500 to-emerald-700 text-white" },
          { icon: TrendingDown, label: "Total Pengeluaran", value: data.total_pengeluaran, cls: "from-rose-500 to-rose-700 text-white" },
          { icon: Wallet, label: "Saldo Bersih", value: data.saldo, cls: "from-emerald-800 to-emerald-950 text-emerald-50" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`bg-gradient-to-br ${c.cls} rounded-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest opacity-80">{c.label}</div>
                <Icon className="w-5 h-5 opacity-90" />
              </div>
              <div className="mt-3 text-2xl font-bold">{formatIDR(c.value)}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Breakdown per Kategori</h3>
          {data.by_category.length === 0 ? (
            <div className="text-slate-400 text-sm py-8 text-center">Tidak ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.by_category} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `Rp${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={110} />
                <Tooltip formatter={(v) => formatIDR(v)} />
                <Legend />
                <Bar dataKey="pemasukan" fill="#065F46" name="Pemasukan" radius={[0, 6, 6, 0]} />
                <Bar dataKey="pengeluaran" fill="#D4AF37" name="Pengeluaran" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Distribusi Kategori</h3>
          {data.by_category.length === 0 ? (
            <div className="text-slate-400 text-sm py-8 text-center">Tidak ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.by_category.map((c) => ({ name: c.name, value: c.pemasukan + c.pengeluaran }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                  {data.by_category.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatIDR(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-emerald-900 mb-4">Semua Transaksi ({data.transactions.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50/70 text-emerald-900">
              <tr className="text-left">
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Deskripsi</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.transactions.length === 0 && (
                <tr><td colSpan={4} className="text-center py-6 text-slate-400">Tidak ada transaksi pada periode ini</td></tr>
              )}
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">{formatTanggalPendek(t.date)}</td>
                  <td className="px-3 py-2 font-medium">{t.description || "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{t.category?.name || "-"}</td>
                  <td className={`px-3 py-2 text-right font-bold ${t.type === "pemasukan" ? "text-emerald-700" : "text-rose-700"}`}>
                    {t.type === "pemasukan" ? "+" : "-"} {formatIDR(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
