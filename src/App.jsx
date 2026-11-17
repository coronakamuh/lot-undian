import { useState } from 'react'
import { Users, Download, Settings } from 'lucide-react'
import Layout from './components/Layout.jsx'
import Nama from './pages/Nama.jsx'
import Unduh from './pages/Unduh.jsx'
import Pengaturan from './pages/Pengaturan.jsx'
import { useTema } from './lib/theme.js'

const MENU = [
  { id: 'nama', label: 'Nama', ikon: Users },
  { id: 'unduh', label: 'Unduh', ikon: Download },
  { id: 'pengaturan', label: 'Pengaturan', ikon: Settings },
]

export default function App() {
  const [halaman, setHalaman] = useState('nama')
  const [tema, setTema] = useTema()

  return (
    <Layout menu={MENU} halaman={halaman} setHalaman={setHalaman}>
      {halaman === 'nama' && <Nama />}
      {halaman === 'unduh' && <Unduh />}
      {halaman === 'pengaturan' && <Pengaturan tema={tema} setTema={setTema} />}
    </Layout>
  )
}
