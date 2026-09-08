import { describe } from 'vitest';
import NextStep from '@civictheme/molecules/NextStep.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'next-step' };

const REQUIRED_KEY = 'Next Steps Component renders with required attributes 1';
const OPTIONAL_KEY = 'Next Steps Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Next Steps Component does not render when title is empty 1';
const LINK_KEY = 'Next Steps Component renders with link when provided 1';

describe('NextStep', () => {
  parityCase(meta, REQUIRED_KEY, NextStep, {
    title: 'Next Steps Title',
    content: 'This is the content of the next steps.',
  });

  parityCase(meta, OPTIONAL_KEY, NextStep, {
    contentTop: 'Top content',
    title: 'Next Steps Title',
    content: 'This is the content of the next steps.',
    link: { url: 'https://example.com', isNewWindow: true, isExternal: true },
    contentBottom: 'Bottom content',
    theme: 'dark',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, NextStep, {
    title: '',
    content: 'This is the content of the next steps.',
  });

  parityCase(meta, LINK_KEY, NextStep, {
    title: 'Next Steps Title',
    content: 'This is the content of the next steps.',
    link: { url: 'https://example.com' },
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, LINK_KEY]);
});
