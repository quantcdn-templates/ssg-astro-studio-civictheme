import { describe } from 'vitest';
import SideNavigation from '@civictheme/organisms/SideNavigation.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '03-organisms', name: 'side-navigation' };

const REQUIRED_KEY = 'Side Navigation Component renders with only required attributes 1';
const ALL_KEY = 'Side Navigation Component renders with all attributes provided 1';
const MISSING_KEY = 'Side Navigation Component renders with some attributes missing 1';
const EMPTY_KEY = 'Side Navigation Component does not render when items are empty 1';

describe('SideNavigation', () => {
  parityCase(meta, REQUIRED_KEY, SideNavigation, {
    items: [{ title: 'Home', url: '/' }],
  });

  parityCase(meta, ALL_KEY, SideNavigation, {
    theme: 'dark',
    items: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
      { title: 'Services', url: '/services' },
      { title: 'Contact', url: '/contact' },
    ],
    title: 'Main Navigation',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'additional-class',
  });

  parityCase(meta, MISSING_KEY, SideNavigation, {
    theme: 'light',
    items: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
    ],
    title: '',
    verticalSpacing: '',
    class: '',
  });

  parityCase(meta, EMPTY_KEY, SideNavigation, {
    items: [],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, MISSING_KEY, EMPTY_KEY]);
});
