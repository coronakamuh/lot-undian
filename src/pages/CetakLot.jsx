import { useEffect, useState } from 'react'
import { Ticket, Printer, Download, Loader2 } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LotSheet from '../components/LotSheet.jsx'
import { ambilNama, pesanError } from '../lib/namaApi.js'
import { unduhExcel } from '../lib/excelExport.js'

export default function CetakLot() {
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

  useEffect(() => {
    muat()
  }, [])

  return (
    <>
      <div className="print:hidden">
        <PageTitle judul="Cetak Lot" deskripsi="Kotak nomor dan nama untuk dipotong dan diundi manual." />
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
            ikon={Ticket}
            judul="Belum ada lot untuk dicetak"
            keterangan="Tambahkan nama di menu Nama, lalu kembali ke sini."
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 print:hidden">
            <p className="text-sm text-[var(--muted)]">
              {daftar.length} lot. Cetak di kertas A4 portrait, skala 100% (Actual size), tanpa margin tambahan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={unduh}
                disabled={mengunduh}
                className="flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-[var(--on-navy)] disabled:opacity-60"
              >
                {mengunduh ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Unduh Excel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--navy-soft)]"
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
          </div>
          {galatUnduh && (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 print:hidden dark:bg-red-950 dark:text-red-300">
              {galatUnduh}
            </p>
          )}
          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white p-2 print:overflow-visible print:rounded-none print:border-0 print:p-0">
            <LotSheet daftar={daftar} />
          </div>
        </>
      )}
    </>
  )
}
