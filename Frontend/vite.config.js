import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ensureBackendForDev } from '../dev/viteBackendPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ensureBackendForDev()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
