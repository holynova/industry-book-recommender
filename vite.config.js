import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGitHubPages = process.env.GITHUB_PAGES === '1'

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubPages ? '/industry-book-recommender/' : '/',
  plugins: [react()],
})
