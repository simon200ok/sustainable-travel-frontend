import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_API_BASE_URL ? new URL(env.VITE_API_BASE_URL).origin : ''
  // A new id for every build: the app compares it with /version.json to know if it's the newest
  const buildId = Date.now().toString(36)

  return {
    define: {
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
    },
    plugins: [
      react(),
      {
        name: 'uos-version-file',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: buildId }) })
        },
      },
      VitePWA({
        // Updates are applied by src/lib/appUpdate.js: never a surprise reload, never during a trip
        registerType: 'prompt',
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
          // Pages are fetched from the network first (newest version as the app opens);
          // the saved copy is only used offline or if the network takes more than 4 seconds
          navigateFallback: null,
          globPatterns: ['**/*.{js,css,ico,png,webp,svg}'],
          // The admin area is never available offline
          globIgnores: ['**/AdminApp-*'],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'uos-app-page',
                networkTimeoutSeconds: 4,
                // Every address is the same single-page app: keep one saved copy for all of them
                plugins: [{ cacheKeyWillBeUsed: async () => '/app-shell' }],
                cacheableResponse: { statuses: [200] },
              },
            },
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
