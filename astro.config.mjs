import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  build: { format: 'file' },
  integrations: [
    mdx(),
    sitemap({
      // `/components/behaviours` is a JS behaviour smoke page for the e2e
      // suite, not site content. Task 17's `/components/*` reference pages
      // ARE site content and stay in the sitemap — do not widen this filter
      // to the whole `/components/` prefix.
      filter: (page) => !page.includes('/components/behaviours'),
    }),
    robotsTxt(),
  ],
});
