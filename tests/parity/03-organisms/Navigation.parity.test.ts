import { describe, it, expect } from 'vitest';
import Navigation from '@civictheme/organisms/Navigation.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'navigation' };

const REQUIRED_KEY = 'Navigation Component renders with only required attributes 1';
const ALL_KEY = 'Navigation Component renders with all attributes provided 1';
const MISSING_KEY = 'Navigation Component renders with some attributes missing 1';
const SUBMENU_KEY = 'Navigation Component renders correctly when items have submenus 1';
const EMPTY_KEY = 'Navigation Component does not render when items are empty 1';

describe('Navigation', () => {
  parityCase(meta, REQUIRED_KEY, Navigation, {
    items: [{ title: 'Home', url: '/' }],
  });

  parityCase(meta, ALL_KEY, Navigation, {
    theme: 'dark',
    items: [
      { title: 'Home', url: '/', below: null },
      { title: 'About', url: '/about', below: null },
      { title: 'Services', url: '/services', below: null },
      { title: 'Contact', url: '/contact', below: null },
    ],
    title: 'Main Navigation',
    type: 'dropdown',
    variant: 'primary',
    dropdownColumns: 3,
    dropdownColumnsFill: true,
    isAnimated: true,
    menuId: 'main-nav',
    class: 'additional-class',
  });

  parityCase(meta, MISSING_KEY, Navigation, {
    theme: 'light',
    items: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
    ],
    title: '',
    type: 'none',
    variant: 'secondary',
    class: '',
  });

  parityCase(meta, SUBMENU_KEY, Navigation, {
    theme: 'dark',
    items: [
      { title: 'Services', url: '/services', below: [{ title: 'Consulting', url: '/services/consulting' }] },
      { title: 'Contact', url: '/contact', below: [{ title: 'Support', url: '/contact/support' }] },
    ],
    type: 'drawer',
    variant: 'primary',
    dropdownColumns: 2,
    dropdownColumnsFill: false,
    isAnimated: true,
    menuId: 'main-nav',
    class: '',
  });

  parityCase(meta, EMPTY_KEY, Navigation, {
    items: [],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, MISSING_KEY, SUBMENU_KEY, EMPTY_KEY]);

  // Not exercised by any upstream snapshot: `{% if items[key].below %}` is
  // false for an empty array too (Twig arrays are falsy when empty), so an
  // item with `below: []` must get neither the collapsible decoration
  // (dropdown/drawer) nor have `below` actively stripped (none/inline) —
  // it is already inert either way.
  it('does not decorate an item whose below is an empty array, for type dropdown or drawer', async () => {
    const dropdown = await renderNormalised(Navigation, {
      items: [{ title: 'Home', url: '/', below: [] }],
      type: 'dropdown',
    });
    expect(dropdown).not.toContain('data-collapsible');
    expect(dropdown).not.toContain('ct-navigation__has-dropdown');

    const drawer = await renderNormalised(Navigation, {
      items: [{ title: 'Home', url: '/', below: [] }],
      type: 'drawer',
    });
    expect(drawer).not.toContain('data-collapsible');
    expect(drawer).not.toContain('ct-navigation__has-dropdown');
  });

  // Minor: type: 'dropdown' with a populated `below` — exercises
  // `dropdownModifierClass`'s non-drawer return (plain
  // `ct-navigation__has-dropdown`, no `dropdown-columns` class) and confirms
  // `dropdownColumns`/`dropdownColumnsFill` are drawer-only (no upstream
  // snapshot exercises dropdown-type WITH a real submenu — only the drawer
  // case does).
  it('decorates a dropdown-type item with a populated below with the plain has-dropdown class only', async () => {
    const html = await renderNormalised(Navigation, {
      items: [{ title: 'Services', url: '/services', below: [{ title: 'Consulting', url: '/services/consulting' }] }],
      type: 'dropdown',
      dropdownColumns: 3,
      dropdownColumnsFill: true,
      menuId: 'main-nav',
    });
    expect(html).toContain('data-collapsible');
    expect(html).toContain('data-collapsible-group="main-nav"');
    expect(html).toContain('ct-navigation__has-dropdown');
    expect(html).not.toContain('ct-navigation__dropdown-columns--3');
    expect(html).not.toContain('ct-navigation__dropdown-columns--fill');
    // No menu_level_classes for dropdown (drawer-only): the level-1 <ul>
    // gets no `container` class.
    expect(html).not.toContain('container');
    expect(html).toContain('Consulting');
  });
});
