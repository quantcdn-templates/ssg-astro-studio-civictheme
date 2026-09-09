import { describe, it, expect } from 'vitest';
import VideoPlayer from '@civictheme/molecules/VideoPlayer.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'video-player' };

const REQUIRED_KEY = 'Video Component renders with required attributes 1';
const OEMBED_KEY = 'Video Component renders with oEmbed iframe source 1';
const RAW_KEY = 'Video Component renders with raw source 1';
const TRANSCRIPT_KEY = 'Video Component renders with transcript link 1';
const EMPTY_KEY = 'Video Component does not render when sources, embedded_source, and raw_source are all empty 1';

describe('VideoPlayer', () => {
  parityCase(meta, REQUIRED_KEY, VideoPlayer, {
    sources: [{ url: 'video.mp4', type: 'video/mp4' }],
  });

  parityCase(meta, OEMBED_KEY, VideoPlayer, {
    embeddedSource: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Sample Video',
    width: '560',
    height: '315',
  });

  parityCase(meta, RAW_KEY, VideoPlayer, {
    rawSource: '<iframe src="https://www.example.com" width="560" height="315"></iframe>',
  });

  parityCase(meta, TRANSCRIPT_KEY, VideoPlayer, {
    sources: [{ url: 'video.mp4', type: 'video/mp4' }],
    transcriptLink: {
      url: 'transcript.html',
      text: 'View Transcript',
      title: 'Transcript',
      isNewWindow: true,
      isExternal: false,
    },
  });

  parityCase(meta, EMPTY_KEY, VideoPlayer, {});

  expectAllKeysCovered(meta, [REQUIRED_KEY, OEMBED_KEY, RAW_KEY, TRANSCRIPT_KEY, EMPTY_KEY]);

  // verticalSpacing and the transcript-block-without-url case have no
  // upstream snapshot exercising them (no `.test.js` case sets either) —
  // verified by hand against `video-player.twig` lines 12, 40-41 (class)
  // and 74 (outer transcript-block gate), and asserted directly here.
  it('folds verticalSpacing into the root class list', async () => {
    const html = await renderNormalised(VideoPlayer, {
      sources: [{ url: 'video.mp4', type: 'video/mp4' }],
      verticalSpacing: 'both',
    });
    expect(html).toContain('ct-vertical-spacing--both');
  });

  it('opens the transcript block for a non-empty transcriptLink object even without a url', async () => {
    const html = await renderNormalised(VideoPlayer, {
      sources: [{ url: 'video.mp4', type: 'video/mp4' }],
      transcriptLink: { text: 'View Transcript' },
    });
    expect(html).toContain('ct-video-player__transcript-block');
    expect(html).not.toContain('ct-video-player__links');
  });
});
