import JSZip from 'jszip'
import { proper } from './proper.js'

// Template = file Excel asli Anda (sheet LOT, SUMBER, INDEX, INDEX (2), print folio, Laporan Kas) tanpa isi nama.
// Hanya data yang diganti; gaya, ukuran sel, border, dan pengaturan cetak dibiarkan persis seperti aslinya.

export const MAKS_NAMA = 200 // INDEX baris 3-202 = 200 nama, print folio 200 (LOT: 210 kotak)
const KOLOM_NAMA_INDEX = ['B', 'U', 'AN', 'BG', 'BZ', 'CS']

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function sel(ref, gaya, formula, nilai) {
  const s = gaya ? ` s="${gaya}"` : ''
  if (typeof nilai === 'number') return `<c r="${ref}"${s}><f>${esc(formula)}</f><v>${nilai}</v></c>`
  return `<c r="${ref}"${s} t="str"><f>${esc(formula)}</f><v>${esc(nilai)}</v></c>`
}

// ---- SUMBER: daftar nama mentah di kolom A -------------------------------------------
function buatSumber(xml, daftar) {
  const baris = daftar
    .map(
      (nama, i) =>
        `<row r="${i + 1}" spans="1:2"><c r="A${i + 1}" s="1" t="inlineStr"><is><t>${esc(nama)}</t></is></c><c r="B${i + 1}" s="1"/></row>`,
    )
    .join('')
  const dim = `A1:B${Math.max(1, daftar.length)}`
  return xml
    .replace(/<dimension ref="[^"]*"\s*\/>/, `<dimension ref="${dim}"/>`)
    .replace(/<sheetData\s*\/>|<sheetData>[\s\S]*?<\/sheetData>/, `<sheetData>${baris}</sheetData>`)
}

// ---- LOT: 6 kotak per baris; baris ganjil = nomor ("1."), baris genap = nama --------------
// Rumus di template sudah benar (nomor selalu tampil, nama diambil dari SUMBER, satu kata per baris).
// Di sini hanya nilai tersimpan nama yang diisi, dan tinggi baris diseragamkan.
const LOT_PER_BARIS = 6
const LOT_BARIS_MAKS = 70 // 35 pasang baris = 210 kotak
// Satu lot (nomor + nama) = 3 cm: 16,5 pt + 68,45 pt = 84,95 pt (sesuai file acuan).
const TINGGI_NOMOR = '16.5'
const TINGGI_NAMA = '68.45'
// Pemisah halaman manual tiap 12 baris (6 lot): nomor dan nama satu lot tidak pernah terpisah antar halaman.
const LOT_BARIS_PER_HALAMAN = 12

function sisipkanPemisahHalaman(xml, jumlah) {
  const barisCetak = Math.max(2, Math.min(LOT_BARIS_MAKS, Math.ceil(jumlah / LOT_PER_BARIS) * 2))
  const brk = []
  for (let r = LOT_BARIS_PER_HALAMAN; r < barisCetak; r += LOT_BARIS_PER_HALAMAN) {
    brk.push(`<brk id="${r}" max="16383" man="1"/>`)
  }
  const bersih = xml.replace(/<rowBreaks[\s\S]*?<\/rowBreaks>/, '')
  if (brk.length === 0) return bersih
  const blok = `<rowBreaks count="${brk.length}" manualBreakCount="${brk.length}">${brk.join('')}</rowBreaks>`
  return bersih.replace(/(<pageSetup[^>]*\/>)(<headerFooter[\s\S]*?<\/headerFooter>)?/, (m) => m + blok)
}

function buatLot(xml, daftar) {
  const barisSeragam = xml.replace(/<row r="(\d+)"([^>]*?)(\/?>)/g, (utuh, noStr, atribut, tutup) => {
    const r = Number(noStr)
    if (r > LOT_BARIS_MAKS) return utuh
    const tinggi = r % 2 === 1 ? TINGGI_NOMOR : TINGGI_NAMA
    const atrib = atribut
      .replace(/\s+ht="[^"]*"/, '')
      .replace(/\s+customHeight="[^"]*"/, '')
    return `<row r="${r}"${atrib} ht="${tinggi}" customHeight="1"${tutup}`
  })
  const terisi = barisSeragam.replace(
    /<c r="([A-F])(\d+)"([^>/]*)>((?:(?!<\/c>)[\s\S])*)<\/c>/g,
    (utuh, kol, noStr, atribut, isi) => {
      const r = Number(noStr)
      if (r > LOT_BARIS_MAKS || r % 2 === 1) return utuh
      const slot = (r / 2 - 1) * LOT_PER_BARIS + (kol.charCodeAt(0) - 64)
      const nama = (daftar[slot - 1] || '').replace(/\s+/g, '\n')
      const formula = (isi.match(/<f[\s\S]*?(?:<\/f>|\/>)/) || [''])[0]
      return `<c r="${kol}${r}"${atribut}>${formula}<v>${esc(nama)}</v></c>`
    },
  )
  return sisipkanPemisahHalaman(terisi, daftar.length)
}

// ---- INDEX dan INDEX (2): nama = PROPER(SUMBER!A{baris-2}) di 6 blok -------------------
function buatIndex(xml, daftar) {
  const pola = new RegExp(`<c r="(${KOLOM_NAMA_INDEX.join('|')})(\\d+)"([^>]*)>(?:(?!</c>)[\\s\\S])*</c>`, 'g')
  return xml.replace(pola, (utuh, kol, noStr, atribut) => {
    const r = Number(noStr)
    if (r < 3 || r > 202) return utuh
    const gaya = (atribut.match(/\ss="(\d+)"/) || [])[1]
    return sel(`${kol}${r}`, gaya, `PROPER(SUMBER!A${r - 2})`, proper(daftar[r - 3] || ''))
  })
}

