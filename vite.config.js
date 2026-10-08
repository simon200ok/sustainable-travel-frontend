import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_API_BASE_URL ? new URL(env.VITE_API_BASE_URL).origin : ''

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'images/apple-touch-icon.png', 'theme-init.js'],
        manifest: {
          id: '/',
          name: 'UoS Sustainable Travel Hub',
          short_name: 'UoS Travel',
          description: 'Green journeys, live buses and fares for University of Sunderland students and staff.',
          lang: 'en-GB',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#F57C00',
          background_color: '#f3f8fa',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Plan a journey', url: '/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Live 700/701 buses', url: '/map', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Ticket prices', url: '/ticketing', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,webp,svg}'],
          // The admin area is never available offline
          globIgnores: ['**/AdminApp-*'],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Our own reference data: works offline, refreshed whenever online.
              // Google Maps/Places/Routes content is never cached (Google's terms).
              urlPattern: ({ url }) =>
                url.origin === apiOrigin &&
                /^\/(locations|zones|tickets|operators|fares|impact\/summary)/.test(url.pathname),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'uos-api-reference',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 40, maxAgeSeconds: 7 * 24 * 3600 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'osm-tiles',
                expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 3600 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  }
})
