import { useState } from 'react'
import { Users, Ticket, BookOpen, Settings } from 'lucide-react'
import Layout from './components/Layout.jsx'
import Nama from './pages/Nama.jsx'
import CetakLot from './pages/CetakLot.jsx'
import CetakIndex from './pages/CetakIndex.jsx'
import Pengaturan from './pages/Pengaturan.jsx'
import { useTema } from './lib/theme.js'

const MENU = [
  { id: 'nama', label: 'Nama', ikon: Users },
  { id: 'lot', label: 'Cetak Lot', ikon: Ticket },
  { id: 'index', label: 'Cetak Index', ikon: BookOpen },
  { id: 'pengaturan', label: 'Pengaturan', ikon: Settings },
]

export default function App() {
  const [halaman, setHalaman] = useState('nama')
  const [tema, setTema] = useTema()

  return (
    <Layout menu={MENU} halaman={halaman} setHalaman={setHalaman}>
      {halaman === 'nama' && <Nama />}
      {halaman === 'lot' && <CetakLot />}
      {halaman === 'index' && <CetakIndex />}
      {halaman === 'pengaturan' && <Pengaturan tema={tema} setTema={setTema} />}
    </Layout>
  )
}
