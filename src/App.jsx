import Nama from './pages/Nama.jsx'
import { useTema } from './lib/theme.js'

export default function App() {
  const [tema, setTema] = useTema()
  return <Nama tema={tema} setTema={setTema} />
}
