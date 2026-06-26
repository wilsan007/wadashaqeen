import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return ({
    // 🚀 OPTIMISATION - Tree-shaking automatique lucide-react
    optimizeDeps: {
      include: ['lucide-react'],
      exclude: [],
    },
    server: {
      host: '::',
      port: 8080,
      headers: {
        // Content Security Policy
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://qliinxtanjdnwxlvnxji.supabase.co wss://qliinxtanjdnwxlvnxji.supabase.co",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),

        // Autres headers de sécurité
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo-w.svg'],
        manifest: {
          name: 'Wadashaqayn',
          short_name: 'Wadashaqayn',
          description: 'Plateforme de gestion de projets et RH tout-en-un',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/logo-w.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: '/logo-w.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
          categories: ['productivity', 'business'],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/qliinxtanjdnwxlvnxji\.supabase\.co\/rest\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              },
            },
          ],
        },
      }),
      // Plugin Sentry - upload sourcemaps en production
      ...(env.VITE_SENTRY_DSN ? [sentryVitePlugin({
        org: 'wadashaqayn',
        project: 'wadashaqayn-frontend',
        authToken: env.SENTRY_AUTH_TOKEN,
        telemetry: false,
      })] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - bibliothèques principales
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],

            // UI Components - Radix UI
            'ui-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-popover',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-slot',
            ],

            // DnD - dnd-kit uniquement (référence canonique)
            'vendor-dnd': [
              '@dnd-kit/core',
              '@dnd-kit/sortable',
              '@dnd-kit/utilities',
            ],

            // Charts et visualisation
            'vendor-charts': ['recharts'],

            // Supabase
            'vendor-supabase': ['@supabase/supabase-js'],

            // Utilitaires
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],

            // 🔥 OPTIMISATIONS BUNDLE - Libs lourdes en chunks séparés
            'vendor-excel': ['exceljs'], // ExcelJS - Lazy load
            'vendor-pdf': ['jspdf', 'jspdf-autotable'], // 405KB - Lazy load
            'vendor-canvas': ['html2canvas'], // 198KB - Lazy load
            // vendor-icons SUPPRIMÉ - Tree-shaking via @/lib/icons
          },
        },
      },
      // Optimisations supplémentaires
      chunkSizeWarningLimit: 1000,
      // 'hidden' génère les sourcemaps sans les exposer publiquement.
      // Sentry les uploade via sentryVitePlugin pour des stack traces lisibles.
      sourcemap: 'hidden',
      minify: 'esbuild',
      target: 'esnext',
    },
    // Supprime console.* et debugger en production uniquement.
    esbuild: mode === 'production'
      ? { drop: ['console', 'debugger'] }
      : {},
  });
});

