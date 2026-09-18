/**
 * Clean public path for a built page.
 *
 * `astro.config.mjs` sets `build.format: 'directory'`, so `Astro.url.pathname`
 * carries a trailing slash (`/events/`, `/news/x/`) while the sitemap and every
 * in-page link use the clean path (`/`, `/events`, `/news/x`). Canonical,
 * `og:url` and the OG image slug must match the sitemap, so they all go through
 * this helper.
 *
 * Strips a trailing `index.html`, then a trailing `.html`, then a trailing
 * slash; `/` is returned unchanged. The `.html` cases are kept so a path from
 * an older `format: 'file'` build still normalises to the same address.
 */
export function cleanPath(pathname: string): string {
  const withoutIndex = pathname.replace(/index\.html$/, '');
  const withoutHtml = withoutIndex.replace(/\.html$/, '');
  if (withoutHtml === '') return '/';
  if (withoutHtml.length > 1 && withoutHtml.endsWith('/')) return withoutHtml.slice(0, -1);
  return withoutHtml;
}

/**
 * OG image path for a page path: `/` → `/og/home.png`, `/news/x` →
 * `/og/news/x.png`. Mirrors the slugs `src/pages/og/[...slug].png.ts`
 * generates, so a page's social card URL always tracks its own URL.
 */
export function ogImagePath(pathname: string): string {
  const path = cleanPath(pathname);
  return path === '/' ? '/og/home.png' : `/og${path}.png`;
}
