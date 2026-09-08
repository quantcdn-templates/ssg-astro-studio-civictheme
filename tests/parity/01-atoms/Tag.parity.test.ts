import { describe, it, expect } from 'vitest';
import Tag from '@civictheme/atoms/Tag.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '01-atoms', name: 'tag' };

const REQUIRED_KEY = 'Tag Component renders with required attributes 1';
const OPTIONAL_KEY = 'Tag Component renders with optional attributes 1';
const EMPTY_KEY = 'Tag Component does not render when content is empty 1';

describe('Tag', () => {
  parityCase(meta, REQUIRED_KEY, Tag, {
    content: 'Sample Tag',
  });

  parityCase(meta, OPTIONAL_KEY, Tag, {
    content: 'Sample Tag',
    type: 'secondary',
    icon: 'call',
    iconPlacement: 'before',
    url: 'https://example.com',
    isNewWindow: true,
    isExternal: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Tag, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);

  // tag.twig's `icon_markup` is captured via an untrimmed `{% set %}…{% endset %}`
  // block, so it carries a real leading newline (from the template source before
  // the `{% include %}`) as well as the trailing newline the SVG asset file itself
  // ends with (already covered by the OPTIONAL_KEY 'before'-placement case above).
  // No upstream snapshot exercises `icon_placement: 'after'` (the component
  // default), so the leading-space side of that same untrimmed block is asserted
  // directly here instead of via parityCase.
  it('emits a space between content and an "after"-placed icon (icon_markup is captured via an untrimmed {% set %} block)', async () => {
    const html = await renderNormalised(Tag, {
      content: 'Sample Tag',
      icon: 'call',
      iconPlacement: 'after',
    });
    expect(html).toContain('Sample Tag <svg');
    expect(html).not.toContain('Sample Tag<svg');
  });
});
