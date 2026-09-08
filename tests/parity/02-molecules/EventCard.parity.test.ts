import { describe } from 'vitest';
import EventCard from '@civictheme/molecules/EventCard.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'event-card' };

const REQUIRED_KEY = 'Event Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Event Card Component renders with optional attributes 1';
const OBJECT_TAGS_KEY = 'Event Card Component renders tags provided as objects 1';

describe('EventCard', () => {
  parityCase(meta, REQUIRED_KEY, EventCard, {
    title: 'Event Title',
    summary: 'This is a summary of the event.',
    date: '2023-01-01 12:00',
    dateIso: '2023-01-01T12:00:00Z',
    location: 'Event Location',
  });

  parityCase(meta, OPTIONAL_KEY, EventCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    title: 'Event Title',
    summary: 'This is a summary of the event.',
    date: '2023-01-01 12:00',
    dateIso: '2023-01-01T12:00:00Z',
    location: 'Event Location',
    link: { url: 'https://example.com' },
    tags: ['Tag 1', 'Tag 2'],
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, OBJECT_TAGS_KEY, EventCard, {
    title: 'Event Title',
    tags: [
      { content: 'Tag 1', url: 'https://example.com/tag-1' },
      { content: 'Tag 2' },
    ],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, OBJECT_TAGS_KEY]);
});
