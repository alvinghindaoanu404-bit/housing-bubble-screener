import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative addresses, so the built site works from any folder:
  // on the laptop, and in a sub-folder online (GitHub Pages).
  base: './',
  plugins: [react(), tailwindcss()],
})
