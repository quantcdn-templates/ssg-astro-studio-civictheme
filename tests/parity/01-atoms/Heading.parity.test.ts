import { describe, it, expect } from 'vitest';
import Heading from '@civictheme/atoms/Heading.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '01-atoms', name: 'heading' };

const REQUIRED_KEY = 'Heading Component renders with required attributes 1';
const OPTIONAL_KEY = 'Heading Component renders with optional attributes 1';
const EMPTY_KEY = 'Heading Component does not render when content is empty 1';

describe('Heading', () => {
  parityCase(meta, REQUIRED_KEY, Heading, {
    content: 'Sample Heading',
  });

  parityCase(meta, OPTIONAL_KEY, Heading, {
    content: 'Sample Heading',
    level: '3',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Heading, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);

  // heading.twig: `{% set level = level|default('2') %}` — Twig's `default`
  // filter falls back on any falsy value, not only an omitted one. No
  // upstream snapshot passes an explicit falsy `level`, so asserted
  // directly rather than via parityCase.
  it('defaults to level 2 for an explicit falsy level (empty string or 0), not only an omitted one', async () => {
    expect(await renderNormalised(Heading, { content: 'x', level: '' })).toContain('<h2');
    expect(await renderNormalised(Heading, { content: 'x', level: 0 })).toContain('<h2');
  });
});
