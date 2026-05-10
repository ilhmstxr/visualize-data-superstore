# Global Sales Hierarchy Visualization (Superstore)

Proyek ini adalah sebuah visualisasi data interaktif berbasis **D3.js** yang dirancang untuk membedah dan melacak performa **Sales (Penjualan)** dan **Profit (Keuntungan)** dari dataset Superstore.

Data disajikan menggunakan model **Collapsible Horizontal Tree**, yang memungkinkan pengguna untuk menjelajahi hierarki data yang sangat besar (lebih dari 10.000 titik data) secara responsif dan tanpa membuat browser menjadi lambat (*ngelag*).

## 📊 Tentang Visualisasi Superstore
Visualisasi ini bertujuan untuk memberikan gambaran komprehensif mulai dari gambaran besar (makro) hingga detail paling kecil (mikro) pada setiap pesanan:
- **Pelacakan Hierarkis**: Pengguna dapat menelusuri data dari level Tahun, Kuartal, Negara, Kategori, hingga level Produk dan Order ID secara spesifik.
- **Analisis Sales & Profit**: Setiap titik (node) dalam visualisasi—baik itu cabang organisasi maupun ujung daun (produk)—menyimpan informasi agregasi total *Sales* dan *Profit*.
- **Indikator Visual**: Tooltip dirancang sedemikian rupa untuk menonjolkan status finansial. Profit yang positif akan ditampilkan dengan warna **Hijau**, sedangkan profit yang mengalami kerugian (minus) akan di-highlight dengan warna **Merah**.

## 🚀 Cara Penggunaan & Instalasi

Karena proyek ini menggunakan fungsi `fetch()` dari Javascript untuk memuat file JSON lokal, Anda **wajib** menjalankannya melalui sebuah Local Web Server (seperti Laragon, XAMPP, Node `http-server`, atau ekstensi Live Server di VS Code). Jika dibuka dengan klik ganda (*file:///...*), browser akan memblokir data karena alasan keamanan (CORS).

### Langkah-langkah:
1. Pastikan seluruh file proyek berada di dalam folder *document root* lokal server Anda (contohnya di `C:\laragon\www\davis\` atau `htdocs`).
2. Jalankan aplikasi Local Server Anda (misal: klik tombol **Start All** pada Laragon).
3. Buka browser (Chrome, Edge, Firefox, dll).
4. Akses URL proyek Anda, contohnya: `http://localhost/davis/index.html` (sesuaikan dengan nama folder Anda).
5. **Interaksi:**
   - **Klik** pada lingkaran berwana ungu kebiruan untuk membuka (expand) cabang atau melipatnya (collapse).
   - **Arahkan kursor (Hover)** pada titik/node manapun untuk memunculkan detail angka Penjualan (Sales) dan Keuntungan (Profit).
   - Gunakan fitur pan/drag untuk menggeser kanvas, dan *scroll* untuk melakukan *Zoom-in / Zoom-out*.
   - Klik tombol **Reset View** di pojok kanan atas untuk mengembalikan posisi visualisasi ke tengah layar.

## 📂 Struktur Direktori

- `index.html` : Struktur dasar HTML dan desain antarmuka (CSS) aplikasi.
- `script.js` : Logika utama D3.js yang mengurus *rendering* SVG, Collapsible Tree, Tooltip, dan Zoom/Pan.
- `hierarchy.json` : File data utama yang berisi struktur JSON berjenjang dan metrik yang telah diagregasi (Pre-computed).

---
*Dibuat menggunakan HTML5, Vanilla CSS, dan D3.js v7.*
