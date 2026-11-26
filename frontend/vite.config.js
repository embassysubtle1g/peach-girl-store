import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 專案型網址需要保留 repository 路徑。
  base: '/peach-girl-store/',
});
