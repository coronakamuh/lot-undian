import { proper } from './proper.js'

// Ukuran meniru sheet INDEX di Excel (mm). 1 pt = 25,4 / 72 mm.
const PT = 25.4 / 72
const LEBAR_NO = 8.96
const LEBAR_NAMA = 25.16
const LEBAR_KOLOM = 8.46
const KOLOM = 17
const BLOK_PER_BUKU = 6
const TINGGI_JUDUL = 44.25 * PT
const TINGGI_NOMOR = 11.25 * PT
const TINGGI_DATA = 16.35 * PT
const BARIS_PER_HALAMAN = 46
const LEBAR_BLOK = LEBAR_NO + LEBAR_NAMA + KOLOM * LEBAR_KOLOM
const TINGGI_BLOK = TINGGI_JUDUL + TINGGI_NOMOR + BARIS_PER_HALAMAN * TINGGI_DATA

const A4_LEBAR = 210
const A4_TINGGI = 297
const X0 = (A4_LEBAR - LEBAR_BLOK) / 2
const Y0 = (A4_TINGGI - TINGGI_BLOK) / 2

function teksTengahVertikal(doc, teks, x, atas, tinggi, ukuranPt, opsi) {
  doc.setFontSize(ukuranPt)
  doc.text(String(teks), x, atas + tinggi / 2 + ukuranPt * PT * 0.35, opsi)
}

function gambarHalaman(doc, daftar, mulaiBaris, nomorAwal) {
  // Judul: "No." dan "Nama" (miring) + garis diagonal di tiap kolom bernomor
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  const dasarJudul = Y0 + TINGGI_JUDUL - 1
  doc.text('No.', X0 + LEBAR_NO / 2, dasarJudul, { align: 'center' })
  doc.text('Nama', X0 + LEBAR_NO + LEBAR_NAMA / 2, dasarJudul, { align: 'center' })

  const xKolom0 = X0 + LEBAR_NO + LEBAR_NAMA
  doc.setDrawColor(174, 174, 174)
  doc.setLineWidth(0.15)
  for (let j = 0; j < KOLOM; j++) {
    const x = xKolom0 + j * LEBAR_KOLOM
    doc.line(x, Y0 + TINGGI_JUDUL, x + LEBAR_KOLOM, Y0)
  }

  // Baris nomor kolom
  const yNomor = Y0 + TINGGI_JUDUL
  doc.setDrawColor(166, 166, 166)
  doc.setLineWidth(0.12)
  doc.setFont('helvetica', 'normal')
  for (let j = 0; j < KOLOM; j++) {
    const x = xKolom0 + j * LEBAR_KOLOM
    doc.rect(x, yNomor, LEBAR_KOLOM, TINGGI_NOMOR, 'S')
    teksTengahVertikal(doc, nomorAwal + j, x + 0.7, yNomor, TINGGI_NOMOR, 8, { align: 'left' })
  }

  // Baris data
  const yData0 = yNomor + TINGGI_NOMOR
  for (let r = 0; r < BARIS_PER_HALAMAN; r++) {
    const i = mulaiBaris + r
    const atas = yData0 + r * TINGGI_DATA
    const selang = (i + 1) % 2 === 0

    doc.setFillColor(217, 217, 217)
    doc.rect(X0, atas, LEBAR_NO, TINGGI_DATA, 'F')
    if (selang) {
      doc.setFillColor(242, 242, 242)
      doc.rect(X0 + LEBAR_NO, atas, LEBAR_BLOK - LEBAR_NO, TINGGI_DATA, 'F')
    }

    doc.setDrawColor(166, 166, 166)
    doc.setLineWidth(0.12)
    doc.rect(X0, atas, LEBAR_NO, TINGGI_DATA, 'S')
    doc.rect(X0 + LEBAR_NO, atas, LEBAR_NAMA, TINGGI_DATA, 'S')
    for (let j = 0; j < KOLOM; j++) {
      doc.rect(xKolom0 + j * LEBAR_KOLOM, atas, LEBAR_KOLOM, TINGGI_DATA, 'S')
    }

    doc.setFont('helvetica', 'normal')
    teksTengahVertikal(doc, i + 1, X0 + LEBAR_NO / 2, atas, TINGGI_DATA, 10, { align: 'center' })
    const nama = proper(daftar[i])
    if (nama) {
      teksTengahVertikal(doc, nama, X0 + LEBAR_NO + 0.8, atas, TINGGI_DATA, 11, { align: 'left', maxWidth: LEBAR_NAMA - 1 })
    }
  }
}

// buku: 0 (nomor 1-102) atau 1 (103-204). blok: 0-5, atau null untuk semua blok.
export async function unduhIndexPdf({ daftar, buku, blok }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })

  const bloks = blok === null ? Array.from({ length: BLOK_PER_BUKU }, (_, b) => b) : [blok]
  const halamanBaris = Math.max(1, Math.ceil(daftar.length / BARIS_PER_HALAMAN))
  let pertama = true
  for (const b of bloks) {
    const nomorAwal = buku * BLOK_PER_BUKU * KOLOM + b * KOLOM + 1
    for (let h = 0; h < halamanBaris; h++) {
      if (!pertama) doc.addPage()
      pertama = false
      gambarHalaman(doc, daftar, h * BARIS_PER_HALAMAN, nomorAwal)
    }
  }

  const bagianBlok = blok === null ? 'semua-blok' : `blok-${blok + 1}`
  doc.save(`buku-index-${buku + 1}-${bagianBlok}.pdf`)
}
