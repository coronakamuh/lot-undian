import { Sun, Moon, Monitor } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'

const PILIHAN = [
  { id: 'terang', label: 'Terang', ikon: Sun },
  { id: 'gelap', label: 'Gelap', ikon: Moon },
  { id: 'sistem', label: 'Sistem', ikon: Monitor },
]

export default function Pengaturan({ tema, setTema }) {
  return (
    <>
      <PageTitle judul="Pengaturan" deskripsi="Preferensi tampilan aplikasi." />
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="text-sm font-medium text-[var(--text)]">Tema</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-md">
          {PILIHAN.map(({ id, label, ikon: Ikon }) => {
            const aktif = tema === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTema(id)}
                aria-pressed={aktif}
                className={
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ' +
                  (aktif
                    ? 'border-[var(--navy)] bg-[var(--navy-soft)] text-[var(--navy)] font-medium'
                    : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--navy-soft)]')
                }
              >
                <Ikon size={16} />
                {label}
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
