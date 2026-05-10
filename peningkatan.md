A. Semantic Visual Encoding (Pewarnaan Cerdas)
Saat ini, warna node (lingkaran kecil) hanya menjadi kosmetik atau penanda level. Ubah fungsinya menjadi metrik bisnis!

Warna Node berdasarkan Profit: Modifikasi atribut fill pada node di D3.js Anda. Jika d.data.Profit < 0, warnai node tersebut menjadi Merah. Jika profit positif, warnai Hijau. Dengan ini, dalam satu lirikan mata, manajer bisa melihat "area merah" (kebocoran profit) di seluruh cabang perusahaan tanpa harus melakukan hover sama sekali.

Ukuran Node berdasarkan Sales: Modifikasi radius lingkaran (r). Semakin besar nilai d.data.Sales, semakin besar lingkarannya.

B. Collapsible Nodes (Interaksi Expand/Collapse)
Ini adalah obat mutlak untuk Hairball Effect. Jangan biarkan seluruh pohon mekar sekaligus saat halaman dimuat.

Buat agar saat website dibuka, pohon hanya menampilkan sampai level Category.

Pengguna harus mengklik (event on("click")) sebuah node untuk membuka cabang Region di bawahnya. Ini menerapkan prinsip Progressive Disclosure (jangan bombardir pengguna dengan info yang belum mereka minta).

C. Supplementary UI (Konteks Eksternal)
Sebuah chart D3.js sebaiknya tidak berdiri telanjang memenuhi seluruh layar.

Gunakan CSS/HTML untuk membagi layar. Biarkan 75% layar untuk Radial Tree.

Gunakan sisa 25% di sisi kiri atau kanan untuk membuat panel KPI (Key Performance Indicators) sederhana yang bereaksi saat node diklik (menampilkan Top 5 Customer di Region tersebut, atau rasio Profit margin).

---

## ✅ Implementasi Pola Data JSON (hierarchy.json)
Agar fitur **Semantic Visual Encoding** (Ukuran Node berdasarkan *Sales* & Warna berdasarkan *Profit*) dan **Panel KPI** (Profit Margin) dapat berjalan dengan baik di seluruh level hierarki organisasi (bukan hanya di ujung *leaf* node), setiap *Parent Node* di dalam `hierarchy.json` WAJIB memiliki atribut `Sales` dan `Profit` hasil agregasi. 

Pola data di `hierarchy.json` Anda sudah sesuai dan sangat baik. Berikut adalah contoh strukturnya agar sistem ini dapat terus berjalan dengan lancar saat ada penambahan data baru:

```json
{
  "name": "Superstore Analytics",
  "Sales": 2326534.35,
  "Profit": 292296.81,
  "children": [
    {
      "name": "2023",
      "Type": "Organizational Node",
      "Sales": 479807.58,
      "Profit": 49305.81,
      "children": [
        {
          "name": "Q1",
          "Type": "Organizational Node",
          "Sales": 70914.07,
          "Profit": 3697.64,
          "children": [
            {
              "name": "Furniture",
              "Type": "Organizational Node",
              "Sales": 20858.32,
              "Profit": -150.22,  // CONTOH PROFIT NEGATIF (Node akan otomatis berwarna Merah!)
              "children": [
                {
                  "name": "Consumer",
                  "Type": "Organizational Node",
                  "Sales": 8548.64,
                  "Profit": 195.94,
                  "children": [
                    // ... dan seterusnya sampai leaf node (Order ID / Product)
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```
**Catatan Penting Data:**
1. Karena node ukuran (`r`) ditarik dari nilai `Sales`, *node* induk (Superstore) akan terlihat sangat besar secara proporsional. Skala akar kuadrat (`d3.scaleSqrt()`) digunakan di `script.js` untuk mencegah lingkarannya menutupi seluruh layar.
2. Warna lingkaran dan indikator KPI secara *real-time* membaca properti `Profit` ini. Jika `< 0`, otomatis panel KPI dan Node D3 akan memerah.