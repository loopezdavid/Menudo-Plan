import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.png', 'favicon-16.png', 'favicon-48.png', 'apple-touch-icon.png', 'logo-mark.png'],
      manifest: {
        name: 'Menudo Plan — Planificador de comidas',
        short_name: 'Menudo Plan',
        description:
          'Menudo Plan es tu planificador semanal de comidas: elige que comer cada dia, guarda recetas con foto e ingredientes, y genera automaticamente la lista de la compra.',
        lang: 'es',
        theme_color: '#2f6b4f',
        background_color: '#faf8f3',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,jpg,jpeg}'],
      },
    }),
  ],
})
