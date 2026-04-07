import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isMobile = mode === 'mobile';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            i18n: ['i18next', 'react-i18next'],
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
