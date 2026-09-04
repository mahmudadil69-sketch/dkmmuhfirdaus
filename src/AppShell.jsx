import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, Tags, Users, Target, CalendarDays, FileBarChart2, Landmark, Moon, Menu, X, Building2,
  HandCoins,
} from "lucide-react";
import { useState } from "react";
import { toHijri, formatTanggalID } from "./api";
import { getMasjidProfile } from "./masjidProfile";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/transaksi", label: "Transaksi", icon: ArrowLeftRight, testId: "nav-transaksi" },
  { to: "/mutasi-bsi", label: "Mutasi Rekening BSI", icon: Landmark, testId: "nav-mutasi-bsi", highlight: true },
  { to: "/laporan-jumat", label: "Laporan Jumat", icon: CalendarDays, testId: "nav-laporan-jumat", highlight: true },
  { to: "/laporan-periode", label: "Laporan Periode", icon: FileBarChart2, testId: "nav-laporan-periode" },
  { to: "/kategori", label: "Kategori", icon: Tags, testId: "nav-kategori" },
  { to: "/donatur", label: "Donatur", icon: Users, testId: "nav-donatur" },
  { to: "/program", label: "Program", icon: Target, testId: "nav-program" },
  { to: "/profil-masjid", label: "Profil Masjid", icon: Building2, testId: "nav-profil-masjid" },
];

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const profile = getMasjidProfile();

  return (
    <div className="min-h-screen flex bg-[#f5f7f3] text-slate-800">
      <aside
        data-testid="sidebar"
        className={`fixed lg:static z-40 inset-y-0 left-0 w-72 bg-[#043927] text-emerald-50 transform transition-transform duration-300 shadow-[0_20px_50px_rgba(4,57,39,0.25)] ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(4,57,39,0.96), rgba(5,79,55,0.94)), url('https://images.unsplash.com/photo-1698967406711-ede239b6c07e?auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="h-full flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 islamic-pattern opacity-70" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Moon className="w-6 h-6 text-emerald-950" />
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">{profile.name}</div>
                <div className="text-[10px] text-amber-200 tracking-[0.25em] uppercase">Sistem Keuangan</div>
              </div>
            </div>

            <nav className="p-4 space-y-1.5">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    data-testid={n.testId}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? "bg-white/10 text-amber-300 border border-amber-400/30 shadow-inner shadow-amber-300/10"
                        : "text-emerald-50/80 hover:bg-white/5 hover:text-white"
                    } ${n.highlight && !active ? "ring-1 ring-amber-400/20" : ""}`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-amber-300" : "text-emerald-100/90 group-hover:text-amber-200"}`} />
                    <span>{n.label}</span>
                    {n.highlight && (
                      <span className="ml-auto text-[9px] uppercase tracking-[0.2em] bg-amber-400/15 text-amber-200 px-2 py-1 rounded-full border border-amber-400/20">
                        Jumat
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto p-4 border-t border-white/10 bg-emerald-950/25 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/80 mb-3">Akses publik</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-emerald-950 font-bold flex items-center justify-center">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">Pengurus Masjid</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-amber-200/90">Mode publik</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <button className="lg:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setOpen(false)} aria-label="Close menu" />
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:px-8 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              data-testid="sidebar-toggle"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800">
                  <Building2 className="w-3.5 h-3.5" />
                  {profile.name}
                </div>
                <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-sm shadow-amber-300/40">
                  <HandCoins className="w-3.5 h-3.5" />
                  Infaq cepat
                </button>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {formatTanggalID(new Date().toISOString())} · <span className="font-semibold text-emerald-800">{toHijri()}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div
              className="mb-8 overflow-hidden rounded-[28px] border border-emerald-100 bg-white/70 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(4,57,39,0.95), rgba(6,95,70,0.8)), url('https://images.unsplash.com/photo-1584027123930-c1f17b17ee1a?auto=format&fit=crop&w=1400&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl text-white">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-100">
                    Dashboard Masjid
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Assalamu&apos;alaikum, semoga amanah selalu hadir.</h1>
                  <p className="mt-3 text-sm text-emerald-50/85 md:text-base">
                    Pantau pemasukan, pengeluaran, dan program masjid dengan laporan yang lebih rapi, jelas, dan mudah dibaca.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm text-white">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200">Saldo terkini</div>
                  <div className="mt-2 text-2xl font-bold">Rp 0</div>
                </div>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
