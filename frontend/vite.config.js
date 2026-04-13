import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isMobile = mode === 'mobile';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Fine-grained manual chunks — visitors only download what each page needs
          manualChunks(id) {
            // Core React runtime — always loaded, must be small
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-router-dom/') || id.includes('node_modules/scheduler/')) {
              return 'react';
            }
            // Redux state management
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('immer')) {
              return 'redux';
            }
            // i18n — loaded after boot
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            // MUI icons are very large — separate chunk
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            // MUI core + emotion
            if (id.includes('@mui/material') || id.includes('@mui/system') || id.includes('@mui/base') ||
                id.includes('@mui/x-') || id.includes('@emotion/')) {
              return 'mui';
            }
            // PDF viewer — only loaded on /apps/pdf page
            if (id.includes('pdfjs-dist')) {
              return 'pdf';
            }
            // Charts — only on dashboard/reports pages
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) {
              return 'charts';
            }
            // Capacitor mobile SDK
            if (id.includes('@capacitor/')) {
              return 'capacitor';
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      proxy: isMobile ? {} : {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Backend server is not running.' }));
            });
          }
        }
      }
    }
  };
});
