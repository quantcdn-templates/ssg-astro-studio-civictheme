import { describe, it, expect } from 'vitest';
import MobileNavigation from '@civictheme/organisms/MobileNavigation.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'mobile-navigation' };

const REQUIRED_KEY = 'Mobile Navigation Component renders with only required attributes 1';
const ALL_KEY = 'Mobile Navigation Component renders with all attributes provided 1';
const MISSING_KEY = 'Mobile Navigation Component renders with some attributes missing 1';
const TOP_ONLY_KEY = 'Mobile Navigation Component renders correctly when only top menu is provided 1';
const BOTTOM_ONLY_KEY = 'Mobile Navigation Component renders correctly when only bottom menu is provided 1';
const EMPTY_KEY = 'Mobile Navigation Component does not render when all attributes are empty 1';

describe('MobileNavigation', () => {
  parityCase(meta, REQUIRED_KEY, MobileNavigation, {
    topMenu: [{ title: 'Home', url: '/', isExternal: false }],
  });

  parityCase(meta, ALL_KEY, MobileNavigation, {
    theme: 'dark',
    contentTop: 'Top Content',
    contentBottom: 'Bottom Content',
    topMenu: [
      { title: 'Home', url: '/', isExternal: false },
      { title: 'About', url: '/about', isExternal: false },
    ],
    bottomMenu: [
      { title: 'Contact', url: '/contact', isExternal: false },
      { title: 'Help', url: '/help', isExternal: false },
    ],
    class: 'additional-class',
  });

  parityCase(meta, MISSING_KEY, MobileNavigation, {
    theme: 'light',
    contentTop: '',
    contentBottom: '',
    topMenu: [],
    bottomMenu: [],
    class: '',
  });

  parityCase(meta, TOP_ONLY_KEY, MobileNavigation, {
    theme: 'light',
    contentTop: '',
    contentBottom: '',
    topMenu: [
      { title: 'Home', url: '/', isExternal: false },
      { title: 'About', url: '/about', isExternal: false },
    ],
    bottomMenu: [],
    class: '',
  });

  parityCase(meta, BOTTOM_ONLY_KEY, MobileNavigation, {
    theme: 'light',
    contentTop: '',
    contentBottom: '',
    topMenu: [],
    bottomMenu: [
      { title: 'Contact', url: '/contact', isExternal: false },
      { title: 'Help', url: '/help', isExternal: false },
    ],
    class: '',
  });

  parityCase(meta, EMPTY_KEY, MobileNavigation, {});

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, MISSING_KEY, TOP_ONLY_KEY, BOTTOM_ONLY_KEY, EMPTY_KEY]);

  // Task 14c: `contentTop`/`contentBottom` also have Astro slots that take
  // precedence over the string props.
  describe('slot vs string-prop parity', () => {
    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(MobileNavigation, { contentTop: 'Top content' });
      const viaSlot = await renderNormalised(MobileNavigation, {}, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(MobileNavigation, { contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(MobileNavigation, {}, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(MobileNavigation, {}, { contentTop: 'Live Top' });
      expect(html).toContain('ct-mobile-navigation__content_top');
      expect(html).toContain('Live Top');
    });
  });
});
