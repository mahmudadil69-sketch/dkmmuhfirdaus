import { Building2, Save, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMasjidProfile, saveMasjidProfile } from "./masjidProfile";

const SHEET_STATUS_KEY = "kasMasjidSheetStatus";

export default function ProfilMasjid() {
  const [profile, setProfile] = useState(getMasjidProfile());
  const [sheetUrl, setSheetUrl] = useState(profile.sheetUrl || "");
  const [status, setStatus] = useState({
    enabled: false,
    status: "Belum diatur",
    lastSync: "",
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SHEET_STATUS_KEY) || "{}");
      setStatus({
        enabled: Boolean(saved.enabled),
        status: saved.status || "Belum diatur",
        lastSync: saved.lastSync || "",
      });
    } catch {
      setStatus({ enabled: false, status: "Belum diatur", lastSync: "" });
    }
  }, []);

  const handleSave = () => {
    const next = saveMasjidProfile({ ...profile, sheetUrl });
    const nextStatus = {
      enabled: Boolean(sheetUrl.trim()),
      status: sheetUrl.trim() ? "Sudah aktif" : "Belum diatur",
      lastSync: new Date().toISOString(),
    };

    localStorage.setItem(SHEET_STATUS_KEY, JSON.stringify(nextStatus));
    setProfile(next);
    setStatus(nextStatus);
    toast.success("Profil masjid berhasil disimpan");
  };

  const handleTestSync = async () => {
    if (!sheetUrl.trim()) {
      toast.error("Masukkan URL spreadsheet terlebih dahulu");
      return;
    }

    try {
      const payload = {
        source: "KasMasjid",
        masjid: profile.name,
        updatedAt: new Date().toISOString(),
        status: "sync_test",
      };

      const form = new FormData();
      form.append("payload", JSON.stringify(payload));
      await fetch(sheetUrl, {
        method: "POST",
        mode: "no-cors",
        body: form,
      });

      const next = {
        enabled: true,
        status: "Sinkronisasi dikirim",
        lastSync: new Date().toISOString(),
      };
      localStorage.setItem(SHEET_STATUS_KEY, JSON.stringify(next));
      setStatus(next);
      toast.success("Sinkronisasi ke spreadsheet berhasil dijalankan");
    } catch {
      toast.error("URL spreadsheet tidak valid. Cek kembali form atau script Google");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Profil Masjid</h1>
        <p className="text-slate-600 mt-1">Ubah nama masjid, kontak, dan sinkronisasi data ke spreadsheet.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Identitas</div>
              <h2 className="text-xl font-bold text-emerald-950">Data masjid</h2>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Nama Masjid</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Slogan / tagline</label>
            <input
              value={profile.slogan}
              onChange={(e) => setProfile({ ...profile, slogan: e.target.value })}
              className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Alamat</label>
            <input
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Telepon</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">Email</label>
              <input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold"
          >
            <Save className="w-4 h-4" /> Simpan Profil
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Spreadsheet</div>
              <h2 className="text-xl font-bold text-emerald-950">Sinkron data</h2>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-600">URL Spreadsheet / Apps Script</label>
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://script.google.com/..."
              className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
            <div><strong>Status:</strong> {status.status}</div>
            <div className="mt-1"><strong>Terakhir:</strong> {status.lastSync ? new Date(status.lastSync).toLocaleString("id-ID") : "Belum pernah"}</div>
          </div>

          <button
            onClick={handleTestSync}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
          >
            <Database className="w-4 h-4" /> Uji Sinkronisasi
          </button>

          <div className="text-sm text-slate-600 leading-relaxed">
            Gunakan URL Google Apps Script atau endpoint form untuk menerima data dari aplikasi ini. Data akan tersimpan di spreadsheet Anda tanpa mengganggu proses operasional harian masjid.
          </div>
        </div>
      </div>
    </div>
  );
}
