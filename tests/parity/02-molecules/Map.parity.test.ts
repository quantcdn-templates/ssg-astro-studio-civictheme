import { describe, it, expect } from 'vitest';
import Map from '@civictheme/molecules/Map.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'map' };

const REQUIRED_KEY = 'Map Component renders with required attributes 1';
const OPTIONAL_KEY = 'Map Component renders with optional attributes 1';
const NO_URL_KEY = 'Map Component does not render when URL is empty 1';
const DEFAULT_VIEW_TEXT_KEY = 'Map Component renders with default view text 1';

describe('Map', () => {
  parityCase(meta, REQUIRED_KEY, Map, {
    url: 'https://www.example.com/map',
  });

  parityCase(meta, OPTIONAL_KEY, Map, {
    contentTop: 'Top content',
    address: '123 Main St, Anytown, USA',
    url: 'https://www.example.com/map',
    viewUrl: 'https://maps.google.com',
    viewText: 'View in Google Maps',
    contentBottom: 'Bottom content',
    theme: 'dark',
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_URL_KEY, Map, {
    url: '',
  });

  parityCase(meta, DEFAULT_VIEW_TEXT_KEY, Map, {
    url: 'https://www.example.com/map',
    viewUrl: 'https://maps.google.com',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_URL_KEY, DEFAULT_VIEW_TEXT_KEY]);

  // Task 14c: `contentTop`/`contentBottom` also have Astro slots that take
  // precedence over the string props.
  describe('slot vs string-prop parity', () => {
    const url = 'https://www.example.com/map';

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Map, { url, contentTop: 'Top content' });
      const viaSlot = await renderNormalised(Map, { url }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Map, { url, contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(Map, { url }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(Map, { url }, { contentTop: 'Live Top' });
      expect(html).toContain('ct-map__content-top');
      expect(html).toContain('Live Top');
    });
  });
});
