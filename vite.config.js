import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Situs berjalan di https://coronakamuh.github.io/lot-undian/
export default defineConfig({
  base: '/lot-undian/',
  plugins: [react(), tailwindcss()],
})
