import { defineConfig } from 'vite'
import native from '@pubflow/native/vite'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [native(), tailwind()],
  server: {
    port: 3000,
  },
})
