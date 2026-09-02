import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 若 GitHub 仓库名不是 countdown，请同步修改这里与 .github/workflows/deploy.yml 注释。
const BASE = '/countdown/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: '倒数日·待办',
        short_name: '倒数日',
        description: '记录重要日子的倒数与待办事项',
        lang: 'zh-CN',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        background_color: '#f4f6fb',
        theme_color: '#2f6bed',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: `${BASE}index.html`,
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}']
      }
    })
  ]
});
