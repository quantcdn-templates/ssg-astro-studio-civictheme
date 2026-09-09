import { describe, it, expect } from 'vitest';
import Tooltip from '@civictheme/molecules/Tooltip.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'tooltip' };

const REQUIRED_KEY = 'Tooltip Component renders with required attributes 1';
const OPTIONAL_KEY = 'Tooltip Component renders with optional attributes 1';
const EMPTY_KEY = 'Tooltip Component does not render when content is empty 1';
const ICON_SIZE_KEY = 'Tooltip Component renders with icon and icon size 1';

describe('Tooltip', () => {
  parityCase(meta, REQUIRED_KEY, Tooltip, {
    content: 'Tooltip content',
  });

  parityCase(meta, OPTIONAL_KEY, Tooltip, {
    content: 'Tooltip content',
    theme: 'dark',
    title: 'Tooltip title',
    'data-test': 'true',
    class: 'custom-class',
    icon: 'call',
  });

  parityCase(meta, EMPTY_KEY, Tooltip, {
    content: '',
  });

  parityCase(meta, ICON_SIZE_KEY, Tooltip, {
    content: 'Tooltip content',
    icon: 'call',
    iconSize: 'large',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, ICON_SIZE_KEY]);

  // Task 14c: `content` also has an Astro slot that takes precedence over
  // the string prop.
  describe('slot vs string-prop parity', () => {
    it('content: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Tooltip, { content: 'Tooltip content' });
      const viaSlot = await renderNormalised(Tooltip, {}, { content: 'Tooltip content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a content slot alone (no string prop) still renders the tooltip', async () => {
      const html = await renderNormalised(Tooltip, {}, { content: 'Live content' });
      expect(html).toContain('ct-tooltip__description__inner');
      expect(html).toContain('Live content');
    });
  });
});
