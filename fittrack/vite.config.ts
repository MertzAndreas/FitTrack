import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    allowedHosts: [".tail068a08.ts.net"],
    proxy: {
      '/api': {
        target: 'http://localhost:5159',
        changeOrigin: true,
      },
    },
  },
})
