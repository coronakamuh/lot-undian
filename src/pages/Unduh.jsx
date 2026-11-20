import { useEffect, useState } from 'react'
import { Download, Loader2, FileSpreadsheet } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { ambilNama, pesanError } from '../lib/namaApi.js'
import { unduhExcel, MAKS_NAMA } from '../lib/excelExport.js'

const SHEET = [
  ['LOT', 'kotak nama (6 per baris, 216 kotak) untuk dipotong dan diundi'],
  ['SUMBER', 'daftar induk nama'],
  ['INDEX', 'buku index 1 (nomor 1–102)'],
  ['INDEX (2)', 'buku index 2 (nomor 103–204)'],
  ['print folio', 'daftar iuran 200 nomor (4 blok × 50), untuk dicetak di kertas folio'],
  ['Laporan Kas', 'laporan kas musholla (tetap, tidak berubah)'],
]

export default function Unduh() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const [mengunduh, setMengunduh] = useState(false)
  const [galatUnduh, setGalatUnduh] = useState('')

  const muat = async () => {
    setMemuat(true)
    setGagal('')
    try {
      const data = await ambilNama()
      setDaftar(data.map((d) => d.nama))
    } catch (e) {
      setGagal(pesanError(e))
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muat()
  }, [])

  const unduh = async () => {
    setMengunduh(true)
    setGalatUnduh('')
    try {
      await unduhExcel(daftar)
    } catch (e) {
      setGalatUnduh(e?.message || 'Gagal membuat file Excel. Coba lagi.')
    } finally {
      setMengunduh(false)
    }
  }

  return (
    <>
      <PageTitle judul="Unduh" deskripsi="Satu file Excel berisi semua lembar: lot, index, dan lembaran iuran." />

      {memuat ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] py-14 text-sm text-[var(--muted)]">
          <Loader2 size={18} className="animate-spin" /> Memuat daftar nama…
        </div>
      ) : gagal ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--text)]">{gagal}</p>
          <button
            type="button"
            onClick={muat}
            className="mt-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--navy-soft)]"
          >
            Coba lagi
          </button>
        </div>
      ) : daftar.length === 0 ? (
        <EmptyState
          ikon={FileSpreadsheet}
          judul="Belum ada nama untuk diunduh"
          keterangan="Tambahkan nama di menu Nama, lalu kembali ke sini."
        />
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--text)]">
            <span className="font-semibold">{daftar.length} nama</span> akan dimasukkan ke file{' '}
            <span className="font-medium">lot-index.xlsx</span>.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)]">
            {SHEET.map(([nama, ket]) => (
              <li key={nama}>
                <span className="font-medium text-[var(--text)]">{nama}</span> — {ket}
              </li>
            ))}
          </ul>
          {daftar.length > MAKS_NAMA && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              File Excel hanya mendukung sampai {MAKS_NAMA} nama (sekarang {daftar.length}). Hapus beberapa nama dulu.
            </p>
          )}
          {galatUnduh && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {galatUnduh}
            </p>
          )}
          <button
            type="button"
            onClick={unduh}
            disabled={mengunduh || daftar.length > MAKS_NAMA}
            className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--navy)] px-5 py-3 text-sm font-medium text-[var(--on-navy)] disabled:opacity-60"
          >
            {mengunduh ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Unduh Excel
          </button>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Hanya nama dan urutan yang berubah; ukuran sel dan pengaturan cetak sama dengan file asli. Cetak dari Excel.
          </p>
        </div>
      )}
    </>
  )
}
