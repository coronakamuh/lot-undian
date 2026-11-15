import { BookOpen } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function CetakIndex() {
  return (
    <>
      <PageTitle judul="Cetak Index" deskripsi="Buku index berisi nama dengan kolom bernomor untuk diisi tangan." />
      <EmptyState
        ikon={BookOpen}
        judul="Belum ada buku index untuk dicetak"
        keterangan="Pratinjau buku index akan tampil di sini setelah daftar nama tersedia."
      />
    </>
  )
}
