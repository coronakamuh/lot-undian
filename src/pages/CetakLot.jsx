import { useEffect, useState } from 'react'
import { Ticket, Printer, Loader2 } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LotSheet from '../components/LotSheet.jsx'
import { ambilNama, pesanError } from '../lib/namaApi.js'

export default function CetakLot() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState('')

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
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-[var(--on-navy)]"
            >
              <Printer size={16} /> Cetak
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white p-2 print:overflow-visible print:rounded-none print:border-0 print:p-0">
            <LotSheet daftar={daftar} />
          </div>
        </>
      )}
    </>
  )
}
