# AMPRESETFIND

Struktur:
- `public/index.html`  kerangka halaman
- `public/style.css`   semua tampilan
- `public/script.js`   logika (cari, paste, reset)
- `server.js`          server Node biasa
- `api/find.js`        fungsi API untuk Vercel

1. `npm install`
2. `npm start`
3. Buka http://localhost:3000 (ganti port: `PORT=8080 npm start`)

Butuh Node.js 16+. Hosting: Railway, Render, atau VPS (start command: `npm start`).
Halaman memanggil `/api/find` di server ini, lalu server meneruskan ke bintangapi.my.id
dengan header yang sama seperti script bot.

## Error "File not found!" / "not valid JSON"
Artinya halaman nggak nemu server `/api/find`. Penyebab umum:
- index.html dibuka langsung / di-upload ke hosting statis (tanpa server). Jalankan `npm start`.
- Deploy di Vercel: sudah didukung lewat `api/find.js`, upload seluruh folder (bukan cuma `public/`).
