import { describe, it, expect } from 'vitest';
import MobileNavigationMenu from '@civictheme/organisms/MobileNavigationMenu.astro';
import { renderNormalised } from '../harness';

// MobileNavigationMenu has no upstream `.test.js` / `__snapshots__` of its
// own — it is only exercised indirectly, inside mobile-navigation.test.js's
// snapshots (see MobileNavigation.parity.test.ts), and only ever with
// top-level (no `below`) items — smoke test per the task brief's rule for
// components with no upstream test, matching TextIcon's precedent. The
// `below`/flyout-submenu branch below is exercised here only for structural
// smoke coverage — no upstream snapshot pins it (see PORTING.md).
describe('MobileNavigationMenu (smoke — no own upstream test.js)', () => {
  it('renders nothing for an empty items array', async () => {
    const html = await renderNormalised(MobileNavigationMenu, { items: [] });
    expect(html).toBe('');
  });

  it('renders a level-0 menu with the ct-menu data-component-name', async () => {
    const html = await renderNormalised(MobileNavigationMenu, {
      items: [{ title: 'Home', url: '/' }],
    });
    expect(html).toContain('ct-menu--level-0');
    expect(html).toContain('data-component-name="ct-menu"');
    expect(html).toContain('ct-menu__item__link');
    expect(html).toContain('Home');
  });

  it('renders an open-subsection trigger and nested flyout panel for an item with children', async () => {
    const html = await renderNormalised(MobileNavigationMenu, {
      items: [{ title: 'Parent', url: '/parent', below: [{ title: 'Child', url: '/parent/child' }] }],
    });
    expect(html).toContain('ct-menu__item--has-children');
    expect(html).toContain('ct-mobile-navigation__open-subsection-trigger');
    expect(html).toContain('data-flyout-open-trigger');
    expect(html).toContain('data-flyout-panel');
    expect(html).toContain('ct-mobile-navigation__close-trigger');
    expect(html).toContain('Child');
  });
});
