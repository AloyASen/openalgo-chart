import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import signalConfig from './signal-config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5001,
    proxy: {
      '/api': {
        target: `http://${signalConfig.chart?.serverHost ?? '127.0.0.1'}:${signalConfig.chart?.serverPort ?? 5000}`,
        changeOrigin: true,
      },
      '/ws': {
        target: signalConfig.chart?.webSocketPort ? `ws://${signalConfig.chart.serverHost ?? '127.0.0.1'}:${signalConfig.chart.webSocketPort}` : `ws://${signalConfig.chart?.serverHost ?? '127.0.0.1'}:8765`,
        ws: true,
      },
      '/npl-time': {
        target: 'https://www.nplindia.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/npl-time/, '/cgi-bin/ntp_client'),
        secure: true,
      }
    }
  }
})
