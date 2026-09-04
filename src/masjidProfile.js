const KEY = "kasMasjidProfile";

export const defaultMasjidProfile = {
  name: "Masjid Al-Barokah",
  slogan: "Amanah, Transparan, Berkah",
  address: "Jl. Masjid No. 1, Kota Anda",
  phone: "0812-3456-7890",
  email: "bendahara@masjid.id",
  sheetUrl: "",
};

export function getMasjidProfile() {
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return defaultMasjidProfile;
    return { ...defaultMasjidProfile, ...JSON.parse(stored) };
  } catch {
    return defaultMasjidProfile;
  }
}

export function saveMasjidProfile(profile) {
  const next = { ...defaultMasjidProfile, ...profile };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
