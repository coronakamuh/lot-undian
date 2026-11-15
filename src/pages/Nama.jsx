import { useEffect, useMemo, useState } from 'react'
import { Users, Plus, Pencil, Trash2, Check, X, Search, Loader2 } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { ambilNama, tambahNama, ubahNama, hapusNama, pesanError } from '../lib/namaApi.js'

const kartu = 'rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm'
const input =
  'w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--navy)]'
const tombolIkon =
  'rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--navy-soft)] hover:text-[var(--text)] disabled:opacity-50'

export default function Nama() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const [pesan, setPesan] = useState('')
  const [baru, setBaru] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [cari, setCari] = useState('')
  const [editId, setEditId] = useState(null)
  const [editNilai, setEditNilai] = useState('')

  const muat = async () => {
    setMemuat(true)
    setGagal('')
    try {
      setDaftar(await ambilNama())
    } catch (e) {
      setGagal(pesanError(e))
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muat()
  }, [])

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return q ? daftar.filter((d) => d.nama.toLowerCase().includes(q)) : daftar
  }, [daftar, cari])

  const tambah = async (e) => {
    e.preventDefault()
    if (!baru.trim() || menyimpan) return
    setMenyimpan(true)
    setPesan('')
    try {
      const urutan = daftar.reduce((m, d) => Math.max(m, d.urutan), 0) + 1
      const item = await tambahNama(baru, urutan)
      setDaftar((d) => [...d, item])
      setBaru('')
    } catch (err) {
      setPesan(pesanError(err))
    } finally {
      setMenyimpan(false)
    }
  }

  const simpanEdit = async (id) => {
    if (!editNilai.trim() || menyimpan) return
    setMenyimpan(true)
    setPesan('')
    try {
      const item = await ubahNama(id, editNilai)
      setDaftar((d) => d.map((x) => (x.id === id ? item : x)))
      setEditId(null)
    } catch (err) {
      setPesan(pesanError(err))
    } finally {
      setMenyimpan(false)
    }
  }

  const hapus = async (item) => {
    if (!window.confirm(`Hapus nama "${item.nama}"?`)) return
    setPesan('')
    try {
      await hapusNama(item.id)
      setDaftar((d) => d.filter((x) => x.id !== item.id))
    } catch (err) {
      setPesan(pesanError(err))
    }
  }

  return (
    <>
      <PageTitle judul="Nama" deskripsi="Daftar induk nama yang dipakai untuk lot dan buku index." />

      <form onSubmit={tambah} className={`${kartu} mb-4 flex gap-2 p-4`}>
        <input
          className={input}
          value={baru}
          onChange={(e) => setBaru(e.target.value)}
          placeholder="Tambah nama baru"
          aria-label="Nama baru"
        />
        <button
          type="submit"
          disabled={!baru.trim() || menyimpan}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-[var(--on-navy)] disabled:opacity-50"
        >
          {menyimpan ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Tambah
        </button>
      </form>

      {pesan && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {pesan}
        </p>
      )}

      {memuat ? (
        <div className={`${kartu} flex items-center justify-center gap-2 py-14 text-sm text-[var(--muted)]`}>
          <Loader2 size={18} className="animate-spin" /> Memuat daftar nama…
        </div>
      ) : gagal ? (
        <div className={`${kartu} px-6 py-12 text-center`}>
          <p className="text-sm text-[var(--text)]">{gagal}</p>
          <button
            type="button"
            onClick={muat}
            className="mt-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--navy-soft)]"
          >
            Coba lagi
          </button>
        </div>
      ) : daftar.length === 0 ? (
        <EmptyState
          ikon={Users}
          judul="Belum ada data nama"
          keterangan="Tambahkan nama lewat kolom di atas. Impor dari Excel menyusul di tahap berikutnya."
        />
      ) : (
        <section className={kartu}>
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
            <div className="relative max-w-xs flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                className={`${input} pl-9`}
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama"
                aria-label="Cari nama"
              />
            </div>
            <span className="text-sm text-[var(--muted)]">{daftar.length} nama</span>
          </div>

          {tampil.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">Tidak ada nama yang cocok.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {tampil.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-10 shrink-0 text-sm text-[var(--muted)]">{daftar.indexOf(d) + 1}</span>
                  {editId === d.id ? (
                    <>
                      <input
                        className={input}
                        value={editNilai}
                        autoFocus
                        onChange={(e) => setEditNilai(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') simpanEdit(d.id)
                          if (e.key === 'Escape') setEditId(null)
                        }}
                      />
                      <button type="button" className={tombolIkon} onClick={() => simpanEdit(d.id)} aria-label="Simpan">
                        <Check size={16} />
                      </button>
                      <button type="button" className={tombolIkon} onClick={() => setEditId(null)} aria-label="Batal">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{d.nama}</span>
                      <button
                        type="button"
                        className={tombolIkon}
                        onClick={() => {
                          setEditId(d.id)
                          setEditNilai(d.nama)
                        }}
                        aria-label={`Ubah ${d.nama}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button type="button" className={tombolIkon} onClick={() => hapus(d)} aria-label={`Hapus ${d.nama}`}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  )
}
