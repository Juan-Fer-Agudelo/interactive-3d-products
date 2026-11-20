import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// LinkedIn and other link previews need absolute URLs in the Open Graph tags.
// SITE_URL can be set by hand; on Vercel the production domain is used.
const siteUrl = (
  process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/$/, '');

const siteUrlPlugin = {
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
};

export default defineConfig({
  plugins: [react(), siteUrlPlugin],
  server: { port: 3000 },
  build: {
    chunkSizeWarningLimit: 2600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@dimforge')) return 'rapier';
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/react')) return 'react';
        },
      },
    },
  },
});
