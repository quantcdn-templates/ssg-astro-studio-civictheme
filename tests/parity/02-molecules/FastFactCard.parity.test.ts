import { describe } from 'vitest';
import FastFactCard from '@civictheme/molecules/FastFactCard.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'fast-fact-card' };

const REQUIRED_KEY = 'Fast Fact Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Fast Fact Card Component renders with optional attributes 1';
const LINK_KEY = 'Fast Fact Card Component renders with link when provided 1';
const TITLE_CLICK_KEY = 'Fast Fact Card Component renders with title click only when is_title_click is true 1';

describe('FastFactCard', () => {
  parityCase(meta, REQUIRED_KEY, FastFactCard, {
    title: 'Fast Fact Title',
    summary: 'This is a summary of the fast fact.',
  });

  parityCase(meta, OPTIONAL_KEY, FastFactCard, {
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    title: 'Fast Fact Title',
    summary: 'This is a summary of the fast fact.',
    link: { url: 'https://example.com', isNewWindow: true },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, LINK_KEY, FastFactCard, {
    title: 'Fast Fact Title',
    summary: 'This is a summary of the fast fact.',
    link: { url: 'https://example.com' },
  });

  parityCase(meta, TITLE_CLICK_KEY, FastFactCard, {
    title: 'Fast Fact Title',
    summary: 'This is a summary of the fast fact.',
    link: { url: 'https://example.com' },
    isTitleClick: true,
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, LINK_KEY, TITLE_CLICK_KEY]);
});
