import { Users } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Nama() {
  return (
    <>
      <PageTitle judul="Nama" deskripsi="Daftar induk nama yang dipakai untuk lot dan buku index." />
      <EmptyState
        ikon={Users}
        judul="Belum ada data nama"
        keterangan="Daftar nama akan tampil di sini setelah database terhubung."
      />
    </>
  )
}
