import { describe, it, expect } from 'vitest';
import Alert from '@civictheme/organisms/Alert.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'alert' };

const REQUIRED_KEY = 'Alert Component renders with required attributes 1';
const OPTIONAL_KEY = 'Alert Component renders with optional attributes 1';
const EMPTY_KEY = 'Alert Component does not render when description is empty 1';
const ICON_KEY = 'Alert Component renders with correct icon for alert type 1';

describe('Alert', () => {
  parityCase(meta, REQUIRED_KEY, Alert, {
    description: 'This is an info alert.',
  });

  parityCase(meta, OPTIONAL_KEY, Alert, {
    description: 'This is a warning alert.',
    theme: 'dark',
    type: 'warning',
    id: 'alert-1',
    title: 'Warning Alert',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Alert, {
    description: '',
  });

  parityCase(meta, ICON_KEY, Alert, {
    description: 'This is a success alert.',
    type: 'success',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, ICON_KEY]);

  // Task 14c: `title`/`description` also have Astro slots that take
  // precedence over the string props.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Alert, { title: 'Alert Title', description: 'x' });
      const viaSlot = await renderNormalised(Alert, { description: 'x' }, { title: 'Alert Title' });
      expect(viaSlot).toBe(viaProp);
    });

    it('description: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Alert, { description: 'Alert description' });
      const viaSlot = await renderNormalised(Alert, {}, { description: 'Alert description' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a description slot alone (no string prop) still renders the alert', async () => {
      const html = await renderNormalised(Alert, {}, { description: 'Live description' });
      expect(html).toContain('ct-alert__summary');
      expect(html).toContain('Live description');
    });
  });
});
