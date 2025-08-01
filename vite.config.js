import { defineConfig } from 'vite';

export default defineConfig({
  // Output to docs directory to match current build setup
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  // Development server configuration
  server: {
    port: 8888,
    open: true,
  }
});
