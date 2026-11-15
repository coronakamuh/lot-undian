// Fungsi murni untuk mengatur urutan daftar. `pilih` adalah Set berisi id.

// Geser semua yang dipilih satu langkah ke atas/bawah; urutan relatif di antara mereka tetap.
export function geser(daftar, pilih, arah) {
  const hasil = [...daftar]
  const n = hasil.length
  if (arah < 0) {
    for (let i = 1; i < n; i++) {
      if (pilih.has(hasil[i].id) && !pilih.has(hasil[i - 1].id)) {
        ;[hasil[i - 1], hasil[i]] = [hasil[i], hasil[i - 1]]
      }
    }
  } else {
    for (let i = n - 2; i >= 0; i--) {
      if (pilih.has(hasil[i].id) && !pilih.has(hasil[i + 1].id)) {
        ;[hasil[i + 1], hasil[i]] = [hasil[i], hasil[i + 1]]
      }
    }
  }
  return hasil
}

// Pindahkan semua yang dipilih sebagai satu blok (urutan relatif tetap) agar mulai di nomor tertentu.
export function pindahKe(daftar, pilih, nomor) {
  const dipindah = daftar.filter((d) => pilih.has(d.id))
  const sisa = daftar.filter((d) => !pilih.has(d.id))
  const posisi = Math.min(Math.max(Math.round(nomor) - 1, 0), sisa.length)
  return [...sisa.slice(0, posisi), ...dipindah, ...sisa.slice(posisi)]
}

// Beri nomor urut 1..n sesuai posisi sekarang.
export function beriUrutan(daftar) {
  return daftar.map((d, i) => ({ ...d, urutan: i + 1 }))
}
