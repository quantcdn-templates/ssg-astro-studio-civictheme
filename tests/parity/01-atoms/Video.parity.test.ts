import { describe } from 'vitest';
import Video from '@civictheme/atoms/Video.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'video' };

const REQUIRED_KEY = 'Video Component renders with required attributes 1';
const OPTIONAL_KEY = 'Video Component renders with optional attributes 1';
const EMPTY_KEY = 'Video Component does not render when sources are empty 1';

describe('Video', () => {
  parityCase(meta, REQUIRED_KEY, Video, {
    sources: [{ url: 'https://example.com/video.mp4', type: 'video/mp4' }],
  });

  parityCase(meta, OPTIONAL_KEY, Video, {
    title: 'Sample Video',
    hasControls: true,
    sources: [{ url: 'https://example.com/video.mp4', type: 'video/mp4' }],
    poster: 'https://example.com/poster.jpg',
    width: '640',
    height: '360',
    fallbackText: 'Custom fallback text.',
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Video, {
    sources: [],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
