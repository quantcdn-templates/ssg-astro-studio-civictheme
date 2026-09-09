import { describe } from 'vitest';
import Navigation from '@civictheme/organisms/Navigation.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
});
