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
      // Enregistrement fait dans src/main.tsx (rechargement automatique à chaque nouvelle version).
      injectRegister: false,
      includeAssets: ['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'logo-m.png'],
      manifest: {
        name: 'Maestro',
        short_name: 'Maestro',
        description: "Le chef d'orchestre de ton quotidien : culture, finance, info, emploi, promos et notes",
        theme_color: '#050a1a',
        background_color: '#050a1a',
        display: 'standalone',
        start_url: base,
        lang: 'fr',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Culture', url: `${base}culture` },
          { name: 'Finance', url: `${base}finance` },
          { name: 'Promo', url: `${base}promo` },
          { name: 'Notes', url: `${base}notes` },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Couvertures en ligne gardées en cache : la bibliothèque reste illustrée hors ligne.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'couvertures',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
