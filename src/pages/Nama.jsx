import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Users, Plus, Pencil, Trash2, Check, X, Search, Loader2, ArrowUp, ArrowDown, MoveRight, Undo2, Redo2, Cloud } from 'lucide-react'
import PageTitle from '../components/PageTitle.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { ambilNama, tambahNama, ubahNama, hapusNama, hapusBanyak, simpanUrutan, pesanError } from '../lib/namaApi.js'
import { geser, pindahKe, beriUrutan } from '../lib/urutan.js'

const kartu = 'rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm'
const input =
  'w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--navy)]'
const aksi =
  'flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2.5 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--navy-soft)] disabled:opacity-50'
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
  const [pilih, setPilih] = useState(() => new Set())
  const [keNomor, setKeNomor] = useState('')
  const [riwayat, setRiwayat] = useState([]) // untuk Urungkan
  const [maju, setMaju] = useState([]) // untuk Ulangi
  const [fokus, setFokus] = useState(null)
  const [status, setStatus] = useState('') // '', 'menyimpan', 'tersimpan', 'gagal'
  const daftarRef = useRef([])
  const serverRef = useRef([]) // keadaan terakhir yang diketahui ada di database
  const timerRef = useRef(null)
  const sedangSimpan = useRef(false)
  const perluLagi = useRef(false)
  daftarRef.current = daftar

  const muat = async () => {
    setMemuat(true)
    setGagal('')
    try {
      const data = await ambilNama()
      serverRef.current = data
      daftarRef.current = data
      setDaftar(data)
      setRiwayat([])
      setMaju([])
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

  // Setelah menggeser, gulirkan layar agar baris yang digeser tetap terlihat di tengah.
  useEffect(() => {
    if (!fokus) return
    const t = requestAnimationFrame(() => {
      document.getElementById(`nama-${fokus.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(t)
  }, [fokus])

  const catat = () => {
    setRiwayat((r) => [...r.slice(-49), daftarRef.current])
    setMaju([])
  }

  const setLokal = (list) => {
    daftarRef.current = list
    setDaftar(list)
  }

  // Samakan database dengan daftar terbaru (hapus yang hilang, simpan yang baru/berubah).
  const sinkron = async (target) => {
    const server = new Map(serverRef.current.map((d) => [d.id, d]))
    const idTarget = new Set(target.map((d) => d.id))
    const hapusIds = [...server.keys()].filter((id) => !idTarget.has(id))
    const simpan = target.filter((d) => {
      const x = server.get(d.id)
      return !x || x.nama !== d.nama || x.urutan !== d.urutan
    })
    if (hapusIds.length) await hapusBanyak(hapusIds)
    if (simpan.length) await simpanUrutan(simpan)
    serverRef.current = target
  }

  const simpanSekarang = useCallback(async () => {
    if (sedangSimpan.current) {
      perluLagi.current = true
      return
    }
    sedangSimpan.current = true
    setStatus('menyimpan')
    try {
      do {
        perluLagi.current = false
        await sinkron(daftarRef.current)
      } while (perluLagi.current)
      setStatus('tersimpan')
    } catch (err) {
      setStatus('gagal')
      setPesan(pesanError(err))
    } finally {
      sedangSimpan.current = false
    }
  }, [])

  const jadwalkanSimpan = () => {
    clearTimeout(timerRef.current)
    setStatus('menyimpan')
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      simpanSekarang()
    }, 400)
  }

  // Jangan kehilangan perubahan yang belum sempat tersimpan saat pindah halaman.
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        simpanSekarang()
      }
    },
    [simpanSekarang],
  )

  const tambah = async (e) => {
    e.preventDefault()
    if (!baru.trim() || menyimpan) return
    setMenyimpan(true)
    setPesan('')
    try {
      const urutan = daftarRef.current.reduce((m, d) => Math.max(m, d.urutan), 0) + 1
      const item = await tambahNama(baru, urutan)
      catat()
      serverRef.current = [...serverRef.current, item]
      setLokal([...daftarRef.current, item])
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
      catat()
      serverRef.current = serverRef.current.map((x) => (x.id === id ? { ...x, nama: item.nama } : x))
      setLokal(daftarRef.current.map((x) => (x.id === id ? { ...x, nama: item.nama } : x)))
      setEditId(null)
    } catch (err) {
      setPesan(pesanError(err))
    } finally {
      setMenyimpan(false)
    }
  }

  const terapkanUrutan = (baruList, awal = true) => {
    const bernomor = beriUrutan(baruList)
    const sama = bernomor.every((d, i) => d.id === daftarRef.current[i]?.id)
    if (sama) return
    setPesan('')
    catat()
    setLokal(bernomor)
    jadwalkanSimpan()
    const terpilih = bernomor.filter((d) => pilih.has(d.id))
    const target = awal ? terpilih[0] : terpilih[terpilih.length - 1]
    if (target) setFokus({ id: target.id, n: Date.now() })
  }

  const pulihkan = (target) => {
    setLokal(target)
    const ada = new Set(target.map((d) => d.id))
    setPilih((p) => new Set([...p].filter((id) => ada.has(id))))
    setEditId(null)
    setPesan('')
    jadwalkanSimpan()
  }

  const urungkan = () => {
    if (riwayat.length === 0) return
    const prev = riwayat[riwayat.length - 1]
    setRiwayat((r) => r.slice(0, -1))
    setMaju((m) => [...m, daftarRef.current])
    pulihkan(prev)
  }

  const ulangi = () => {
    if (maju.length === 0) return
    const next = maju[maju.length - 1]
    setMaju((m) => m.slice(0, -1))
    setRiwayat((r) => [...r, daftarRef.current])
    pulihkan(next)
  }

  // Ctrl/Cmd+Z = urungkan, Ctrl+Y atau Ctrl+Shift+Z = ulangi (bukan saat mengetik).
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault()
        urungkan()
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault()
        ulangi()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const alihkan = (id) =>
    setPilih((p) => {
      const n = new Set(p)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const pilihSemuaTampil = () =>
    setPilih((p) => {
      const semuaDipilih = tampil.length > 0 && tampil.every((d) => p.has(d.id))
      const n = new Set(p)
      tampil.forEach((d) => (semuaDipilih ? n.delete(d.id) : n.add(d.id)))
      return n
    })

  const pindahNomor = (e) => {
    e.preventDefault()
    const nomor = Number(keNomor)
    if (!Number.isFinite(nomor) || nomor < 1) return
    terapkanUrutan(pindahKe(daftarRef.current, pilih, nomor), true)
    setKeNomor('')
  }

  const hapus = async (item) => {
    if (!window.confirm(`Hapus nama "${item.nama}"?`)) return
    setPesan('')
    try {
      await hapusNama(item.id)
      catat()
      serverRef.current = serverRef.current.filter((x) => x.id !== item.id)
      setLokal(daftarRef.current.filter((x) => x.id !== item.id))
      setPilih((p) => {
        const n = new Set(p)
        n.delete(item.id)
        return n
      })
    } catch (err) {
      setPesan(pesanError(err))
    }
  }

  const infoStatus =
    status === 'menyimpan' ? (
      <span className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
        <Loader2 size={14} className="animate-spin" /> Menyimpan…
      </span>
    ) : status === 'tersimpan' ? (
      <span className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
        <Cloud size={14} /> Tersimpan
      </span>
    ) : status === 'gagal' ? (
      <button type="button" onClick={simpanSekarang} className="text-sm text-red-600 hover:underline dark:text-red-400">
        Gagal menyimpan, coba lagi
      </button>
    ) : null

  return (
    <div className={pilih.size > 0 ? 'pb-28' : ''}>
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
            <div className="relative w-full sm:max-w-xs sm:flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                className={`${input} pl-9`}
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama"
                aria-label="Cari nama"
              />
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <button type="button" onClick={urungkan} disabled={riwayat.length === 0} className={aksi} title="Urungkan (Ctrl+Z)" aria-label="Urungkan">
                <Undo2 size={14} /> <span className="hidden sm:inline">Urungkan</span>
              </button>
              <button type="button" onClick={ulangi} disabled={maju.length === 0} className={aksi} title="Ulangi (Ctrl+Y)" aria-label="Ulangi">
                <Redo2 size={14} /> <span className="hidden sm:inline">Ulangi</span>
              </button>
              <button type="button" onClick={pilihSemuaTampil} className="px-1 text-sm text-[var(--navy)] hover:underline">
                {tampil.length > 0 && tampil.every((d) => pilih.has(d.id)) ? 'Lepas semua' : 'Pilih semua'}
              </button>
              <span className="ml-auto text-sm text-[var(--muted)]">{daftar.length} nama</span>
            </div>
          </div>

          {pilih.size > 0 && (
            <div className="fixed inset-x-2 bottom-2 z-20 mx-auto flex max-w-2xl flex-wrap items-center gap-x-2 gap-y-1.5 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5 text-sm shadow-xl">
              <span className="mr-1 font-medium text-[var(--navy)]">{pilih.size} dipilih</span>
              <button type="button" onClick={() => terapkanUrutan(geser(daftarRef.current, pilih, -1), true)} className={aksi}>
                <ArrowUp size={14} /> Naik
              </button>
              <button type="button" onClick={() => terapkanUrutan(geser(daftarRef.current, pilih, 1), false)} className={aksi}>
                <ArrowDown size={14} /> Turun
              </button>
              <form onSubmit={pindahNomor} className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={daftar.length}
                  value={keNomor}
                  onChange={(e) => setKeNomor(e.target.value)}
                  placeholder="Ke nomor"
                  aria-label="Pindah ke nomor"
                  className="w-24 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2.5 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--navy)]"
                />
                <button type="submit" disabled={!keNomor} className={aksi}>
                  <MoveRight size={14} /> Pindah
                </button>
              </form>
              <button type="button" onClick={urungkan} disabled={riwayat.length === 0} className={`${aksi} ml-auto`}>
                <Undo2 size={14} /> Urungkan
              </button>
              {infoStatus}
              <button type="button" onClick={() => setPilih(new Set())} className={aksi}>
                Batal pilih
              </button>
            </div>
          )}

          {tampil.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">Tidak ada nama yang cocok.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {tampil.map((d) => (
                <li key={d.id} id={`nama-${d.id}`} className={'scroll-mt-24 flex items-center gap-3 px-4 py-2.5 ' + (pilih.has(d.id) ? 'bg-[var(--navy-soft)]' : '')}>
                  <input
                    type="checkbox"
                    checked={pilih.has(d.id)}
                    onChange={() => alihkan(d.id)}
                    aria-label={`Pilih ${d.nama}`}
                    className="h-4 w-4 shrink-0 accent-[var(--navy)]"
                  />
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
    </div>
  )
}
