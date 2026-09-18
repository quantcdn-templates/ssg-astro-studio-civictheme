import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
function builtCss(): string {
  const dir = join(root, 'dist/_astro');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
}

/**
 * Built file for a public path. `astro.config.mjs` sets
 * `build.format: 'directory'`, so `/about-us` is written as
 * `dist/about-us/index.html`; the home page is `dist/index.html`.
 */
function pageFile(path: string): string {
  return join(root, 'dist', path, 'index.html');
}

describe('astro build', () => {
  beforeAll(() => {
    execSync('npm run build', { cwd: root, stdio: 'pipe' });
  }, 300_000);
  it('emits the CivicTheme stylesheet', () => {
    const css = builtCss();
    expect(css).toContain('.ct-button');
    expect(css).toMatch(/--ct-color-light-brand1:\s*#00698f/);
  });
  it('emits index.html', () => {
    expect(existsSync(join(root, 'dist/index.html'))).toBe(true);
  });
  it('emits every page as <slug>/index.html, so no address ends in .html', () => {
    // `build.format: 'directory'`. The only `.html` files in the build are the
    // `index.html` the deploy strips, and `404.html`, which QuantCDN serves as
    // the not-found page.
    function htmlFiles(dir: string): string[] {
      return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? htmlFiles(join(dir, entry.name))
          : entry.name.endsWith('.html')
            ? [join(dir, entry.name)]
            : []
      );
    }
    const stray = htmlFiles('dist').filter((file) => !file.endsWith('/index.html') && file !== 'dist/404.html');
    expect(stray).toEqual([]);
  });
  it('emits the events, news and publications listing pages', () => {
    expect(existsSync(pageFile('events'))).toBe(true);
    expect(existsSync(pageFile('news'))).toBe(true);
    expect(existsSync(pageFile('publications'))).toBe(true);
  });
  it('emits the 404 and search pages', () => {
    expect(existsSync(join(root, 'dist/404.html'))).toBe(true);
    expect(existsSync(pageFile('search'))).toBe(true);
  });
  it('emits the home page OG image', () => {
    expect(existsSync(join(root, 'dist/og/home.png'))).toBe(true);
  });
  it('emits detail pages for the card collections', () => {
    expect(existsSync(pageFile('events/open-day'))).toBe(true);
    expect(existsSync(pageFile('news/new-library-hours'))).toBe(true);
    expect(existsSync(pageFile('publications/annual-report-2025'))).toBe(true);
  });
  it('emits clean canonical URLs that match the sitemap, with no trailing slash', () => {
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    const events = readFileSync(pageFile('events'), 'utf8');
    expect(index).toContain('<link rel="canonical" href="https://example.com/"');
    expect(events).toContain('<link rel="canonical" href="https://example.com/events"');
    expect(index).toContain('content="https://example.com/"');
    expect(events).toContain('content="https://example.com/events"');
  });
  it('links the favicon from the site settings on every page', () => {
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    const events = readFileSync(pageFile('events'), 'utf8');
    expect(index).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
    expect(events).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  });
  it('excludes the behaviours smoke page from the sitemap', () => {
    const sitemap = readFileSync(join(root, 'dist/sitemap-0.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://example.com/events</loc>');
    expect(sitemap).not.toContain('/components/behaviours');
  });

  it('writes sitemap URLs with no trailing slash, so they match the canonical URLs', () => {
    const sitemap = readFileSync(join(root, 'dist/sitemap-0.xml'), 'utf8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs.length).toBeGreaterThan(1);
    expect(locs.filter((loc) => loc !== 'https://example.com/' && loc.endsWith('/'))).toEqual([]);
    expect(locs.filter((loc) => loc.endsWith('.html'))).toEqual([]);
  });
  it('emits no bare-numeric page in a collection directory (pager lives under page/)', () => {
    for (const collection of ['events', 'news', 'publications']) {
      const files = readdirSync(join(root, 'dist', collection));
      expect(files.filter((file) => /^\d+$/.test(file))).toEqual([]);
    }
  });
  it('renders no pagination wrapper while every listing fits on one page', () => {
    const events = readFileSync(pageFile('events'), 'utf8');
    expect(events).not.toContain('ct-list__pagination');
  });
  it('renders the CivicTheme header, footer and banner on the home page', () => {
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    expect(index).toContain('class="ct-header');
    expect(index).toContain('class="ct-footer');
    expect(index).toContain('class="ct-banner');
  });
  it('carries the page theme on the body, so the themed page background is full-bleed', () => {
    // CivicTheme paints the page background from `.ct-page` (scss/04-templates/
    // page/page.scss). Without the class on the body, a `theme: dark` page put
    // dark-theme text on the browser's white canvas.
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    expect(index).toContain('<body class="ct-page ct-theme-light">');
    const css = builtCss();
    expect(css).toContain('.ct-page.ct-theme-light{background-color:var(--ct-page-light-background-color)}');
    expect(css).toContain('.ct-page.ct-theme-dark{background-color:var(--ct-page-dark-background-color)}');
  });
  it('excludes draft news articles from the news listing', () => {
    const news = readFileSync(pageFile('news'), 'utf8');
    expect(news).not.toContain('Draft Heritage Strategy Under Internal Review');
    expect(news).toContain('Annual Budget for 2026 Adopted');
  });
  it('emits the ten CivicTheme demo pages', () => {
    const pages = [
      join(root, 'dist/index.html'),
      pageFile('about-us'),
      pageFile('contact-us'),
      pageFile('individuals'),
      pageFile('businesses'),
      pageFile('government'),
      pageFile('community-engagement'),
      pageFile('news-and-events'),
      pageFile('subscribe'),
      pageFile('civictheme-60-second-series'),
    ];
    for (const page of pages) {
      expect(existsSync(page)).toBe(true);
    }
  });
  it('renders the subject card and callout components on the home demo page', () => {
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    expect(index).toContain('ct-subject-card');
    expect(index).toContain('ct-callout');
  });
  it('renders the promo card component on the individuals demo page', () => {
    const individuals = readFileSync(pageFile('individuals'), 'utf8');
    expect(individuals).toContain('ct-promo-card');
  });
  it('renders the navigation card component on the CivicTheme in 60 seconds demo page', () => {
    const series = readFileSync(pageFile('civictheme-60-second-series'), 'utf8');
    expect(series).toContain('ct-navigation-card');
  });
});

describe('components reference section (Task 17)', () => {
  const familyPages = [
    'index',
    'banners',
    'promo',
    'campaign',
    'callout',
    'next-step',
    'cards',
    'lists',
    'slider',
    'accordion',
    'tabs',
    'table',
    'forms',
    'navigation',
    'footer',
    'alerts',
    'base',
    'behaviours',
  ];

  it('emits every family page under dist/components/', () => {
    for (const page of familyPages) {
      const file = page === 'index' ? pageFile('components') : pageFile(`components/${page}`);
      expect(existsSync(file)).toBe(true);
    }
  });

  it('emits the eight card classes on the cards family page', () => {
    const cards = readFileSync(pageFile('components/cards'), 'utf8');
    for (const className of [
      'ct-promo-card',
      'ct-event-card',
      'ct-publication-card',
      'ct-navigation-card',
      'ct-service-card',
      'ct-subject-card',
      'ct-snippet',
      'ct-fast-fact-card',
    ]) {
      expect(cards).toContain(className);
    }
  });

  it('links every family page from the components index', () => {
    const index = readFileSync(pageFile('components'), 'utf8');
    for (const page of familyPages.filter((page) => page !== 'index' && page !== 'behaviours')) {
      expect(index).toContain(`/components/${page}`);
    }
  });

  it('has no ported component missing from every components page (definition-of-done audit)', () => {
    const componentsDir = join(root, 'src/pages/components');
    const pagesSource = readdirSync(componentsDir)
      .filter((file) => file.endsWith('.astro'))
      .map((file) => readFileSync(join(componentsDir, file), 'utf8'))
      .join('\n');

    function componentFiles(dir: string): string[] {
      return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? componentFiles(join(dir, entry.name)) : entry.name.endsWith('.astro') ? [entry.name] : []
      );
    }

    const missing = componentFiles('src/civictheme/components')
      .map((file) => file.replace(/\.astro$/, ''))
      .filter((name) => !pagesSource.includes(name));

    expect(missing).toEqual([]);
  });

  it('renders Slider and Table light and dark on their family pages', () => {
    const slider = readFileSync(pageFile('components/slider'), 'utf8');
    expect(slider).toContain('ct-slider');
    expect(slider).toContain('ct-theme-dark');

    const table = readFileSync(pageFile('components/table'), 'utf8');
    expect(table).toContain('ct-table');
    expect(table).toContain('ct-theme-dark');
  });

  function duplicateIds(html: string): string[] {
    const counts = new Map<string, number>();
    for (const match of html.matchAll(/\bid="([^"]*)"/g)) {
      counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
  }

  it('has no duplicate ids on the forms, tabs and accordion family pages', () => {
    for (const page of ['forms', 'tabs', 'accordion']) {
      const html = readFileSync(pageFile(`components/${page}`), 'utf8');
      expect(duplicateIds(html), `duplicate ids on the ${page} page`).toEqual([]);
    }
  });

  it("gives every Header-family mobile navigation demo its own flyout target, not the real header's", () => {
    const html = readFileSync(pageFile('components/navigation'), 'utf8');
    const targets = [...html.matchAll(/data-flyout-target="([^"]*)"/g)].map((match) => match[1]);
    expect(targets.filter((target) => target === '.ct-mobile-navigation')).toHaveLength(1);
  });
});
