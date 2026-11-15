import { ClipboardList } from 'lucide-react'

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
          <ClipboardList size={24} />
        </div>
        <h1 className="text-xl font-semibold text-[#1e3a5f]">Lot Undian</h1>
        <p className="mt-2 text-sm text-gray-500">
          Fondasi project siap. Fitur akan ditambahkan bertahap.
        </p>
      </section>
    </main>
  )
}
