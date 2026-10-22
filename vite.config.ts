import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Hub perso',
        short_name: 'Hub',
        description: 'Culture, finance, info, emploi et promos au même endroit',
        theme_color: '#1f2937',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        lang: 'fr',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'Culture', url: '/culture' },
          { name: 'Finance', url: '/finance' },
          { name: 'Promo', url: '/promo' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
