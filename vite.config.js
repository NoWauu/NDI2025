import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // Headers requis pour crossOriginIsolated (nécessaire pour WebAssembly/Transformer.js)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  // Optimisations pour Transformer.js
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  }
});
