import { useEffect, useState } from 'react'
import { BookOpen, Download, Loader2 } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'
import IndexSheet, { BLOK_PER_BUKU, KOLOM_PER_BLOK, jumlahHalamanBaris } from '../components/IndexSheet.jsx'
import { ambilNama, pesanError } from '../lib/namaApi.js'
import { unduhExcel } from '../lib/excelExport.js'

const pilihan =
  'rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--navy)]'

export default function CetakIndex() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const [buku, setBuku] = useState(0)
  const [blok, setBlok] = useState('0')
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

  const semua = blok === 'semua'

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
  const halamanBaris = jumlahHalamanBaris(daftar.length)
  const totalHalaman = (semua ? BLOK_PER_BUKU : 1) * halamanBaris
  const nomorAwalBuku = buku * BLOK_PER_BUKU * KOLOM_PER_BLOK + 1
  const nomorAkhirBuku = nomorAwalBuku + BLOK_PER_BUKU * KOLOM_PER_BLOK - 1

  return (
    <>
      <div className="print:hidden">
        <PageTitle judul="Cetak Index" deskripsi="Buku index berisi nama dengan kolom bernomor untuk diisi tangan." />
      </div>

      {memuat ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] py-14 text-sm text-[var(--muted)] print:hidden">
          <Loader2 size={18} className="animate-spin" /> Memuat daftar nama…
        </div>
      ) : gagal ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-6 py-12 text-center print:hidden">
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
        <div className="print:hidden">
          <EmptyState
            ikon={BookOpen}
            judul="Belum ada buku index untuk dicetak"
            keterangan="Tambahkan nama di menu Nama, lalu kembali ke sini."
          />
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 print:hidden">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block">Buku</span>
                <select className={pilihan} value={buku} onChange={(e) => setBuku(Number(e.target.value))}>
                  <option value={0}>Buku 1 (nomor 1–102)</option>
                  <option value={1}>Buku 2 (nomor 103–204)</option>
                </select>
              </label>
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block">Blok kolom</span>
                <select className={pilihan} value={blok} onChange={(e) => setBlok(e.target.value)}>
                  {Array.from({ length: BLOK_PER_BUKU }, (_, b) => (
                    <option key={b} value={String(b)}>
                      Blok {b + 1} (nomor {nomorAwalBuku + b * KOLOM_PER_BLOK}–{nomorAwalBuku + (b + 1) * KOLOM_PER_BLOK - 1})
                    </option>
                  ))}
                  <option value="semua">Semua blok ({nomorAwalBuku}–{nomorAkhirBuku})</option>
                </select>
              </label>
              <button
                type="button"
                onClick={unduh}
                disabled={mengunduh}
                className="ml-auto flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-[var(--on-navy)] disabled:opacity-60"
              >
                {mengunduh ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Unduh Excel
              </button>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {daftar.length} nama, {totalHalaman} halaman. File Excel berisi sheet LOT, SUMBER, INDEX, dan INDEX (2) seperti
              file asli; hanya nama yang berubah. Cetak dari Excel di kertas A4.
            </p>
          </div>
          {galatUnduh && (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {galatUnduh}
            </p>
          )}
          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white p-2 print:overflow-visible print:rounded-none print:border-0 print:p-0">
            <IndexSheet daftar={daftar} buku={buku} blok={semua ? null : Number(blok)} />
          </div>
        </>
      )}
    </>
  )
}
