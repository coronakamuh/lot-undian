import { supabase } from './supabase.js'

const KOLOM = 'id, nama, urutan, posisi_lot, posisi_index'

export async function ambilNama() {
  const { data, error } = await supabase
    .from('lot_nama')
    .select(KOLOM)
    .order('urutan', { ascending: true })
    .order('nama', { ascending: true })
  if (error) throw error
  return data
}

export async function tambahNama(nama, urutan) {
  const { data, error } = await supabase
    .from('lot_nama')
    .insert({ nama: nama.trim(), urutan })
    .select(KOLOM)
    .single()
  if (error) throw error
  return data
}

export async function ubahNama(id, nama) {
  const { data, error } = await supabase
    .from('lot_nama')
    .update({ nama: nama.trim() })
    .eq('id', id)
    .select(KOLOM)
    .single()
  if (error) throw error
  return data
}

export async function hapusNama(id) {
  const { error } = await supabase.from('lot_nama').delete().eq('id', id)
  if (error) throw error
}

export function pesanError(error) {
  if (error?.code === '23505') return 'Nama itu sudah ada di daftar.'
  return 'Terjadi kesalahan saat menghubungi database. Coba lagi.'
}
