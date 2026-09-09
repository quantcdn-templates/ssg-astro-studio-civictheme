import { describe, it, expect } from 'vitest';
import Slide from '@civictheme/organisms/Slide.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

/**
 * `slide.twig` and its own `.test.js`/`__snapshots__/slide.test.js.snap`
 * live inside the SAME upstream directory as `slider.twig`/`slider.test.js`
 * (`03-organisms/slider/`, not a `slide/` directory of its own) — see the
 * task brief's note on this pairing. `meta.dir` (added to the harness for
 * exactly this shape) points the directory segment at `slider` while
 * `meta.name` stays `slide`, matching the `.snap` filename stem.
 */
const meta = { layer: '03-organisms', name: 'slide', dir: 'slider' };

const DEFAULT_H3_KEY = 'Slide Component renders with default heading level (h3) 1';
const LEVEL_2_KEY = 'Slide Component renders with heading level 2 when heading_level is 2 1';
const LEVEL_3_KEY = 'Slide Component renders with heading level 3 when heading_level is 3 1';
const NO_TITLE_KEY = 'Slide Component does not render heading when title is empty 1';

describe('Slide', () => {
  parityCase(meta, DEFAULT_H3_KEY, Slide, {
    title: 'Slide Title',
    content: 'Slide content',
  });

  parityCase(meta, LEVEL_2_KEY, Slide, {
    title: 'Slide Title',
    content: 'Slide content',
    headingLevel: 2,
  });

  parityCase(meta, LEVEL_3_KEY, Slide, {
    title: 'Slide Title',
    content: 'Slide content',
    headingLevel: 3,
  });

  parityCase(meta, NO_TITLE_KEY, Slide, {
    content: 'Slide content',
  });

  expectAllKeysCovered(meta, [DEFAULT_H3_KEY, LEVEL_2_KEY, LEVEL_3_KEY, NO_TITLE_KEY]);

  // None of the following is exercised by any upstream snapshot
  // (slide.test.js only varies heading_level) — direct assertions on the
  // rendered markup, per slide.twig's own logic (see Slide.astro's doc
  // comment for the exact translation decisions).

  it('renders an image column when image is present, positioned by imagePosition', async () => {
    const left = await renderNormalised(Slide, {
      title: 'T',
      image: { url: 'https://example.com/a.jpg', alt: 'Alt text' },
    });
    expect(left).toContain('ct-slide__image');
    expect(left).toContain('first-m');
    expect(left).toContain('src="https://example.com/a.jpg"');

    const right = await renderNormalised(Slide, {
      title: 'T',
      image: { url: 'https://example.com/a.jpg', alt: 'Alt' },
      imagePosition: 'right',
    });
    expect(right).toContain('col-m-offset-1');
    expect(right).toContain('last-m');
  });

  it('opens the image column for an image object with no url (object-presence gate)', async () => {
    const html = await renderNormalised(Slide, { title: 'T', image: { alt: 'no url' } });
    expect(html).toContain('ct-slide__image');
    // Image.astro's own `url` gate still means no <img> renders.
    expect(html).not.toContain('<img');
  });

  it('does not render an image column when image is absent or empty', async () => {
    const html = await renderNormalised(Slide, { title: 'T' });
    expect(html).not.toContain('ct-slide__image');
    const empty = await renderNormalised(Slide, { title: 'T', image: {} });
    expect(empty).not.toContain('ct-slide__image');
  });

  it('renders tags via TagList when tags are present', async () => {
    const html = await renderNormalised(Slide, { title: 'T', tags: ['Tag One', 'Tag Two'] });
    expect(html).toContain('ct-slide__tags');
    expect(html).toContain('Tag One');
    expect(html).toContain('Tag Two');
  });

  it('renders a date tag (tertiary, no icon) when only a start date is given', async () => {
    const html = await renderNormalised(Slide, {
      title: 'T',
      date: 'Jan 1, 2024',
      dateIso: '2024-01-01',
    });
    expect(html).toContain('ct-slide__date');
    expect(html).toContain('ct-tag--tertiary');
    expect(html).toContain('ct-timestamp__start');
    expect(html).toContain('datetime="2024-01-01"');
    expect(html).toContain('Jan 1, 2024');
    expect(html).not.toContain('ct-tag--secondary');
    expect(html).not.toContain('ct-tag--with-icon');
  });

  it('renders a date tag (secondary, with an icon) with a start/end range', async () => {
    const html = await renderNormalised(Slide, {
      title: 'T',
      date: 'Jan 1, 2024',
      dateIso: '2024-01-01',
      dateEnd: 'Jan 2, 2024',
      dateEndIso: '2024-01-02',
    });
    expect(html).toContain('ct-tag--secondary');
    expect(html).toContain('ct-timestamp__end');
    expect(html).toContain('datetime="2024-01-02"');
    expect(html).toContain('ct-tag--with-icon');
  });

  it('renders links as an inlined item-list of Buttons (first primary, rest secondary)', async () => {
    const html = await renderNormalised(Slide, {
      title: 'T',
      links: [
        { text: 'First', url: '/first' },
        { text: 'Second', url: '/second', isExternal: true, isNewWindow: true },
      ],
    });
    expect(html).toContain('ct-slide__links');
    expect(html).toContain('ct-item-list--small');
    expect(html).toContain('ct-button--primary');
    expect(html).toContain('ct-button--secondary');
    expect(html).toContain('href="/first"');
    expect(html).toContain('href="/second"');
  });

  it('renders contentTop and contentBottom as raw HTML', async () => {
    const html = await renderNormalised(Slide, {
      title: 'T',
      contentTop: '<strong>Top</strong>',
      contentBottom: '<strong>Bottom</strong>',
    });
    expect(html).toContain('ct-slide__content-top');
    expect(html).toContain('<strong>Top</strong>');
    expect(html).toContain('ct-slide__content-bottom');
    expect(html).toContain('<strong>Bottom</strong>');
  });

  it('spreads rest attributes and class onto the root element', async () => {
    const html = await renderNormalised(Slide, { title: 'T', class: 'additional-class', 'data-test': 'true' });
    expect(html).toContain('additional-class');
    expect(html).toContain('data-test="true"');
  });
});
