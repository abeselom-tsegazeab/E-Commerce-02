import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory and all parent directories
  const env = loadEnv(mode, process.cwd(), '');
  
  // HTTPS configuration
  const httpsConfig = fs.existsSync('localhost-key.pem') && fs.existsSync('localhost.pem')
    ? {
        key: fs.readFileSync('localhost-key.pem'),
        cert: fs.readFileSync('localhost.pem'),
      }
    : false;

  return {
    plugins: [react()],
    server: {
      https: httpsConfig,
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '^/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '^/auth': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/auth/, '')
        }
      },
      cors: {
        origin: true,
        credentials: true
      },
      hmr: {
        protocol: httpsConfig ? 'wss' : 'ws',
        host: 'localhost'
      }
    },
    define: {
      'process.env': {}
    },
    // Handle JSX files
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'react-toastify'],
      force: true
    },
    // Clear the cache
    cacheDir: 'node_modules/.vite',
    clearScreen: true,
    // Handle JSX files in development
    esbuild: {
      jsxInject: `import React from 'react'`
    }
  };
});
