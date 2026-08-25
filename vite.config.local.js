import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build especial para abrir la app directamente como un único archivo .html
// (sin servidor), p.ej. transfiriéndolo al móvil y abriéndolo con file://.
// No incluye el plugin de PWA: los service workers no funcionan sobre file://.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'dist-local',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
  },
})
