import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA temporär deaktiviert wegen workbox-build Fehler
    // VitePWA({...})
  ],
  base: './',
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'comlink': ['comlink']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['comlink']
  },
  define: {
    global: 'globalThis',
  },
  worker: {
    format: 'iife'  // Verwende IIFE für importScripts() Unterstützung
  }
}) 