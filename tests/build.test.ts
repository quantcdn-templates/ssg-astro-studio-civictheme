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
});
