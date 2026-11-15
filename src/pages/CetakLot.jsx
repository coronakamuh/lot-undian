import { Ticket } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function CetakLot() {
  return (
    <>
      <PageTitle judul="Cetak Lot" deskripsi="Kotak nomor dan nama untuk dipotong dan diundi manual." />
      <EmptyState
        ikon={Ticket}
        judul="Belum ada lot untuk dicetak"
        keterangan="Pratinjau lot akan tampil di sini setelah daftar nama tersedia."
      />
    </>
  )
}
