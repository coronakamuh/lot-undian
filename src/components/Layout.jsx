import { useState } from 'react'
import { Menu, X, ClipboardList } from 'lucide-react'

function NavItem({ item, aktif, onPilih }) {
  const Ikon = item.ikon
  return (
    <button
      type="button"
      onClick={() => onPilih(item.id)}
      aria-current={aktif ? 'page' : undefined}
      className={
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ' +
        (aktif
          ? 'bg-[var(--navy-soft)] font-medium text-[var(--navy)]'
          : 'text-[var(--muted)] hover:bg-[var(--navy-soft)] hover:text-[var(--text)]')
      }
    >
      <Ikon size={18} />
      {item.label}
    </button>
  )
}

function Merek() {
  return (
    <div className="flex items-center gap-3 px-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--navy)] text-[var(--on-navy)]">
        <ClipboardList size={18} />
      </div>
      <span className="font-semibold text-[var(--text)]">Lot Undian</span>
    </div>
  )
}

export default function Layout({ menu, halaman, setHalaman, children }) {
  const [buka, setBuka] = useState(false)

  const pilih = (id) => {
    setHalaman(id)
    setBuka(false)
  }

  const daftar = (
    <nav className="mt-6 space-y-1 px-2">
      {menu.map((m) => (
        <NavItem key={m.id} item={m} aktif={halaman === m.id} onPilih={pilih} />
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-[var(--card)] py-6 lg:block">
        <Merek />
        {daftar}
      </aside>

      {/* Header HP */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--line)] bg-[var(--card)] px-4 py-3 lg:hidden">
        <Merek />
        <button
          type="button"
          onClick={() => setBuka(true)}
          aria-label="Buka menu"
          className="rounded-xl p-2 text-[var(--text)] hover:bg-[var(--navy-soft)]"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Laci menu HP */}
      {buka && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBuka(false)} />
          <aside className="absolute right-0 top-0 h-full w-72 bg-[var(--card)] py-4 shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Merek />
              <button
                type="button"
                onClick={() => setBuka(false)}
                aria-label="Tutup menu"
                className="rounded-xl p-2 text-[var(--text)] hover:bg-[var(--navy-soft)]"
              >
                <X size={20} />
              </button>
            </div>
            {daftar}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
