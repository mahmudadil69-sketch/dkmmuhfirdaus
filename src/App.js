import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "./AppShell";
import Dashboard from "./Dashboard";
import Transaksi from "./Transaksi";
import MutasiBSI from "./MutasiBSI";
import Kategori from "./Kategori";
import Donatur from "./Donatur";
import Program from "./Program";
import LaporanJumat from "./LaporanJumat";
import LaporanPeriode from "./LaporanPeriode";
import ProfilMasjid from "./ProfilMasjid";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="transaksi" element={<Transaksi />} />
              <Route path="mutasi-bsi" element={<MutasiBSI />} />
              <Route path="kategori" element={<Kategori />} />
              <Route path="donatur" element={<Donatur />} />
              <Route path="program" element={<Program />} />
              <Route path="laporan-jumat" element={<LaporanJumat />} />
              <Route path="laporan-periode" element={<LaporanPeriode />} />
              <Route path="profil-masjid" element={<ProfilMasjid />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

