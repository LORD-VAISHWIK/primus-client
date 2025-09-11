import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs'
  },
  server: {
    strictPort: true,
    port: 5173
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false
  }
})
