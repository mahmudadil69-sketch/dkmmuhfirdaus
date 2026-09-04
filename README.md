# KasMasjid

Aplikasi pengelolaan keuangan masjid untuk transaksi, donatur, program, mutasi BSI, dan laporan.

## Struktur

- `src/` - aplikasi React
- `server.py` - API FastAPI dan integrasi MongoDB
- `.env.example` - template konfigurasi lokal/deploy

## Menjalankan frontend

Prasyarat: Node.js 18 atau lebih baru.

```bash
npm install
npm start
```

Frontend berjalan di `http://localhost:3000`.

## Menjalankan backend

Prasyarat: Python 3.10 atau lebih baru dan MongoDB.

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn server:app --reload --port 8000
```

Isi `.env` dengan `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, dan password admin yang kuat sebelum digunakan di luar lokal. Jangan unggah `.env` ke GitHub.

## Konfigurasi frontend

Atur `REACT_APP_BACKEND_URL` di `.env` sebelum build produksi, misalnya:

```env
REACT_APP_BACKEND_URL=https://api.example.com
```

Build produksi:

```bash
npm run build
```

Folder `build/` dapat di-deploy ke layanan static hosting. Backend membutuhkan layanan Python/FastAPI dan MongoDB yang dapat diakses oleh server.

## GitHub

```bash
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Pastikan `.env`, kredensial MongoDB, JWT secret, dan password admin tidak pernah ditambahkan ke repository.
