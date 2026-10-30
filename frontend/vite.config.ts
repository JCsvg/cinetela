import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Subcaminho do site (GitHub Pages: /nome-do-repo/). Local, fica na raiz.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:8000',
    },
  },
})
