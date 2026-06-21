/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quiz, QuestionType } from '../types';

export const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: '1',
    title: 'Kuis Logika & Pemrograman Web Dasar',
    description: 'Uji pemahaman Anda tentang fondasi HTML, CSS, JavaScript, serta konsep logika pemrograman umum dengan berbagai tipe soal interaktif.',
    durationMinutes: 10,
    createdBy: 'Admin Pintar',
    createdAt: '2026-06-20T10:00:00Z',
    questions: [
      {
        id: 'q1_1',
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Manakah dari tag HTML berikut yang digunakan secara khusus untuk membuat baris baru dalam sebuah tabel (*table row*)?',
        options: [
          'A. <td>',
          'B. <tr>',
          'C. <th>',
          'D. <br>'
        ],
        correctAnswer: 'B',
        points: 20
      },
      {
        id: 'q1_2',
        type: QuestionType.TRUE_FALSE,
        questionText: 'Dalam JavaScript, konstanta yang dideklarasikan menggunakan kata kunci `const` nilainya dapat diubah atau diredistribusi (*reassigned*) di baris kode berikutnya.',
        correctAnswer: 'FALSE',
        points: 20
      },
      {
        id: 'q1_3',
        type: QuestionType.SHORT_ANSWER,
        questionText: 'Sebutkan nama metode CSS yang digunakan untuk membuat layout dua dimensi yang terdiri atas baris (*rows*) dan kolom (*columns*) secara terstruktur! (Tuliskan jawabannya menggunakan huruf kecil semua)',
        correctAnswer: 'grid',
        points: 20
      },
      {
        id: 'q1_4',
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Metode HTTP manakah yang paling direkomendasikan untuk digunakan ketika mengirimkan data sensitif (seperti password) dari browser ke backend server?',
        options: [
          'A. GET',
          'B. OPTIONS',
          'C. POST',
          'D. PATCH'
        ],
        correctAnswer: 'C',
        points: 20
      },
      {
        id: 'q1_5',
        type: QuestionType.SHORT_ANSWER,
        questionText: 'Apa output dari operasi matematika `10 % 3` dalam bahasa pemrograman umum? (Tuliskan dalam angka)',
        correctAnswer: '1',
        points: 20
      }
    ]
  },
  {
    id: '2',
    title: 'Studi Kasus: Strategi Pivot Kedai Kopi "Sore Kalem"',
    description: 'Analisis mendalam mengenai tantangan operasional kedai kopi lokal pasca-pandemi yang menghadapi kenaikan tarif sewa tempat usaha fisik.',
    durationMinutes: 20,
    createdBy: 'Dosen Bisnis',
    createdAt: '2026-06-21T08:00:00Z',
    questions: [
      {
        id: 'q2_1',
        type: QuestionType.ESSAY_CASE,
        caseStudyText: `## LATAR BELAKANG KASUS

Kedai Kopi **"Sore Kalem"** didirikan pada akhir tahun 2021 di pusat kota Yogyakarta oleh tiga sekawan alumni universitas lokal. Mengusung konsep *cozy space* dengan nuansa estetik minimalis industrial, kedai ini dengan cepat menjadi tempat favorit berkumpul (*coworking space*) mahasiswa dan pekerja lepas (*freelancer*).

Awalnya, bisnis berjalan sangat lancar dengan rata-rata penjualan mencapai 150 cangkir kopi per hari. Namun, memasuki pertengahan tahun 2026, pemilik gedung menyampaikan bahwa biaya sewa tempat untuk periode berikutnya akan **naik sebesar 45%** akibat revitalisasi kawasan wisata sekitar.

### ANALISIS KEUANGAN & OPERASIONAL
Berikut adalah ringkasan performa bulanan rata-rata saat ini:
- **Pendapatan Bersih:** Rp 45.000.000 / bulan
- **Biaya Bahan Baku (HPP):** Rp 13.500.000 / bulan (30% dari omzet)
- **Sewa Tempat (Lama):** Rp 10.000.000 / bulan
- **Gaji 3 Barista Part-Time:** Rp 7.500.000 / bulan
- **Utilitas (Listrik, WiFi, Air):** Rp 4.000.000 / bulan
- **Laba Bersih Saat Ini:** Rp 10.000.000 / bulan

**Proyeksi Skenario Sewa Baru:**
Jika kedai tetap bertahan di lokasi lama dengan sewa baru sebesar **Rp 14.500.000 / bulan**, ditambah biaya bahan baku yang merangkak naik, laba bersih kedai diproyeksikan akan anjlok menjadi kurang dari Rp 5.000.000 per bulan. Angka ini dinilai terlalu berisiko dan tidak sebanding dengan beban kerja operasional yang dikelola.

### RENCANA STRATEGIS (PIVOT)
Manajemen mempertimbangkan dua opsi pivot strategis untuk menyelamatkan bisnis:
1. **Opsi A (Cloud Kitchen & Delivery-Only):** Menutup kedai fisik sepenuhnya, menyewa ruang dapur bersama (*shared kitchen*) yang jauh lebih murah (hanya Rp 3.000.000/bulan) di area pemukiman, dan memfokuskan penjualan 100% pada platform *food delivery* online (GoFood, GrabFood, ShopeeFood) serta rilis produk kopi literan dalam kemasan siap minum.
2. **Opsi B (Hybrid Co-branding):** Menjalin kemitraan dengan toko buku lokal yang memiliki area kosong di lantai dua mereka. Konsepnya adalah membagi biaya sewa tempat (hanya membayar Rp 5.000.000/bulan) dan menerapkan taktik cross-promotion (beli buku gratis diskon kopi, beli kopi gratis membaca buku premium).`,
        questionText: 'Berdasarkan uraian studi kasus di atas, susunlah analisis SWOT (Strengths, Weaknesses, Opportunities, Threats) ringkas apabila manajemen memutuskan untuk memilih **Opsi A (Cloud Kitchen & Delivery-Only)**! Berikan minimal 1 poin penjelasan yang relevan untuk masing-masing kuadran SWOT tersebut.',
        correctAnswer: 'Jawaban essay akan dinilai secara mandiri atau didiskusikan bersama kelompok belajar. Contoh Kunci Jawaban: \n- Strength: Penghematan biaya operasional sewa hingga 70%, fokus penuh pada efisiensi dapur.\n- Weakness: Kehilangan loyalitas pelanggan fisik (mahasiswa yang suka nugas), ketergantungan tinggi pada potongan komisi ojek online.\n- Opportunity: Jangkauan pasar lebih luas di area perumahan yang padat penduduk lewat promo digital.\n- Threat: Persaingan ketat di ekosistem digital/delivery-only café tanpa adanya aset brand fisik (social presence).',
        points: 50
      },
      {
        id: 'q2_2',
        type: QuestionType.ESSAY_CASE,
        caseStudyText: `## LATAR BELAKANG KASUS

Kedai Kopi **"Sore Kalem"** didirikan pada akhir tahun 2021 di pusat kota Yogyakarta oleh tiga sekawan alumni universitas lokal. Mengusung konsep *cozy space* dengan nuansa estetik minimalis industrial, kedai ini dengan cepat menjadi tempat favorit berkumpul (*coworking space*) mahasiswa dan pekerja lepas (*freelancer*).

Awalnya, bisnis berjalan sangat lancar dengan rata-rata penjualan mencapai 150 cangkir kopi per hari. Namun, memasuki pertengahan tahun 2026, pemilik gedung menyampaikan bahwa biaya sewa tempat untuk periode berikutnya akan **naik sebesar 45%** akibat revitalisasi kawasan wisata sekitar.

### ANALISIS KEUANGAN & OPERASIONAL
Berikut adalah ringkasan performa bulanan rata-rata saat ini:
- **Pendapatan Bersih:** Rp 45.000.000 / bulan
- **Biaya Bahan Baku (HPP):** Rp 13.500.000 / bulan (30% dari omzet)
- **Sewa Tempat (Lama):** Rp 10.000.000 / bulan
- **Gaji 3 Barista Part-Time:** Rp 7.500.000 / bulan
- **Utilitas (Listrik, WiFi, Air):** Rp 4.000.000 / bulan
- **Laba Bersih Saat Ini:** Rp 10.000.000 / bulan

**Proyeksi Skenario Sewa Baru:**
Jika kedai tetap bertahan di lokasi lama dengan sewa baru sebesar **Rp 14.500.000 / bulan**, ditambah biaya bahan baku yang merangkak naik, laba bersih kedai diproyeksikan akan anjlok menjadi kurang dari Rp 5.000.000 per bulan. Angka ini dinilai terlalu berisiko dan tidak sebanding dengan beban kerja operasional yang dikelola.

### RENCANA STRATEGIS (PIVOT)
Manajemen mempertimbangkan dua opsi pivot strategis untuk menyelamatkan bisnis:
1. **Opsi A (Cloud Kitchen & Delivery-Only):** Menutup kedai fisik sepenuhnya, menyewa ruang dapur bersama (*shared kitchen*) yang jauh lebih murah (hanya Rp 3.000.000/bulan) di area pemukiman, dan memfokuskan penjualan 100% pada platform *food delivery* online (GoFood, GrabFood, ShopeeFood) serta rilis produk kopi literan dalam kemasan siap minum.
2. **Opsi B (Hybrid Co-branding):** Menjalin kemitraan dengan toko buku lokal yang memiliki area kosong di lantai dua mereka. Konsepnya adalah membagi biaya sewa tempat (hanya membayar Rp 5.000.000/bulan) dan menerapkan taktik cross-promotion (beli buku gratis diskon kopi, beli kopi gratis membaca buku premium).`,
        questionText: 'Seandainya manajemen lebih memilih **Opsi B (Hybrid Co-branding dengan Toko Buku)**, bagaimana cara mendesain promosi kolaboratif (*cross-promotion*) yang konkret untuk menarik minat mahasiswa kembali nongkrong sekaligus mendongkrak penjualan buku di toko mitra tersebut?',
        correctAnswer: 'Jawaban essay akan dinilai secara mandiri atau didiskusikan bersama kelompok belajar. Contoh Kunci Jawaban: \n- Menggunakan sistem bundling: Pembelian buku berlogo "Rekomendasi Bulan Ini" berhadiah voucher kopi diskon 30%.\n- Mengadakan event bulanan seperti "Ngopi nulis" atau book club meetups di area lantai dua tersebut.\n- Mengatur pencahayaan dan penempatan meja bernuansa perpustakaan estetik agar nyaman untuk belajar mandiri, bersanding dengan stop kontak melimpah.',
        points: 50
      }
    ]
  }
];

export const MOCK_ACTIVITIES = [
  {
    id: 'act1',
    username: 'Budi Santoso',
    quizTitle: 'Kuis Logika & Pemrograman Web Dasar',
    score: 80,
    completedAt: '2026-06-21T02:15:00-07:00'
  },
  {
    id: 'act2',
    username: 'Andi Wijaya',
    quizTitle: 'Studi Kasus: Strategi Pivot Kedai Kopi "Sore Kalem"',
    score: 100,
    completedAt: '2026-06-21T03:40:00-07:00'
  },
  {
    id: 'act3',
    username: 'Siti Rahma',
    quizTitle: 'Kuis Logika & Pemrograman Web Dasar',
    score: 100,
    completedAt: '2026-06-21T04:10:00-07:00'
  }
];
