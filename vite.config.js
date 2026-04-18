import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',     // new SW activates without asking
      injectRegister: 'auto',

      workbox: {
        // Pre-cache everything Vite builds
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],

        // SPA fallback
        navigateFallback: '/index.html',

        // NetworkFirst for page navigations: always try server first (max 3s),
        // fall back to cache. This means a new index.html is fetched on every
        // app open when online, so stale HTML never gets served.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              networkTimeoutSeconds: 3,
              cacheName: 'clockwork-pages',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // New SW skips waiting and takes control immediately
        skipWaiting: true,
        clientsClaim: true,
      },

      includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],

      // Overrides public/manifest.json — keep theme colors in sync with dark theme
      manifest: {
        name: 'Clockwork',
        short_name: 'Clockwork',
        description: 'Freelance time tracking',
        start_url: '/',
        display: 'standalone',
        background_color: '#0D0E12',
        theme_color: '#0D0E12',
        icons: [
          {
            src: '/apple-touch-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
})
