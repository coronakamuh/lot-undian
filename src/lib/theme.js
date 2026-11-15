import { useEffect, useState } from 'react'

const KEY = 'lot-undian-tema'

function baca() {
  try {
    return localStorage.getItem(KEY) || 'sistem'
  } catch {
    return 'sistem'
  }
}

function terapkan(pilihan) {
  const gelap =
    pilihan === 'gelap' ||
    (pilihan === 'sistem' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', gelap)
}

export function useTema() {
  const [tema, setTema] = useState(baca)

  useEffect(() => {
    terapkan(tema)
    try {
      localStorage.setItem(KEY, tema)
    } catch {
      /* penyimpanan tidak tersedia */
    }
    if (tema !== 'sistem') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => terapkan('sistem')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [tema])

  return [tema, setTema]
}
