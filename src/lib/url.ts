/**
 * Clean public path for a built page.
 *
 * `astro.config.mjs` sets `build.format: 'file'`, so `Astro.url.pathname` is
 * the built FILE path (`/index.html`, `/events.html`, `/news/x.html`) while
 * the sitemap and every in-page link use the clean path (`/`, `/events`,
 * `/news/x`). Canonical, `og:url` and the OG image slug must match the
 * sitemap, so they all go through this helper.
 *
 * Strips a trailing `index.html` first, then a trailing `.html`; `/` is
 * returned unchanged, and a path that never had `.html` passes through.
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
