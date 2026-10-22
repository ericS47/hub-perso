import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Sur GitHub Pages, l'app vit sous /hub-perso/ ; en local, à la racine.
const base = process.env.GITHUB_ACTIONS ? '/hub-perso/' : '/'

export default defineConfig({
  base,
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
        start_url: base,
        lang: 'fr',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'Culture', url: `${base}culture` },
          { name: 'Finance', url: `${base}finance` },
          { name: 'Promo', url: `${base}promo` },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
