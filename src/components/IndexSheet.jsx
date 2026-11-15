import '../styles/index-buku.css'
import { proper } from '../lib/proper.js'

export const KOLOM_PER_BLOK = 17
export const BLOK_PER_BUKU = 6
export const BARIS_PER_HALAMAN = 46

// Satu halaman = satu blok (17 kolom bernomor) x satu potongan 46 baris nama.
function Halaman({ daftar, mulaiBaris, nomorAwal, pemisah }) {
  const kolom = Array.from({ length: KOLOM_PER_BLOK }, (_, j) => nomorAwal + j)
  const baris = Array.from({ length: BARIS_PER_HALAMAN }, (_, r) => mulaiBaris + r)
  return (
    <div className={'idx-halaman' + (pemisah ? ' idx-pemisah' : '')}>
      <table className="idx-tabel">
        <colgroup>
          <col style={{ width: '8.96mm' }} />
          <col style={{ width: '25.16mm' }} />
          {kolom.map((n) => (
            <col key={n} style={{ width: '8.46mm' }} />
          ))}
        </colgroup>
        <tbody>
          <tr className="idx-judul">
            <td>No.</td>
            <td>Nama</td>
            {kolom.map((n) => (
              <td key={n} className="idx-garis" />
            ))}
          </tr>
          <tr className="idx-nomor">
            <td />
            <td />
            {kolom.map((n) => (
              <td key={n} className="idx-kotak">
                {n}
              </td>
            ))}
          </tr>
          {baris.map((i) => (
            <tr key={i} className={'idx-data' + ((i + 1) % 2 === 0 ? ' idx-selang' : '')}>
              <td className="idx-no">{i + 1}</td>
              <td className="idx-nm">{proper(daftar[i])}</td>
              {kolom.map((n) => (
                <td key={n} className="idx-kosong" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function jumlahHalamanBaris(jumlahNama) {
  return Math.max(1, Math.ceil(jumlahNama / BARIS_PER_HALAMAN))
}

// buku: 0 (nomor 1-102) atau 1 (103-204). blok: 0-5, atau null untuk semua blok.
export default function IndexSheet({ daftar, buku, blok }) {
  const bloks = blok === null ? Array.from({ length: BLOK_PER_BUKU }, (_, b) => b) : [blok]
  const halamanBaris = jumlahHalamanBaris(daftar.length)
  const daftarHalaman = []
  for (const b of bloks) {
    const nomorAwal = buku * BLOK_PER_BUKU * KOLOM_PER_BLOK + b * KOLOM_PER_BLOK + 1
    for (let h = 0; h < halamanBaris; h++) {
      daftarHalaman.push({ b, h, nomorAwal, mulaiBaris: h * BARIS_PER_HALAMAN })
    }
  }
  return (
    <div>
      {daftarHalaman.map((p, k) => (
        <Halaman
          key={`${p.b}-${p.h}`}
          daftar={daftar}
          mulaiBaris={p.mulaiBaris}
          nomorAwal={p.nomorAwal}
          pemisah={k < daftarHalaman.length - 1}
        />
      ))}
    </div>
  )
}
