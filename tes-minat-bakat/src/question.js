// src/questions.js

export const questions = [
  // --- BAGIAN 1: MINAT (RIASEC) - Tipe 'scale' (Wajah) ---
  {
    id: 51,
    type: 'scale', 
    text: "Membongkar dan merakit mesin",
    category: "Realistic"
  },
  {
    id: 91,
    type: 'scale',
    text: "Memikirkan program TV dan memproduksi programnya",
    category: "Artistic"
  },
  {
    id: 53,
    type: 'scale',
    text: "Mendengarkan keluh kesah orang lain",
    category: "Social"
  },
  {
    id: 54,
    type: 'scale',
    text: "Mengatur buku rekening rumah tangga",
    category: "Conventional"
  },
  {
    id: 56,
    type: 'scale',
    text: "Menjual barang mahal",
    category: "Enterprising"
  },
  {
    id: 68,
    type: 'scale',
    text: "Mempelajari asal usul alam semesta dan bumi",
    category: "Investigative"
  },

  // --- BAGIAN 2: KEPRIBADIAN - Tipe 'choice' (Kiri vs Kanan) ---
  // Logika sederhana: Kiri nambah poin kategori A, Kanan nambah poin kategori B
  {
    id: 101,
    type: 'choice',
    textLeft: "Saya tidak suka menyakiti perasaan orang lain",
    textRight: "Saya tidak suka melakukan hal yang berlawanan dengan fakta",
    categoryLeft: "Social",       // Jika pilih kiri, nambah skor Social
    categoryRight: "Realistic"    // Jika pilih kanan, nambah skor Realistic
  },
  {
    id: 102,
    type: 'choice',
    textLeft: "Lebih suka mempersiapkan sesuatu terlebih dahulu",
    textRight: "Lebih suka bertindak sesuai situasi saat itu",
    categoryLeft: "Conventional",
    categoryRight: "Artistic"
  },
  {
    id: 103,
    type: 'choice',
    textLeft: "Penting untuk memikirkan sesuatu secara rasional",
    textRight: "Penting untuk mempertimbangkan perasaan orang lain",
    categoryLeft: "Investigative",
    categoryRight: "Social"
  }
];