import { describe } from 'vitest';
import ServiceCard from '@civictheme/molecules/ServiceCard.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'service-card' };

const REQUIRED_KEY = 'Service Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Service Card Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Service Card Component does not render when title is empty 1';
const SLOTS_KEY = 'Service Card Component renders with content slots 1';

describe('ServiceCard', () => {
  parityCase(meta, REQUIRED_KEY, ServiceCard, {
    title: 'Service Card Title',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1' },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
  });

  parityCase(meta, OPTIONAL_KEY, ServiceCard, {
    contentTop: 'Top content',
    title: 'Service Card Title',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1', isNewWindow: true, isExternal: true },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
    contentBottom: 'Bottom content',
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, ServiceCard, {
    title: '',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1' },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
  });

  parityCase(meta, SLOTS_KEY, ServiceCard, {
    contentTop: 'Top content',
    title: 'Service Card Title',
    links: [
      { text: 'Link 1', url: 'https://example.com/link1' },
      { text: 'Link 2', url: 'https://example.com/link2' },
    ],
    contentBottom: 'Bottom content',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, SLOTS_KEY]);
});
