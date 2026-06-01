import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureBackendForDev } from '../dev/viteBackendPlugin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export default defineConfig({
  plugins: [react(), ensureBackendForDev()],
  envDir: path.resolve(__dirname, '../'),
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://black-reel-xxfy.vercel.app/',
        changeOrigin: true,
      },
    },
  },
})
