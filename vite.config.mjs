import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: 'static',
  build: {
    outDir: 'public',
    // Do not inline any SVG assets
    assetsInlineLimit: 0
  },
  plugins: [
    // eslint-disable-next-line new-cap
    VitePWA({
      filename: 'sw.js',
      workbox: {
        globPatterns: [
          '**/*.*',
          '**/!(*map*)'
        ],
        cleanupOutdatedCaches: true
      },
      manifest: {
        short_name: 'YGO Calc',
        name: 'Yugioh Calculator',
        description: 'A free Yugioh calculator app for iPhone, iPod, iPad, and Android.',
        start_url: 'index.html',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: 'web-app-icon.png',
            sizes: '256x256',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
