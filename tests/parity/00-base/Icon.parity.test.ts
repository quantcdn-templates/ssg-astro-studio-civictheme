import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import Icon from '@civictheme/base/Icon.astro';
import { parityCase, expectAllKeysCovered, renderComponent } from '../harness';

const meta = { layer: '00-base', name: 'icon' };

const EMPTY_KEY = 'Icon Component does not render when symbol is empty 1';
const ADDITIONAL_KEY = 'Icon Component renders with additional attributes and classes 1';
const SIZE_KEY = 'Icon Component renders with custom size 1';
const DEFAULT_KEY = 'Icon Component renders with default values 1';

describe('Icon', () => {
  parityCase(meta, EMPTY_KEY, Icon, {
    symbol: '',
  });

  parityCase(meta, ADDITIONAL_KEY, Icon, {
    symbol: 'close',
    class: 'custom-modifier',
    'data-test': 'true',
  });

  parityCase(meta, SIZE_KEY, Icon, {
    symbol: 'close',
    size: 'large',
  });

  parityCase(meta, DEFAULT_KEY, Icon, {
    symbol: 'close',
  });

  expectAllKeysCovered(meta, [EMPTY_KEY, ADDITIONAL_KEY, SIZE_KEY, DEFAULT_KEY]);

  // No upstream snapshot exercises a rest-attribute value containing `"` or
  // `&` (Icon builds its `<svg ...>` tag as a raw string, so an unescaped
  // value would truncate the attribute or corrupt the tag). Verified by
  // round-tripping through the same parser the harness uses elsewhere.
  it('escapes " and & in injected attribute values so they cannot break the surrounding markup', async () => {
    const html = await renderComponent(Icon, { symbol: 'close', 'data-test': 'a"b&c' });
    const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('data-test')).toBe('a"b&c');
  });
});
