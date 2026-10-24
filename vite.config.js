import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'


// https://vite.dev/config/
// Адрес API — не здесь, а в VITE_API_BASE (.env.development / .env.production).
// Прокси больше не нужен: сервер GGenius сам разрешает CORS для ggenius.shop и localhost:5173.
export default defineConfig({
  plugins: [react(),],
  build: {
    outDir: 'dist'
  },
  base: '/',

})
