import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  // `directory` (Astro's default) writes `<slug>/index.html`, so every page's
  // public address is `/about-us`. Quant Studio publishes from the site's
  // routes, and the deploy action strips `index.html`, so both publish the same
  // address. `file` wrote `about-us.html`, which CI published as `/about-us.html`.
  build: { format: 'directory' },
  // The published address has no trailing slash, and every in-page link is
  // written without one. `never` makes the sitemap agree, so a crawler and a
  // click reach the same address and the CDN never has to redirect.
  trailingSlash: 'never',
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
