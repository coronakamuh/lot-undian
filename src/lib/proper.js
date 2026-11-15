// Menyamai fungsi PROPER di Excel: huruf pertama tiap kata kapital, sisanya kecil.
export function proper(teks) {
  return (teks || '')
    .toLowerCase()
    .replace(/(^|[^\p{L}])(\p{L})/gu, (_, awal, huruf) => awal + huruf.toUpperCase())
}
