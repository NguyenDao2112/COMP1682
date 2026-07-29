import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Reliably detect if running inside Docker container via /.dockerenv file
  const isDocker = fs.existsSync('/.dockerenv');
  const backendUrl = isDocker ? 'http://backend:8000' : (env.VITE_API_URL || 'http://localhost:8000');

  console.log(`[vite.config] Proxy target: ${backendUrl} (Docker: ${isDocker})`);

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  })
}
