import { describe } from 'vitest';
import BasicContent from '@civictheme/molecules/BasicContent.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'basic-content' };

const REQUIRED_KEY = 'Basic Content Component renders with required attributes 1';
const OPTIONAL_KEY = 'Basic Content Component renders with optional attributes 1';
const UNCONTAINED_KEY = 'Basic Content Component renders without containment 1';
const EMPTY_KEY = 'Basic Content Component does not render when content is empty 1';

describe('BasicContent', () => {
  parityCase(meta, REQUIRED_KEY, BasicContent, {
    content: 'This is basic content.',
  });

  parityCase(meta, OPTIONAL_KEY, BasicContent, {
    content: 'This is basic content with options.',
    theme: 'dark',
    isContained: true,
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, UNCONTAINED_KEY, BasicContent, {
    content: 'This content is not contained.',
    isContained: false,
  });

  parityCase(meta, EMPTY_KEY, BasicContent, {
    content: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, UNCONTAINED_KEY, EMPTY_KEY]);
});
