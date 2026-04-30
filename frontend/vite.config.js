import { defineConfig } from 'vite';
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
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-router-dom/') || id.includes('node_modules/scheduler/')) {
              return 'react';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('immer')) {
              return 'redux';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            if (id.includes('@mui/material') || id.includes('@mui/system') || id.includes('@mui/base') ||
                id.includes('@mui/x-') || id.includes('@emotion/')) {
              return 'mui';
            }
            if (id.includes('pdfjs-dist')) {
              return 'pdf';
            }
            if (id.includes('mammoth') || id.includes('html2pdf') || id.includes('html2canvas') || id.includes('jspdf')) {
              return 'doc-tools';
            }
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) {
              return 'charts';
            }
            if (id.includes('@capacitor/')) {
              return 'capacitor';
            }
          }
        }
      }
    },
    // import-in-the-middle is a CJS-only package pulled in by @sentry/react v10
    // via OpenTelemetry. Vite can't pre-bundle it — exclude it to avoid build errors.
    optimizeDeps: {
      exclude: ['import-in-the-middle', 'require-in-the-middle']
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
