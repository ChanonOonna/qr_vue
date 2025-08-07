import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Environment variables
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'http://localhost:3001'
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true
      },
      '/login': {
        target: BACKEND_URL,
        changeOrigin: true
      },
      '/logout': {
        target: BACKEND_URL,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}) 