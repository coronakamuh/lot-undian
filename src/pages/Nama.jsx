import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardList, Plus, Trash2, Check, X, Search, Loader2, ArrowUp, ArrowDown, MoveRight, Undo2, Redo2, Cloud, Download, Sun, Moon, Monitor } from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import { ambilNama, tambahBanyak, ubahNama, hapusNama, hapusBanyak, simpanUrutan, pesanError } from '../lib/namaApi.js'
import { geser, pindahKe, beriUrutan } from '../lib/urutan.js'
import { unduhExcel, MAKS_NAMA } from '../lib/excelExport.js'

const rapikan = (s) => s.replace(/\s+/g, ' ').trim().toUpperCase()
const URUT_TEMA = ['terang', 'gelap', 'sistem']
const IKON_TEMA = { terang: Sun, gelap: Moon, sistem: Monitor }

const kartu = 'rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm'
const input =
  'w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--navy)]'
const aksi =
  'flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2.5 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--navy-soft)] disabled:opacity-50'
const tombolIkon =
  'rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--navy-soft)] hover:text-[var(--text)] disabled:opacity-50'

export default function Nama({ tema, setTema }) {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const [pesan, setPesan] = useState('')
  const [baru, setBaru] = useState('')
  const [posisi, setPosisi] = useState('akhir') // 'akhir' | 'nomor'
  const [diNomor, setDiNomor] = useState('')
  const [mengunduh, setMengunduh] = useState(false)
  const [galatUnduh, setGalatUnduh] = useState('')
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

  // Pecah teks tempelan (satu nama per baris, atau dipisah koma/titik koma), rapikan, buang yang kembar.
  const urai = (teks) => {
    const ada = new Set(daftarRef.current.map((d) => d.nama.trim().toLowerCase()))
    const baruList = []
    const lewat = []
    for (const mentah of teks.split(/[\n;,]+/)) {
      const nama = rapikan(mentah)
      if (!nama) continue
      const k = nama.toLowerCase()
      if (ada.has(k)) lewat.push(nama)
      else {
        ada.add(k)
        baruList.push(nama)
      }
    }
    return { baruList, lewat }
  }

  const tambah = async (e) => {
    e.preventDefault()
    const { baruList, lewat } = urai(baru)
    if (menyimpan) return
    if (baruList.length === 0) {
      setPesan(lewat.length ? `Sudah ada di daftar: ${lewat.join(', ')}.` : '')
      return
    }
    setMenyimpan(true)
    setPesan('')
    try {
      const awal = daftarRef.current.reduce((m, d) => Math.max(m, d.urutan), 0)
      const items = await tambahBanyak(baruList.map((nama, i) => ({ nama, urutan: awal + i + 1 })))
      catat()
      serverRef.current = [...serverRef.current, ...items]
      let list = [...daftarRef.current, ...items]
      const nomor = Math.round(Number(diNomor))
      if (posisi === 'nomor' && Number.isFinite(nomor) && nomor >= 1 && nomor <= daftarRef.current.length) {
        list = beriUrutan(pindahKe(list, new Set(items.map((d) => d.id)), nomor))
        jadwalkanSimpan()
      }
      setLokal(list)
      setFokus({ id: items[0].id, n: Date.now() })
      setBaru('')
      if (lewat.length) setPesan(`${items.length} nama ditambah. Dilewati karena sudah ada: ${lewat.join(', ')}.`)
    } catch (err) {
      setPesan(pesanError(err))
    } finally {
      setMenyimpan(false)
    }
  }

  const simpanEdit = async (id) => {
    const nama = rapikan(editNilai)
    if (!nama || menyimpan) return
    setMenyimpan(true)
    setPesan('')
    try {
      const item = await ubahNama(id, nama)
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

  const unduh = async () => {
    setMengunduh(true)
    setGalatUnduh('')
    try {
      await unduhExcel(daftarRef.current.map((d) => d.nama))
    } catch (e) {
      setGalatUnduh(e?.message || 'Gagal membuat file Excel. Coba lagi.')
    } finally {
      setMengunduh(false)
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
      <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
        <Loader2 size={12} className="animate-spin" /> Menyimpan…
      </span>
    ) : status === 'tersimpan' ? (
      <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
        <Cloud size={12} /> Tersimpan
      </span>
    ) : status === 'gagal' ? (
      <button type="button" onClick={simpanSekarang} className="text-xs text-red-600 hover:underline dark:text-red-400">
        Gagal menyimpan, coba lagi
      </button>
    ) : null

  const IkonTema = IKON_TEMA[tema] || Monitor
  const jumlahBaru = urai(baru).baruList.length
  const kelebihan = daftar.length > MAKS_NAMA

  return (
    <div className={pilih.size > 0 ? 'pb-28' : 'pb-6'}>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--navy)] text-[var(--on-navy)]">
            <ClipboardList size={16} />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-sm font-semibold text-[var(--text)]">Lot Undian</h1>
            <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              {daftar.length} nama {infoStatus}
            </p>
          </div>
          <button type="button" onClick={urungkan} disabled={riwayat.length === 0} className={tombolIkon} title="Urungkan (Ctrl+Z)" aria-label="Urungkan">
            <Undo2 size={18} />
          </button>
          <button type="button" onClick={ulangi} disabled={maju.length === 0} className={tombolIkon} title="Ulangi (Ctrl+Y)" aria-label="Ulangi">
            <Redo2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setTema(URUT_TEMA[(URUT_TEMA.indexOf(tema) + 1) % URUT_TEMA.length])}
            className={tombolIkon}
            title={`Tema: ${tema}`}
            aria-label={`Ganti tema (sekarang ${tema})`}
          >
            <IkonTema size={18} />
          </button>
          <button
            type="button"
            onClick={unduh}
            disabled={mengunduh || memuat || daftar.length === 0 || kelebihan}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--navy)] px-3 py-2 text-sm font-medium text-[var(--on-navy)] disabled:opacity-50"
          >
            {mengunduh ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">Unduh Excel</span>
            <span className="sm:hidden">Unduh</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 pt-3 sm:px-6">
        {(kelebihan || galatUnduh) && (
          <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {kelebihan ? `File Excel hanya mendukung sampai ${MAKS_NAMA} nama (sekarang ${daftar.length}). Hapus beberapa nama dulu.` : galatUnduh}
          </p>
        )}

        <form onSubmit={tambah} className={`${kartu} mb-3 p-3`}>
          <textarea
            className={`${input} resize-y`}
            rows={2}
            value={baru}
            onChange={(e) => setBaru(e.target.value)}
            placeholder="Tambah nama — ketik satu, atau tempel banyak (satu per baris / pisah koma)"
            aria-label="Nama baru"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <select
              value={posisi}
              onChange={(e) => setPosisi(e.target.value)}
              aria-label="Posisi nama baru"
              className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-2.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--navy)]"
            >
              <option value="akhir">Di akhir daftar</option>
              <option value="nomor">Mulai di nomor…</option>
            </select>
            {posisi === 'nomor' && (
              <input
                type="number"
                min={1}
                max={daftar.length}
                value={diNomor}
                onChange={(e) => setDiNomor(e.target.value)}
                placeholder="No."
                aria-label="Mulai di nomor"
                className="w-20 rounded-xl border border-[var(--line)] bg-[var(--card)] px-2.5 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--navy)]"
              />
            )}
            <button
              type="submit"
              disabled={jumlahBaru === 0 || menyimpan}
              className="ml-auto flex items-center gap-1.5 rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-medium text-[var(--on-navy)] disabled:opacity-50"
            >
              {menyimpan ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tambah{jumlahBaru > 1 ? ` ${jumlahBaru} nama` : ''}
            </button>
          </div>
        </form>

        {pesan && (
          <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
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
          <EmptyState ikon={ClipboardList} judul="Belum ada data nama" keterangan="Tambahkan nama lewat kolom di atas." />
        ) : (
          <section className={kartu}>
            <div className="flex items-center gap-2 border-b border-[var(--line)] p-2.5">
              <div className="relative min-w-0 flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  className={`${input} py-2 pl-9`}
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  placeholder="Cari nama"
                  aria-label="Cari nama"
                />
              </div>
              <button type="button" onClick={pilihSemuaTampil} className="shrink-0 px-1 text-sm text-[var(--navy)] hover:underline">
                {tampil.length > 0 && tampil.every((d) => pilih.has(d.id)) ? 'Lepas semua' : 'Pilih semua'}
              </button>
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
                <button type="button" onClick={() => setPilih(new Set())} className={`${aksi} ml-auto`}>
                  Batal pilih
                </button>
              </div>
            )}

            {tampil.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">Tidak ada nama yang cocok.</p>
            ) : (
              <ul
                className="grid grid-flow-col grid-cols-2 [grid-template-rows:repeat(var(--b2),auto)] sm:grid-cols-3 sm:[grid-template-rows:repeat(var(--b3),auto)]"
                style={{ '--b2': Math.ceil(tampil.length / 2), '--b3': Math.ceil(tampil.length / 3) }}
              >
                {tampil.map((d) => {
                  const no = daftar.indexOf(d) + 1
                  return editId === d.id ? (
                    <li key={d.id} id={`nama-${d.id}`} className="border-b border-[var(--line)] bg-[var(--navy-soft)] px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 shrink-0 text-right text-xs tabular-nums text-[var(--muted)]">{no}</span>
                        <input
                          className={`${input} min-w-0 py-1.5`}
                          value={editNilai}
                          autoFocus
                          onChange={(e) => setEditNilai(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') simpanEdit(d.id)
                            if (e.key === 'Escape') setEditId(null)
                          }}
                          aria-label={`Ubah nama nomor ${no}`}
                        />
                      </div>
                      <div className="mt-1 flex justify-end gap-1">
                        <button type="button" className={tombolIkon} onClick={() => simpanEdit(d.id)} aria-label="Simpan">
                          <Check size={18} />
                        </button>
                        <button type="button" className={tombolIkon} onClick={() => hapus(d)} aria-label={`Hapus ${d.nama}`}>
                          <Trash2 size={18} />
                        </button>
                        <button type="button" className={tombolIkon} onClick={() => setEditId(null)} aria-label="Batal">
                          <X size={18} />
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={d.id}
                      id={`nama-${d.id}`}
                      className={'scroll-mt-16 flex items-center border-b border-[var(--line)] ' + (pilih.has(d.id) ? 'bg-[var(--navy-soft)]' : '')}
                    >
                      <label className="flex shrink-0 cursor-pointer items-center gap-1 py-1.5 pl-2 pr-1" title="Pilih untuk digeser">
                        <input
                          type="checkbox"
                          checked={pilih.has(d.id)}
                          onChange={() => alihkan(d.id)}
                          aria-label={`Pilih ${d.nama}`}
                          className="h-4 w-4 shrink-0 accent-[var(--navy)]"
                        />
                        <span className="w-7 text-right text-xs tabular-nums text-[var(--muted)]">{no}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(d.id)
                          setEditNilai(d.nama)
                        }}
                        className="min-w-0 flex-1 truncate py-1.5 pl-1 pr-2 text-left text-[13px] text-[var(--text)] hover:underline"
                        title="Ketuk untuk ubah atau hapus"
                      >
                        {d.nama}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
