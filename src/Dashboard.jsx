import { useEffect, useState } from "react";
import { api, formatIDR, formatTanggalPendek } from "./api";
import {
  Wallet, TrendingUp, TrendingDown, HandCoins, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#065F46", "#D4AF37", "#0D9488", "#F59E0B", "#10B981", "#EF4444", "#7C3AED", "#0EA5E9"];

function StatCard({ icon: Icon, label, value, sub, tone = "emerald", testId }) {
  const tones = {
    emerald: "from-emerald-800 to-emerald-950 text-emerald-50",
    gold: "from-amber-400 to-amber-600 text-emerald-950",
    green: "from-emerald-500 to-emerald-700 text-white",
    red: "from-rose-500 to-rose-700 text-white",
  };
  return (
    <div data-testid={testId} className="relative overflow-hidden rounded-2xl p-6 shadow-sm border border-emerald-900/5 fade-in-up">
      <div className={`absolute inset-0 bg-gradient-to-br ${tones[tone]} opacity-95`} />
      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest opacity-80">{label}</div>
          <Icon className="w-5 h-5 opacity-90" />
        </div>
        <div className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs opacity-80">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const loadDashboard = () => {
    setError(false);
    api.get("/dashboard/summary")
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  };

  useEffect(loadDashboard, []);

  if (!data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="dashboard-loading">
        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Backend belum tersambung. Jalankan API FastAPI untuk memuat data dashboard.</span>
            <button type="button" onClick={loadDashboard} className="rounded-lg bg-amber-200 px-3 py-1.5 font-semibold hover:bg-amber-300">
              Coba lagi
            </button>
          </div>
        ) : "Memuat dashboard..."}
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-overview">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-950">Assalamu'alaikum 👋</h1>
        <p className="text-slate-600 mt-1">Ringkasan keuangan masjid Anda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard testId="card-saldo" icon={Wallet} tone="emerald" label="Saldo Kas Utama" value={formatIDR(data.saldo)} sub="Total keseluruhan" />
        <StatCard testId="card-pemasukan" icon={TrendingUp} tone="green" label="Pemasukan Bulan Ini" value={formatIDR(data.bulan_ini_pemasukan)} sub="Bulan berjalan" />
        <StatCard testId="card-pengeluaran" icon={TrendingDown} tone="red" label="Pengeluaran Bulan Ini" value={formatIDR(data.bulan_ini_pengeluaran)} sub="Bulan berjalan" />
        <StatCard testId="card-infaq-jumat" icon={HandCoins} tone="gold" label="Infaq Jumat Bulan Ini" value={formatIDR(data.infaq_jumat_bulan_ini)} sub="Kotak amal Jumat" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2" data-testid="chart-bar-monthly">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Perbandingan Bulanan</div>
              <h3 className="text-lg font-semibold text-emerald-900">Pemasukan vs Pengeluaran</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.bar_monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `Rp${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => formatIDR(v)} />
              <Legend />
              <Bar dataKey="pemasukan" fill="#065F46" radius={[6, 6, 0, 0]} name="Pemasukan" />
              <Bar dataKey="pengeluaran" fill="#D4AF37" radius={[6, 6, 0, 0]} name="Pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-testid="chart-pie-pemasukan">
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-1">Kategori Bulan Ini</div>
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Sumber Pemasukan</h3>
          {data.pie_pemasukan.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.pie_pemasukan} dataKey="total" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {data.pie_pemasukan.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatIDR(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2" data-testid="chart-line-trend">
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-1">12 Bulan Terakhir</div>
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Tren Saldo Kas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.line_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `Rp${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => formatIDR(v)} />
              <Line type="monotone" dataKey="saldo" stroke="#065F46" strokeWidth={3} dot={{ fill: "#D4AF37", r: 4 }} activeDot={{ r: 6 }} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-testid="chart-pie-pengeluaran">
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-1">Kategori Bulan Ini</div>
          <h3 className="text-lg font-semibold text-emerald-900 mb-4">Alokasi Pengeluaran</h3>
          {data.pie_pengeluaran.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.pie_pengeluaran} dataKey="total" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {data.pie_pengeluaran.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatIDR(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-testid="recent-transactions">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Aktivitas Terkini</div>
            <h3 className="text-lg font-semibold text-emerald-900">5 Transaksi Terakhir</h3>
          </div>
        </div>
        {data.recent.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center">Belum ada transaksi. Tambahkan dari menu Transaksi.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recent.map((t) => (
              <div key={t.id} className="py-3 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === "pemasukan" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {t.type === "pemasukan" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate">
                    {t.description || t.category?.name || "Transaksi"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t.category?.name || "Tanpa kategori"} · {formatTanggalPendek(t.date)}
                  </div>
                </div>
                <div className={`font-bold ${t.type === "pemasukan" ? "text-emerald-700" : "text-rose-700"}`}>
                  {t.type === "pemasukan" ? "+" : "-"} {formatIDR(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

