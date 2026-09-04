import { useEffect, useState } from "react";
import { api, formatIDR, formatTanggalID, formatTanggalPendek, toHijri, nearestFridayISO } from "./api";
import { Moon, Printer, HandCoins, TrendingUp, TrendingDown, Wallet, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function LaporanJumat() {
  const [date, setDate] = useState(nearestFridayISO());
  const [report, setReport] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get("/reports/friday", { params: { date } }).then((r) => {
      setReport(r.data);
      setError(false);
    }).catch(() => setError(true));
  }, [date]);

  if (!report) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="laporan-loading">{error ? "Backend belum tersambung. Laporan akan tersedia setelah API aktif." : "Memuat laporan..."}</div>;
  }

  const fridayDate = new Date(report.friday_date);
  const incomeTransactions = report.transactions.filter((transaction) => transaction.type === "pemasukan");
  const incomeByCategory = report.pemasukan_by_category || [];

  return (
    <div className="space-y-6" data-testid="friday-weekly-report-page">
      {/* Header controls */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Khusus Setiap Hari Jumat</div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Laporan Mingguan Jumat</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              data-testid="friday-date-picker"
              type="date"
              value={date}
              onChange={(e) => {
                // snap to Friday
                const d = new Date(e.target.value);
                const day = d.getDay();
                const diff = (day - 5 + 7) % 7;
                d.setDate(d.getDate() - diff);
                setDate(d.toISOString().slice(0, 10));
              }}
              className="pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
            />
          </div>
          <button
            data-testid="btn-print-report"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium"
          >
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Bulletin Board Header */}
      <div className="print-area relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#043927] via-[#065F46] to-[#043927] text-white p-8 shadow-xl">
        <div className="absolute inset-0 islamic-pattern opacity-70" />
        <div className="absolute top-6 right-6 hidden md:flex flex-col items-end">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Moon className="w-8 h-8 text-emerald-950" />
          </div>
        </div>
        <div className="relative">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs uppercase tracking-widest font-semibold border border-amber-400/30">
            Laporan Kas Jumat DKM
          </div>
          <div className="font-arabic text-3xl text-amber-300 mt-4">بسم الله الرحمن الرحيم</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Masjid Al-Barokah</h2>
          <div className="mt-2 text-emerald-100">
            <div className="font-semibold">{formatTanggalID(report.friday_date)}</div>
            <div className="text-amber-300 text-sm mt-0.5">{toHijri(fridayDate)}</div>
          </div>
          <div className="mt-4 text-sm text-emerald-100/80">
            Periode: <span className="font-semibold">{formatTanggalPendek(report.week_start)}</span> — <span className="font-semibold">{formatTanggalPendek(report.week_end)}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="print-area grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Infaq Kotak Amal Jumat", value: report.infaq_jumat, icon: HandCoins, color: "from-amber-400 to-amber-600 text-emerald-950" },
          { label: "Total Pemasukan Pekan Ini", value: report.total_pemasukan, icon: TrendingUp, color: "from-emerald-500 to-emerald-700 text-white" },
          { label: "Total Pengeluaran Pekan Ini", value: report.total_pengeluaran, icon: TrendingDown, color: "from-rose-500 to-rose-700 text-white" },
          { label: "Saldo Pekan Ini", value: report.saldo_pekan, icon: Wallet, color: "from-emerald-800 to-emerald-950 text-emerald-50" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} data-testid={`friday-stat-${i}`} className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="text-xs uppercase tracking-widest opacity-80">{c.label}</div>
                <Icon className="w-5 h-5 opacity-90" />
              </div>
              <div className="mt-3 text-xl font-bold">{formatIDR(c.value)}</div>
            </div>
          );
        })}
      </div>

      {/* Income detail for the Friday announcement */}
      <div className="print-area bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Bahan Pengumuman Jumat</div>
            <h3 className="text-lg font-semibold text-emerald-900">Rincian Pemasukan Pekan Ini</h3>
            <p className="text-sm text-slate-500 mt-1">Ringkasan yang siap dibacakan sebelum khutbah Jumat.</p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-right">
            <div className="text-xs text-emerald-700">Total pemasukan</div>
            <div className="text-lg font-bold text-emerald-900">{formatIDR(report.total_pemasukan)}</div>
          </div>
        </div>

        {incomeByCategory.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            {incomeByCategory.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <span className="text-sm text-slate-700">{item.name}</span>
                <span className="text-sm font-bold text-emerald-800 whitespace-nowrap">{formatIDR(item.total)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-emerald-50/70 text-emerald-900">
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">Tanggal</th>
                <th className="px-3 py-2 font-semibold">Sumber / Keterangan</th>
                <th className="px-3 py-2 font-semibold">Kategori</th>
                <th className="px-3 py-2 font-semibold text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomeTransactions.length === 0 && (
                <tr><td colSpan={4} className="text-center py-6 text-slate-400">Belum ada pemasukan pada pekan ini</td></tr>
              )}
              {incomeTransactions.map((transaction) => (
                <tr key={`income-${transaction.id}`}>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatTanggalPendek(transaction.date)}</td>
                  <td className="px-3 py-2 font-medium">{transaction.description || transaction.category?.name || "Pemasukan"}</td>
                  <td className="px-3 py-2 text-slate-600">{transaction.category?.name || "Tanpa Kategori"}</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-700">{formatIDR(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison chart */}
      <div className="print-area bg-white rounded-2xl border border-slate-100 p-6">
        <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Perbandingan 4 Jumat Terakhir</div>
        <h3 className="text-lg font-semibold text-emerald-900 mb-4">Grafik Kotak Infaq & Kas Pekanan</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={report.comparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `Rp${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v) => formatIDR(v)} />
            <Legend />
            <Bar dataKey="infaq_jumat" fill="#D4AF37" name="Kotak Infaq Jumat" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pemasukan" fill="#065F46" name="Total Pemasukan" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pengeluaran" fill="#EF4444" name="Total Pengeluaran" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions list */}
      <div className="print-area bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Rincian Transaksi</div>
            <h3 className="text-lg font-semibold text-emerald-900">Daftar Transaksi Pekan Ini</h3>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-emerald-50/70 text-emerald-900">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Tanggal</th>
              <th className="px-3 py-2 font-semibold">Deskripsi</th>
              <th className="px-3 py-2 font-semibold">Kategori</th>
              <th className="px-3 py-2 font-semibold text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.transactions.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400">Tidak ada transaksi pada pekan ini</td></tr>
            )}
            {report.transactions.map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatTanggalPendek(t.date)}</td>
                <td className="px-3 py-2 font-medium">{t.description || t.category?.name || "-"}</td>
                <td className="px-3 py-2">
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (t.category?.color || "#065F46") + "22", color: t.category?.color || "#065F46" }}>
                    {t.category?.name || "-"}
                  </span>
                </td>
                <td className={`px-3 py-2 text-right font-bold ${t.type === "pemasukan" ? "text-emerald-700" : "text-rose-700"}`}>
                  {t.type === "pemasukan" ? "+" : "-"} {formatIDR(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature block */}
      <div className="print-area bg-white rounded-2xl border border-slate-100 p-8 grid grid-cols-2 gap-8 text-center">
        <div>
          <div className="text-sm text-slate-600">Mengetahui,</div>
          <div className="font-semibold text-emerald-950">Ketua DKM</div>
          <div className="h-16" />
          <div className="border-t border-slate-300 pt-2 text-sm text-slate-600">( ______________________ )</div>
        </div>
        <div>
          <div className="text-sm text-slate-600">Dilaporkan oleh,</div>
          <div className="font-semibold text-emerald-950">Bendahara Masjid</div>
          <div className="h-16" />
          <div className="border-t border-slate-300 pt-2 text-sm text-slate-600">( ______________________ )</div>
        </div>
      </div>
    </div>
  );
}
