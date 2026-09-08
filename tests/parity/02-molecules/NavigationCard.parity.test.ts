import { describe } from 'vitest';
import NavigationCard from '@civictheme/molecules/NavigationCard.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'navigation-card' };

const REQUIRED_KEY = 'Navigation Card Component renders with required attributes 1';
const OPTIONAL_ICON_KEY = 'Navigation Card Component renders with optional attributes, with icon 1';
const OPTIONAL_NO_ICON_KEY = 'Navigation Card Component renders with optional attributes, no icon, image as not icon 1';
const NO_TITLE_KEY = 'Navigation Card Component does not render when title is empty 1';
const IMAGE_AS_ICON_KEY = 'Navigation Card Component renders with image as icon 1';
const LINK_KEY = 'Navigation Card Component renders with link when provided 1';

describe('NavigationCard', () => {
  parityCase(meta, REQUIRED_KEY, NavigationCard, {
    title: 'Card Title',
    summary: 'This is a summary of the card.',
  });

  parityCase(meta, OPTIONAL_ICON_KEY, NavigationCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    imageAsIcon: true,
    icon: 'call',
    title: 'Card Title',
    summary: 'This is a summary of the card.',
    link: { text: 'Learn more', url: 'https://example.com', isNewWindow: true, isExternal: true },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, OPTIONAL_NO_ICON_KEY, NavigationCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    imageAsIcon: false,
    icon: '',
    title: 'Card Title',
    summary: 'This is a summary of the card.',
    link: { text: 'Learn more', url: 'https://example.com', isNewWindow: true, isExternal: true },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_TITLE_KEY, NavigationCard, {
    title: '',
    summary: 'This is a summary of the card.',
  });

  parityCase(meta, IMAGE_AS_ICON_KEY, NavigationCard, {
    title: 'Card Title',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    imageAsIcon: true,
  });

  parityCase(meta, LINK_KEY, NavigationCard, {
    title: 'Card Title',
    summary: 'This is a summary of the card.',
    link: { text: 'Learn more', url: 'https://example.com' },
  });

  expectAllKeysCovered(meta, [
    REQUIRED_KEY,
    OPTIONAL_ICON_KEY,
    OPTIONAL_NO_ICON_KEY,
    NO_TITLE_KEY,
    IMAGE_AS_ICON_KEY,
    LINK_KEY,
  ]);
});
