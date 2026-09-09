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
  it('emits the events, news and publications listing pages', () => {
    expect(existsSync(join(root, 'dist/events.html'))).toBe(true);
    expect(existsSync(join(root, 'dist/news.html'))).toBe(true);
    expect(existsSync(join(root, 'dist/publications.html'))).toBe(true);
  });
  it('emits the 404 and search pages', () => {
    expect(existsSync(join(root, 'dist/404.html'))).toBe(true);
    expect(existsSync(join(root, 'dist/search.html'))).toBe(true);
  });
  it('emits the home page OG image', () => {
    expect(existsSync(join(root, 'dist/og/home.png'))).toBe(true);
  });
  it('emits detail pages for the card collections', () => {
    expect(existsSync(join(root, 'dist/events/open-day.html'))).toBe(true);
    expect(existsSync(join(root, 'dist/news/new-library-hours.html'))).toBe(true);
    expect(existsSync(join(root, 'dist/publications/annual-report-2025.html'))).toBe(true);
  });
  it('emits clean canonical URLs that match the sitemap, not the .html file paths', () => {
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    const events = readFileSync(join(root, 'dist/events.html'), 'utf8');
    expect(index).toContain('<link rel="canonical" href="https://example.com/"');
    expect(events).toContain('<link rel="canonical" href="https://example.com/events"');
    expect(index).toContain('content="https://example.com/"');
    expect(events).toContain('content="https://example.com/events"');
  });
  it('excludes the behaviours smoke page from the sitemap', () => {
    const sitemap = readFileSync(join(root, 'dist/sitemap-0.xml'), 'utf8');
    expect(sitemap).toContain('https://example.com/events');
    expect(sitemap).not.toContain('/components/behaviours');
  });
  it('emits no bare-numeric page in a collection directory (pager lives under page/)', () => {
    for (const collection of ['events', 'news', 'publications']) {
      const files = readdirSync(join(root, 'dist', collection));
      expect(files.filter((file) => /^\d+\.html$/.test(file))).toEqual([]);
    }
  });
  it('renders no pagination wrapper while every listing fits on one page', () => {
    const events = readFileSync(join(root, 'dist/events.html'), 'utf8');
    expect(events).not.toContain('ct-list__pagination');
  });
  it('renders the CivicTheme header, footer and banner on the home page', () => {
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    expect(index).toContain('class="ct-header');
    expect(index).toContain('class="ct-footer');
    expect(index).toContain('class="ct-banner');
  });
  it('excludes draft news articles from the news listing', () => {
    const news = readFileSync(join(root, 'dist/news.html'), 'utf8');
    expect(news).not.toContain('Draft Heritage Strategy Under Internal Review');
    expect(news).toContain('Annual Budget for 2026 Adopted');
  });
  it('emits the ten CivicTheme demo pages', () => {
    const pages = [
      'dist/index.html',
      'dist/about-us.html',
      'dist/contact-us.html',
      'dist/individuals.html',
      'dist/businesses.html',
      'dist/government.html',
      'dist/community-engagement.html',
      'dist/news-and-events.html',
      'dist/subscribe.html',
      'dist/civictheme-60-second-series.html',
    ];
    for (const page of pages) {
      expect(existsSync(join(root, page))).toBe(true);
    }
  });
  it('renders the subject card and callout components on the home demo page', () => {
    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    expect(index).toContain('ct-subject-card');
    expect(index).toContain('ct-callout');
  });
  it('renders the promo card component on the individuals demo page', () => {
    const individuals = readFileSync(join(root, 'dist/individuals.html'), 'utf8');
    expect(individuals).toContain('ct-promo-card');
  });
  it('renders the navigation card component on the CivicTheme in 60 seconds demo page', () => {
    const series = readFileSync(join(root, 'dist/civictheme-60-second-series.html'), 'utf8');
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
      const file = page === 'index' ? 'dist/components.html' : `dist/components/${page}.html`;
      expect(existsSync(join(root, file))).toBe(true);
    }
  });

  it('emits the eight card classes on the cards family page', () => {
    const cards = readFileSync(join(root, 'dist/components/cards.html'), 'utf8');
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
    const index = readFileSync(join(root, 'dist/components.html'), 'utf8');
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
    const slider = readFileSync(join(root, 'dist/components/slider.html'), 'utf8');
    expect(slider).toContain('ct-slider');
    expect(slider).toContain('ct-theme-dark');

    const table = readFileSync(join(root, 'dist/components/table.html'), 'utf8');
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
      const html = readFileSync(join(root, `dist/components/${page}.html`), 'utf8');
      expect(duplicateIds(html), `duplicate ids on ${page}.html`).toEqual([]);
    }
  });

  it("gives every Header-family mobile navigation demo its own flyout target, not the real header's", () => {
    const html = readFileSync(join(root, 'dist/components/navigation.html'), 'utf8');
    const targets = [...html.matchAll(/data-flyout-target="([^"]*)"/g)].map((match) => match[1]);
    expect(targets.filter((target) => target === '.ct-mobile-navigation')).toHaveLength(1);
  });
});
