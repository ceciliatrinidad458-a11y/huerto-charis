import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-corte-caja.png'],
      manifest: {
        name: 'Viveros Charis',
        short_name: 'Charis',
        description: 'Sistema de gestión de ventas para Viveros Charis',
        theme_color: '#1B5E20',
        background_color: '#F3FAEF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo-corte-caja.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-corte-caja.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
    enabled: true
  },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});