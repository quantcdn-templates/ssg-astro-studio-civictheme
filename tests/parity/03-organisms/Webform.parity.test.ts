import { describe, it, expect } from 'vitest';
import Webform from '@civictheme/organisms/Webform.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'webform' };

const REQUIRED_KEY = 'Webform Component renders with only required attributes 1';
const ALL_KEY = 'Webform Component renders with all attributes provided 1';
const NO_EXTRA_KEY = 'Webform Component renders without additional attributes and classes 1';
const EMPTY_KEY = 'Webform Component does not render when referenced_webform is empty 1';

describe('Webform', () => {
  parityCase(meta, REQUIRED_KEY, Webform, {
    referencedWebform: '<form>Webform content</form>',
  });

  parityCase(meta, ALL_KEY, Webform, {
    referencedWebform: '<form>Webform content</form>',
    theme: 'dark',
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'additional-class',
  });

  parityCase(meta, NO_EXTRA_KEY, Webform, {
    referencedWebform: '<form>Webform content</form>',
    theme: 'light',
    verticalSpacing: '',
    withBackground: false,
    class: '',
  });

  parityCase(meta, EMPTY_KEY, Webform, {
    referencedWebform: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, NO_EXTRA_KEY, EMPTY_KEY]);

  // Task 14c: `referencedWebform` also has an Astro slot that takes
  // precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    it('referencedWebform: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Webform, { referencedWebform: '<form>Webform HTML</form>' });
      const viaSlot = await renderNormalised(Webform, {}, { referencedWebform: '<form>Webform HTML</form>' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still renders the component', async () => {
      const html = await renderNormalised(Webform, {}, { referencedWebform: 'Live webform' });
      expect(html).toContain('ct-webform');
      expect(html).toContain('Live webform');
    });
  });
});
