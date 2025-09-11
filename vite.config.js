import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  css: {
    postcss: './postcss.config.cjs'
  },
=======
>>>>>>> 868653eff794ed4994070e51b417534b5911fcfa
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
