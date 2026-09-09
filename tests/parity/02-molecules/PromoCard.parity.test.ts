import { describe } from 'vitest';
import PromoCard from '@civictheme/molecules/PromoCard.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'promo-card' };

const REQUIRED_KEY = 'Promo Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Promo Card Component renders with optional attributes 1';
const NO_TITLE_KEY = 'Promo Card Component does not render when title is empty 1';
const LINK_KEY = 'Promo Card Component renders with link when provided 1';

describe('PromoCard', () => {
  parityCase(meta, REQUIRED_KEY, PromoCard, {
    title: 'Promo Card Title',
    summary: 'This is the summary of the promo card.',
  });

  parityCase(meta, OPTIONAL_KEY, PromoCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    subtitle: 'Subtitle text',
    date: '2023-12-01',
    dateIso: '2023-12-01T00:00:00Z',
    title: 'Promo Card Title',
    summary: 'This is the summary of the promo card.',
    link: { url: 'https://example.com', isNewWindow: true, isExternal: true },
    tags: ['Tag1', 'Tag2'],
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, PromoCard, {
    title: '',
    summary: 'This is the summary of the promo card.',
  });

  parityCase(meta, LINK_KEY, PromoCard, {
    title: 'Promo Card Title',
    summary: 'This is the summary of the promo card.',
    link: { url: 'https://example.com' },
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_TITLE_KEY, LINK_KEY]);
});
