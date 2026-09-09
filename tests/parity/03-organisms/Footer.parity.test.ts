import { describe, it, expect } from 'vitest';
import Footer from '@civictheme/organisms/Footer.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'footer' };

const ALL_KEY = 'Footer Component renders with all attributes provided 1';
const MISSING_KEY = 'Footer Component renders with some attributes missing 1';
const EMPTY_KEY = 'Footer Component does not render when all slots are empty 1';

describe('Footer', () => {
  parityCase(meta, ALL_KEY, Footer, {
    theme: 'dark',
    contentTop1: 'Top content 1',
    contentTop2: 'Top content 2',
    contentMiddle1: 'Middle content 1',
    contentMiddle2: 'Middle content 2',
    contentMiddle3: 'Middle content 3',
    contentMiddle4: 'Middle content 4',
    contentMiddle5: 'Middle content 5',
    contentBottom1: 'Bottom content 1',
    contentBottom2: 'Bottom content 2',
    backgroundImage: 'path/to/image.jpg',
    class: 'additional-class',
  });

  parityCase(meta, MISSING_KEY, Footer, {
    theme: 'light',
    contentTop1: 'Top content 1',
    contentTop2: '',
    contentMiddle1: '',
    contentMiddle2: 'Middle content 2',
    contentMiddle3: '',
    contentMiddle4: '',
    contentMiddle5: '',
    contentBottom1: 'Bottom content 1',
    contentBottom2: '',
    backgroundImage: '',
    class: '',
  });

  parityCase(meta, EMPTY_KEY, Footer, {
    theme: 'light',
    contentTop1: '',
    contentTop2: '',
    contentMiddle1: '',
    contentMiddle2: '',
    contentMiddle3: '',
    contentMiddle4: '',
    contentMiddle5: '',
    contentBottom1: '',
    contentBottom2: '',
    backgroundImage: '',
    class: '',
  });

  expectAllKeysCovered(meta, [ALL_KEY, MISSING_KEY, EMPTY_KEY]);

  // footer.twig:40 — the root gate's `is not empty` chain omits
  // content_middle5 on purpose (unlike the inner .ct-footer__middle
  // container's own gate, which includes it) — not exercised by any
  // upstream snapshot, so tested directly.
  it('renders nothing when only contentMiddle5 is supplied (root gate excludes it)', async () => {
    const html = await renderNormalised(Footer, { contentMiddle5: 'Middle content 5' });
    expect(html).toBe('');
  });

  it('renders when contentMiddle1 alone is supplied', async () => {
    const html = await renderNormalised(Footer, { contentMiddle1: 'Middle content 1' });
    expect(html).toContain('ct-footer__middle__content-middle1');
  });
});
