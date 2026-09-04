import { defineConfig } from 'vite'
import native from '@pubflow/native/vite'

export default defineConfig({
  plugins: [native()],
})
