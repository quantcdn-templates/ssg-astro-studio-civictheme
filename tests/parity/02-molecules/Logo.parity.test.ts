import { describe } from 'vitest';
import Logo from '@civictheme/molecules/Logo.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'logo' };

const NO_LOGOS_KEY = 'Logo Component does not render when logos are empty 1';
const AS_DIV_KEY = 'Logo Component renders as div when URL is not provided 1';
const AS_LINK_KEY = 'Logo Component renders as link when URL is provided 1';
const PRIMARY_ONLY_KEY = 'Logo Component renders primary logo only for default type 1';
const OPTIONAL_KEY = 'Logo Component renders with optional attributes 1';

describe('Logo', () => {
  parityCase(meta, NO_LOGOS_KEY, Logo, { logos: {} });

  parityCase(meta, AS_DIV_KEY, Logo, {
    theme: 'light',
    type: 'default',
    logos: {
      primary: {
        mobile: { url: 'https://example.com/logo-mobile.png', alt: 'Logo Mobile' },
        desktop: { url: 'https://example.com/logo-desktop.png', alt: 'Logo Desktop' },
      },
    },
  });

  parityCase(meta, AS_LINK_KEY, Logo, {
    theme: 'light',
    type: 'default',
    logos: {
      primary: {
        mobile: { url: 'https://example.com/logo-mobile.png', alt: 'Logo Mobile' },
        desktop: { url: 'https://example.com/logo-desktop.png', alt: 'Logo Desktop' },
      },
    },
    url: 'https://example.com',
    title: 'Go to homepage',
  });

  parityCase(meta, PRIMARY_ONLY_KEY, Logo, {
    theme: 'light',
    type: 'default',
    logos: {
      primary: {
        mobile: { url: 'https://example.com/logo-mobile.png', alt: 'Logo Mobile' },
        desktop: { url: 'https://example.com/logo-desktop.png', alt: 'Logo Desktop' },
      },
    },
  });

  parityCase(meta, OPTIONAL_KEY, Logo, {
    theme: 'dark',
    type: 'stacked',
    logos: {
      primary: {
        mobile: { url: 'https://example.com/logo-mobile.png', alt: 'Logo Mobile' },
        desktop: { url: 'https://example.com/logo-desktop.png', alt: 'Logo Desktop' },
      },
      secondary: {
        mobile: { url: 'https://example.com/secondary-logo-mobile.png', alt: 'Secondary Logo Mobile' },
        desktop: { url: 'https://example.com/secondary-logo-desktop.png', alt: 'Secondary Logo Desktop' },
      },
    },
    url: 'https://example.com',
    title: 'Go to homepage',
    'data-test': 'true',
    class: 'custom-class',
  });

  expectAllKeysCovered(meta, [NO_LOGOS_KEY, AS_DIV_KEY, AS_LINK_KEY, PRIMARY_ONLY_KEY, OPTIONAL_KEY]);
});
