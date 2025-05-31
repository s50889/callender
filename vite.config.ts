import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Awesome Company Calendar',
        short_name: 'CalendarApp',
        description: '最高でかっこいい社内カレンダーアプリ！',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // 後で作成するアイコンパス
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // 後で作成するアイコンパス
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // マスク可能なアイコン (Safari用)
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
}) 