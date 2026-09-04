import { useState } from "react";
import { toast } from "sonner";
import { FileUp, Landmark, CheckCircle2, AlertCircle } from "lucide-react";
import { api, formatIDR, formatTanggalPendek } from "./api";

function parseAmount(value) {
  const raw = String(value || "").trim().replace(/[^0-9,.-]/g, "");
  if (!raw) return 0;
  const normalized = raw.includes(",") && raw.includes(".")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function parseDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parts = text.split(/[\/.-]/).map(Number);
  if (parts.length === 3) {
    const [first, second, third] = parts;
    const year = first > 31 ? first : third;
    const month = first > 31 ? second : second;
    const day = first > 31 ? third : first;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const find = (...names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0);
  const dateIndex = find("tanggal", "date", "tanggaltransaksi");
  const descriptionIndex = find("keterangan", "deskripsi", "description", "remark");
  const amountIndex = find("jumlah", "nominal", "amount", "kredit", "credit");
  const referenceIndex = find("referensi", "reference", "noref", "idtransaksi");
  if (dateIndex === undefined || amountIndex === undefined) return [];
  return lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((value) => value.trim().replace(/^"|"$/g, ""));
    return {
      date: parseDate(values[dateIndex]),
      description: values[descriptionIndex] || "Transfer masuk BSI",
      amount: parseAmount(values[amountIndex]),
      reference: referenceIndex === undefined ? "" : values[referenceIndex],
    };
  }).filter((row) => row.date && row.amount > 0);
}

export default function MutasiBSI() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const readFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(reader.result);
      setRows(parsed);
      if (!parsed.length) toast.error("CSV tidak terbaca. Pastikan ada kolom Tanggal dan Jumlah/Kredit.");
      else toast.success(`${parsed.length} mutasi siap diperiksa`);
    };
    reader.readAsText(file);
  };

  const importRows = async () => {
    if (!rows.length) return;
    setLoading(true);
    try {
      const { data } = await api.post("/mutations/import", { rows });
      toast.success(`${data.imported} mutasi dicatat, ${data.skipped} duplikat dilewati`);
      setRows([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Mutasi belum dapat disimpan. Pastikan API dan database aktif.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="bsi-mutations-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Rekening Masjid</div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Deteksi Mutasi BSI</h1>
        <p className="text-slate-600 mt-1">Impor file CSV mutasi BSI untuk mengenali pemasukan dan mencatatnya otomatis.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center"><Landmark /></div>
            <div><h2 className="font-bold text-emerald-950">Impor mutasi rekening</h2><p className="text-sm text-slate-500">Format CSV dari BSI</p></div>
          </div>
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-5 text-center">
            <FileUp className="mx-auto text-emerald-700" />
            <p className="text-sm text-slate-600 mt-2">Kolom minimal: Tanggal, Keterangan, Jumlah/Kredit</p>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-900">
              <FileUp className="w-4 h-4" /> Pilih file CSV
              <input data-testid="bsi-csv-input" type="file" accept=".csv,text/csv" onChange={readFile} className="hidden" />
            </label>
          </div>
          <div className="flex gap-2 text-xs text-slate-500"><AlertCircle className="w-4 h-4 shrink-0" />Data hanya dibaca dari file yang Anda pilih. Tidak meminta PIN, password, atau OTP BSI.</div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-bold text-emerald-950">Pemeriksaan mutasi</h2><p className="text-sm text-slate-500">Pastikan data benar sebelum dicatat.</p></div><span className="text-sm font-semibold text-emerald-700">{rows.length} baris</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm"><thead className="bg-emerald-50 text-emerald-900"><tr className="text-left"><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Keterangan</th><th className="px-3 py-2 text-right">Pemasukan</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{!rows.length && <tr><td colSpan={3} className="py-10 text-center text-slate-400">Belum ada file mutasi</td></tr>}{rows.map((row, index) => <tr key={`${row.reference}-${index}`}><td className="px-3 py-2 whitespace-nowrap">{formatTanggalPendek(row.date)}</td><td className="px-3 py-2">{row.description}</td><td className="px-3 py-2 text-right font-semibold text-emerald-700">{formatIDR(row.amount)}</td></tr>)}</tbody>
            </table>
          </div>
          <button data-testid="bsi-import-button" disabled={!rows.length || loading} onClick={importRows} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-emerald-950 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{loading ? "Menyimpan..." : "Catat pemasukan"}</button>
        </section>
      </div>
    </div>
  );
}