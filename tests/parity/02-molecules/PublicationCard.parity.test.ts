import { describe } from 'vitest';
import PublicationCard from '@civictheme/molecules/PublicationCard.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'publication-card' };

const REQUIRED_KEY = 'Publication Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Publication Card Component renders with optional attributes 1';
const NO_FILE_KEY = 'Publication Card Component does not render when file is empty 1';
const EXT_SIZE_KEY = 'Publication Card Component renders file link with extension and size 1';
const SUMMARY_KEY = 'Publication Card Component renders with summary when provided 1';

describe('PublicationCard', () => {
  parityCase(meta, REQUIRED_KEY, PublicationCard, {
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
    title: 'Publication Card Title',
  });

  parityCase(meta, OPTIONAL_KEY, PublicationCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    title: 'Publication Card Title',
    summary: 'This is the summary of the publication card.',
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, NO_FILE_KEY, PublicationCard, {
    file: {},
  });

  parityCase(meta, EXT_SIZE_KEY, PublicationCard, {
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
  });

  parityCase(meta, SUMMARY_KEY, PublicationCard, {
    file: {
      name: 'Sample File',
      ext: 'PDF',
      url: 'https://example.com/sample.pdf',
      size: '2MB',
    },
    summary: 'This is the summary of the publication card.',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, NO_FILE_KEY, EXT_SIZE_KEY, SUMMARY_KEY]);
});
