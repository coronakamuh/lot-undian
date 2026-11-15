export default function EmptyState({ ikon: Ikon, judul, keterangan }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--navy-soft)] text-[var(--navy)]">
        <Ikon size={22} />
      </div>
      <p className="font-medium text-[var(--text)]">{judul}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">{keterangan}</p>
    </div>
  )
}