// ---- print folio: daftar iuran, 4 blok x 50 baris (200 nomor) (nomor tetap, nama = PROPER dari SUMBER) ---
const KOLOM_LEMBARAN = { B: 'A', E: 'D', H: 'G', K: 'J' } // kolom nama -> kolom nomor

function buatLembaran(xml, daftar) {
  const nomor = new Map()
  for (const m of xml.matchAll(/<c r="([ADGJ])(\d+)"[^>/]*><v>(\d+)<\/v><\/c>/g)) {
    nomor.set(`${m[1]}${m[2]}`, Number(m[3]))
  }
  return xml.replace(
    /<c r="([BEHK])(\d+)"([^>/]*)>((?:(?!<\/c>)[\s\S])*)<\/c>/g,
    (utuh, kol, noStr, atribut, isi) => {
      const r = Number(noStr)
      if (r < 3 || r > 52) return utuh
      const no = nomor.get(`${KOLOM_LEMBARAN[kol]}${r}`)
      const formula = (isi.match(/<f[\s\S]*?(?:<\/f>|\/>)/) || [''])[0]
      if (!formula || !no) return utuh
      return `<c r="${kol}${r}"${atribut}>${formula}<v>${esc(proper(daftar[no - 1] || ''))}</v></c>`
    },
  )
}

// ---- Bagian lain: hitung ulang, hapus calcChain, area cetak LOT, bersihkan teks lama ----
function rapikanWorkbook(xml, jumlah) {
  let out = xml.replace(/<calcPr([^>]*?)\s*\/>/, (m, a) =>
    /fullCalcOnLoad/.test(a) ? m : `<calcPr${a} fullCalcOnLoad="1"/>`,
  )
  const barisCetak = Math.max(2, Math.min(70, Math.ceil(jumlah / 6) * 2))
  const area = `<definedName name="_xlnm.Print_Area" localSheetId="0">LOT!$A$1:$F$${barisCetak}</definedName>`
  out = out.replace(/<definedNames>[\s\S]*?<\/definedNames>/, '')
  out = out.replace(/<\/sheets>/, `</sheets><definedNames>${area}</definedNames>`)
  return out
}

function kosongkanStringTakTerpakai(sst, sheetXmls) {
  const dipakai = new Set()
  for (const x of sheetXmls) {
    for (const m of x.matchAll(/t="s"[^>]*><v>(\d+)<\/v>/g)) dipakai.add(Number(m[1]))
  }
  let i = -1
  return sst.replace(/<si>[\s\S]*?<\/si>/g, (si) => {
    i += 1
    return dipakai.has(i) ? si : '<si><t></t></si>'
  })
}

export async function buatXlsx(templateBytes, daftarMentah) {
  const daftar = daftarMentah.map((n) => String(n).trim()).filter(Boolean)
  if (daftar.length > MAKS_NAMA) {
    throw new Error(`File Excel hanya mendukung sampai ${MAKS_NAMA} nama (sekarang ${daftar.length}).`)
  }
  const zip = await JSZip.loadAsync(templateBytes)
  const baca = (p) => zip.file(p).async('string')

  const [s1, s2, s3, s4, s5] = await Promise.all(
    ['sheet1', 'sheet2', 'sheet3', 'sheet4', 'sheet5'].map((n) => baca(`xl/worksheets/${n}.xml`)),
  )
  const lot = buatLot(s1, daftar)
  const sumber = buatSumber(s2, daftar)
  const index1 = buatIndex(s3, daftar)
  const index2 = buatIndex(s4, daftar)
  const lembaran = buatLembaran(s5, daftar)

  zip.file('xl/worksheets/sheet1.xml', lot)
  zip.file('xl/worksheets/sheet2.xml', sumber)
  zip.file('xl/worksheets/sheet3.xml', index1)
  zip.file('xl/worksheets/sheet4.xml', index2)
  zip.file('xl/worksheets/sheet5.xml', lembaran)

  zip.file('xl/workbook.xml', rapikanWorkbook(await baca('xl/workbook.xml'), daftar.length))

  if (zip.file('xl/sharedStrings.xml')) {
    zip.file(
      'xl/sharedStrings.xml',
      kosongkanStringTakTerpakai(await baca('xl/sharedStrings.xml'), [lot, sumber, index1, index2, lembaran]),
    )
  }

  // calcChain lama tidak cocok lagi; Excel membuatnya ulang sendiri.
  if (zip.file('xl/calcChain.xml')) zip.remove('xl/calcChain.xml')
  zip.file(
    '[Content_Types].xml',
    (await baca('[Content_Types].xml')).replace(/<Override[^>]*calcChain[^>]*\/>/, ''),
  )
  zip.file(
    'xl/_rels/workbook.xml.rels',
    (await baca('xl/_rels/workbook.xml.rels')).replace(/<Relationship[^>]*calcChain[^>]*\/>/, ''),
  )

  return zip
}

export async function buatXlsxBytes(templateBytes, daftar, tipe = 'uint8array') {
  const zip = await buatXlsx(templateBytes, daftar)
  return zip.generateAsync({ type: tipe, compression: 'DEFLATE' })
}

export async function unduhExcel(daftar) {
  const url = `${import.meta.env.BASE_URL}template-lot-index.xlsx`
  // no-store + penanda waktu: selalu ambil template terbaru, bukan salinan lama di cache browser.
  const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Template Excel tidak ditemukan.')
  const blob = await buatXlsxBytes(await res.arrayBuffer(), daftar, 'blob')
  const href = URL.createObjectURL(
    new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
  const a = document.createElement('a')
  a.href = href
  a.download = 'lot-index.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
