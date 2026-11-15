export default function PageTitle({ judul, deskripsi }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-[var(--text)]">{judul}</h1>
      {deskripsi && <p className="mt-1 text-sm text-[var(--muted)]">{deskripsi}</p>}
    </header>
  )
}
