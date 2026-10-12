import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const nativeApiProxy: ProxyOptions = {
  target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3041',
  changeOrigin: true,
  configure(proxy) {
    proxy.on('proxyReq', (upstream, request, response) => {
      if (!request.url?.startsWith('/api/v1/ai/')) return;
      response.once('close', () => {
        if ('writableEnded' in response && !response.writableEnded) upstream.destroy();
      });
    });
  },
};

// Native preview and development use the same authenticated AI transport.
export default defineConfig(({ mode }) => {
  const demoEnv = loadEnv(mode, path.resolve(__dirname, '..'), 'DEMO_')
  return {
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DEMO_EMAIL': JSON.stringify(demoEnv.DEMO_EMAIL || ''),
    'import.meta.env.VITE_DEMO_PASSWORD': JSON.stringify(demoEnv.DEMO_PASSWORD || ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    allowedHosts: [
      'elitepos.chat','www.elitepos.chat'
    ],
    proxy: {
      '/api': nativeApiProxy,
    },
  },
  preview: {
    host: '127.0.0.1',
    proxy: {
      '/api': nativeApiProxy,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  }
})
