import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/FxDPartnerERP/',
  build: {
    outDir: 'build',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});