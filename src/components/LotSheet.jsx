import '../styles/lot.css'

const PER_BARIS = 5
const BARIS_PER_HALAMAN = 12

// daftar: array nama berurutan. Mengembalikan halaman -> baris -> 5 sel (nomor, nama).
export function susunLot(daftar) {
  const baris = []
  for (let i = 0; i < daftar.length; i += PER_BARIS) {
    const sel = []
    for (let j = 0; j < PER_BARIS; j++) {
      const idx = i + j
      sel.push(idx < daftar.length ? { nomor: idx + 1, nama: daftar[idx] } : { nomor: '', nama: '' })
    }
    baris.push(sel)
  }
  const halaman = []
  for (let i = 0; i < baris.length; i += BARIS_PER_HALAMAN) {
    halaman.push(baris.slice(i, i + BARIS_PER_HALAMAN))
  }
  return halaman
}

export default function LotSheet({ daftar }) {
  const halaman = susunLot(daftar)
  return (
    <div className="lot-halaman">
      {halaman.map((barisHalaman, h) => (
        <div key={h} className={h < halaman.length - 1 ? 'lot-pemisah-halaman' : ''}>
          {barisHalaman.map((sel, b) => (
            <div key={b} className="lot-baris">
              {sel.map((s, k) => (
                <div key={k} className="lot-sel">
                  <div className="lot-nomor">{s.nomor}</div>
                  <div className="lot-nama">{s.nama}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
