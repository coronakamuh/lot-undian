import JSZip from 'jszip'
import { proper } from './proper.js'

// Template = file Excel asli Anda (sheet LOT, SUMBER, INDEX, INDEX (2)) tanpa isi nama.
// Hanya data yang diganti; gaya, ukuran sel, border, dan pengaturan cetak dibiarkan persis seperti aslinya.

export const MAKS_NAMA = 190 // sheet INDEX menyediakan baris untuk 190 nama
const SLOT_LOT_MAKS = 240 // sheet LOT menyediakan 96 baris = 48 x 5 kotak
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

// ---- LOT: nomor di baris ganjil, nama di baris genap, 5 kotak per baris ----------------
const KOLOM_LOT = ['A', 'B', 'C', 'D', 'E']
const RANGE_SUMBER = `SUMBER!$A$1:$A$${SLOT_LOT_MAKS}`

function buatLot(xml, daftar) {
  return xml.replace(/<row r="(\d+)"([^>]*?)(\/>|>[\s\S]*?<\/row>)/g, (utuh, noStr, atribut) => {
    const r = Number(noStr)
    if (r > 96) return utuh
    const atrib = atribut.replace(/\s*\/$/, '')
    let isi = ''
    for (let c = 1; c <= 5; c++) {
      const ref = `${KOLOM_LOT[c - 1]}${r}`
      if (r % 2 === 1) {
        // baris nomor
        const slot = ((r - 1) / 2) * 5 + c
        const formula = `IFERROR(IF(INDEX(${RANGE_SUMBER},(ROW()-1)/2*5+COLUMN())="","",(ROW()-1)/2*5+COLUMN()),"")`
        isi += sel(ref, '3', formula, slot <= daftar.length ? slot : '')
      } else {
        // baris nama
        const slot = (r / 2 - 1) * 5 + c
        const formula = `IFERROR(TRIM(INDEX(${RANGE_SUMBER},(ROW()/2-1)*5+COLUMN()))&"","")`
        isi += sel(ref, '13', formula, slot <= daftar.length ? daftar[slot - 1].trim() : '')
      }
    }
    return `<row r="${r}"${atrib}>${isi}</row>`
  })
}

// ---- INDEX dan INDEX (2): nama = PROPER(SUMBER!A{baris-2}) di 6 blok -------------------
function buatIndex(xml, daftar) {
  const pola = new RegExp(`<c r="(${KOLOM_NAMA_INDEX.join('|')})(\\d+)"([^>]*)>(?:(?!</c>)[\\s\\S])*</c>`, 'g')
  return xml.replace(pola, (utuh, kol, noStr, atribut) => {
    const r = Number(noStr)
    if (r < 3 || r > 191) return utuh
    const gaya = (atribut.match(/\ss="(\d+)"/) || [])[1]
    return sel(`${kol}${r}`, gaya, `PROPER(SUMBER!A${r - 2})`, proper(daftar[r - 3] || ''))
  })
}

// ---- Bagian lain: hitung ulang, hapus calcChain, area cetak LOT, bersihkan teks lama ----
function rapikanWorkbook(xml, jumlah) {
  let out = xml.replace(/<calcPr([^>]*?)\s*\/>/, (m, a) =>
    /fullCalcOnLoad/.test(a) ? m : `<calcPr${a} fullCalcOnLoad="1"/>`,
  )
  const barisCetak = Math.max(2, Math.min(96, Math.ceil(jumlah / 5) * 2))
  const area = `<definedName name="_xlnm.Print_Area" localSheetId="0">LOT!$A$1:$E$${barisCetak}</definedName>`
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

  const [s1, s2, s3, s4] = await Promise.all(
    ['sheet1', 'sheet2', 'sheet3', 'sheet4'].map((n) => baca(`xl/worksheets/${n}.xml`)),
  )
  const lot = buatLot(s1, daftar)
  const sumber = buatSumber(s2, daftar)
  const index1 = buatIndex(s3, daftar)
  const index2 = buatIndex(s4, daftar)

  zip.file('xl/worksheets/sheet1.xml', lot)
  zip.file('xl/worksheets/sheet2.xml', sumber)
  zip.file('xl/worksheets/sheet3.xml', index1)
  zip.file('xl/worksheets/sheet4.xml', index2)

  zip.file('xl/workbook.xml', rapikanWorkbook(await baca('xl/workbook.xml'), daftar.length))

  if (zip.file('xl/sharedStrings.xml')) {
    zip.file(
      'xl/sharedStrings.xml',
      kosongkanStringTakTerpakai(await baca('xl/sharedStrings.xml'), [lot, sumber, index1, index2]),
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
  const res = await fetch(url)
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
