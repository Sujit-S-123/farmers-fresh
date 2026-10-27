import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The React app talks to the PHP backend through this proxy, so cookies (login sessions) just work.
// Default backend location for XAMPP: C:\xampp\htdocs\farmers-fresh\backend
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.BACKEND_URL || 'http://localhost/farmers-fresh/backend'
  return {
    // the demo build is a self-contained folder that can be opened from any path
    base: mode === 'demo' ? './' : '/',
    plugins: [react()],
    build: mode === 'demo' ? { rollupOptions: { output: { inlineDynamicImports: true } } } : {},
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/uploads': { target: backend, changeOrigin: true },
      },
    },
  }
})
