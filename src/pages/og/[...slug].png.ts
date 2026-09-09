import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { entryUrl } from '../../lib/content';

/**
 * Open Graph image endpoint.
 *
 * This is the ONLY file under `src/` allowed Node-only imports (satori,
 * @resvg/resvg-js) — the same exemption `ssg-astro-studio` uses, and the same
 * pattern already proven under Quant Studio. Every other file must stay
 * browser-compilable.
 *
 * The path is derived from `entryUrl` so an image URL always mirrors its
 * page URL: `/about-us` → `/og/about-us.png`, `/news/x` → `/og/news/x.png`,
 * and the home page (`pages` entry `index`, at `/`) → `/og/home.png`.
 */

const WIDTH = 1200;
const HEIGHT = 630;

// CivicTheme brand colours (see src/civictheme/scss variables).
const BRAND1 = '#00698f';
const SURFACE = '#e6e9eb';

async function loadFont(): Promise<ArrayBuffer> {
  // Fetch the Lexend CSS with a browser UA so Google Fonts serves woff2 URLs.
  const response = await fetch('https://fonts.googleapis.com/css2?family=Lexend:wght@700&display=swap', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  const css = await response.text();
  const fontUrl = css.match(/src: url\(([^)]+)\) format\('woff2'\)/)?.[1];
  if (!fontUrl) {
    // Fallback: without the browser UA, Google Fonts serves a truetype URL.
    const ttfResponse = await fetch('https://fonts.googleapis.com/css2?family=Lexend:wght@700&display=swap');
    const ttfCss = await ttfResponse.text();
    const ttfUrl = ttfCss.match(/src: url\(([^)]+)\)/)?.[1];
    if (!ttfUrl) {
      throw new Error('Could not load the Lexend font');
    }
    const fontRes = await fetch(ttfUrl);
    return fontRes.arrayBuffer();
  }
  const fontResponse = await fetch(fontUrl);
  return fontResponse.arrayBuffer();
}

/** `entryUrl`'s path, minus the leading slash, as an `/og/<slug>.png` slug. */
function ogSlug(collection: 'pages' | 'events' | 'news' | 'publications', id: string): string {
  const url = entryUrl(collection, id);
  return url === '/' ? 'home' : url.slice(1);
}

export const getStaticPaths: GetStaticPaths = async () => {
  const [pages, events, news, publications] = await Promise.all([
    getCollection('pages', ({ data }) => !data.draft),
    getCollection('events', ({ data }) => !data.draft),
    getCollection('news', ({ data }) => !data.draft),
    getCollection('publications', ({ data }) => !data.draft),
  ]);

  return [
    { params: { slug: 'search' }, props: { title: 'Search' } },
    { params: { slug: '404' }, props: { title: 'Page not found' } },
    ...pages.map((entry) => ({ params: { slug: ogSlug('pages', entry.id) }, props: { title: entry.data.title } })),
    ...events.map((entry) => ({ params: { slug: ogSlug('events', entry.id) }, props: { title: entry.data.title } })),
    ...news.map((entry) => ({ params: { slug: ogSlug('news', entry.id) }, props: { title: entry.data.title } })),
    ...publications.map((entry) => ({
      params: { slug: ogSlug('publications', entry.id) },
      props: { title: entry.data.title },
    })),
    { params: { slug: 'events' }, props: { title: 'Events' } },
    { params: { slug: 'news' }, props: { title: 'News' } },
    { params: { slug: 'publications' }, props: { title: 'Publications' } },
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const { title } = props as { title: string };

  const fontData = await loadFont();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: SURFACE,
          fontFamily: 'Lexend',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '60px',
                left: '80px',
                width: '120px',
                height: '12px',
                background: BRAND1,
              },
              children: '',
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: title.length > 40 ? '56px' : '72px',
                fontWeight: 700,
                color: BRAND1,
                lineHeight: 1.2,
                maxWidth: '960px',
              },
              children: title,
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Lexend', data: fontData, weight: 400, style: 'normal' as const },
        { name: 'Lexend', data: fontData, weight: 700, style: 'normal' as const },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
  // `asPng()` returns a Node `Buffer`; `Response` wants a plain byte view.
  const png = new Uint8Array(resvg.render().asPng());

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
