// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://lucascavalheri.com.br',
  integrations: [
    sitemap({
      // lastmod é o sinal que faz o buscador revisitar em vez de confiar no cache
      lastmod: new Date(),
      changefreq: 'weekly',
      serialize: (item) => ({
        ...item,
        priority: item.url.endsWith('.com.br/') ? 1 : 0.7,
      }),
    }),
  ],
});
