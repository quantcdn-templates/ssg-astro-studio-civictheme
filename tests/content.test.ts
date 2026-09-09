import { describe, it, expect } from 'vitest';
import { menuTree, entryUrl } from '../src/lib/content';

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

  it('maps news and publications to their collection path', () => {
    expect(entryUrl('news', 'annual-report')).toBe('/news/annual-report');
    expect(entryUrl('publications', 'budget-2026')).toBe('/publications/budget-2026');
  });
});
