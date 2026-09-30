import { describe, it, expect } from 'vitest';
import { menuTree, entryUrl, footerColumns } from '../src/lib/content';

describe('menuTree', () => {
  it('nests children under parents by label', () => {
    const tree = menuTree([
      { label: 'About', url: '/about-us' },
      { label: 'Team', url: '/about-us/team', parent: 'About' },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].below[0].title).toBe('Team');
  });

  it('keeps top-level items with no children in order', () => {
    const tree = menuTree([
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about-us' },
    ]);
    expect(tree).toHaveLength(2);
    expect(tree[0].title).toBe('Home');
    expect(tree[0].below).toHaveLength(0);
  });
});

describe('entryUrl', () => {
  it('maps pages to root and others to their collection', () => {
    expect(entryUrl('pages', 'about-us')).toBe('/about-us');
    expect(entryUrl('events', 'open-day')).toBe('/events/open-day');
  });

  it('maps the pages entry with id "index" to the site root', () => {
    expect(entryUrl('pages', 'index')).toBe('/');
  });

  it('maps news and publications to their collection path', () => {
    expect(entryUrl('news', 'annual-report')).toBe('/news/annual-report');
    expect(entryUrl('publications', 'budget-2026')).toBe('/publications/budget-2026');
  });
});

describe('footerColumns', () => {
  const group = (title: string, n: number) => ({
    title,
    url: `/${title}`,
    below: Array.from({ length: n }, (_, i) => ({ title: `${title} ${i}`, url: `/${title}/${i}`, below: [] })),
  });

  it('packs groups into columns in source order, balanced by link count', () => {
    const cols = footerColumns([group('a', 7), group('b', 5), group('c', 6), group('d', 6), group('e', 2), group('f', 3), group('g', 5)], 4);
    expect(cols).toHaveLength(4);
    expect(cols.flat().map((g) => g.title)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    const sizes = cols.map((c) => c.reduce((n, g) => n + 1 + g.below.length, 0));
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(8);
  });

  it('gives each group its own column when there are no more groups than columns', () => {
    expect(footerColumns([group('a', 3), group('b', 9)], 4).map((c) => c.map((g) => g.title))).toEqual([['a'], ['b']]);
  });

  it('returns no columns when no item has children', () => {
    expect(footerColumns([{ title: 'Privacy', url: '/privacy', below: [] }], 4)).toEqual([]);
  });
});
