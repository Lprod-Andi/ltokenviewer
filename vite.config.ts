import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Polling zwingend erforderlich auf Z: (Netzlaufwerk sendet keine
    // zuverlässigen FS-Events → Standard-Watcher friert ein)
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
});