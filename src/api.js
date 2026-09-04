import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${backendUrl.replace(/\/$/, "")}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: false,
});

export function formatIDR(value) {
  const n = Number(value || 0);
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatTanggalID(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTanggalPendek(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Approximate Hijri conversion (Umm al-Qura simplified) */
export function toHijri(date = new Date()) {
  const jd = Math.floor((date.getTime() - new Date(Date.UTC(1970, 0, 1)).getTime()) / 86400000) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  let l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  l2 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m = Math.floor((24 * l2) / 709);
  const d = l2 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;
  const months = [
    "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir",
    "Rajab", "Sya'ban", "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah",
  ];
  return `${d} ${months[m - 1]} ${y} H`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function nearestFridayISO(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const diff = (day - 5 + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}
