import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => mode === 'artifact' ? {
  // One self-contained HTML file (see scripts/build_artifact.py); no public/ copy.
  base: './',
  publicDir: false,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'dist-artifact' },
} : {
  base: './',
  plugins: [react(), tailwindcss()],
})
