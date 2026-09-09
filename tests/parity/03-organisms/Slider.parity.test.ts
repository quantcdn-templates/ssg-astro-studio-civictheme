import { describe, it, expect } from 'vitest';
import Slider from '@civictheme/organisms/Slider.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'slider' };

const REQUIRED_KEY = 'Slider Component renders with only required attributes 1';
const ALL_KEY = 'Slider Component renders with all attributes provided 1';
const SOME_MISSING_KEY = 'Slider Component renders without some attributes 1';
const EMPTY_KEY = 'Slider Component does not render when slides are empty 1';

describe('Slider', () => {
  parityCase(meta, REQUIRED_KEY, Slider, {
    slides: '<div class="slide">Slide 1</div>',
  });

  parityCase(meta, ALL_KEY, Slider, {
    contentTop: 'Top Content',
    title: 'Slider Title',
    slides: '<div class="slide">Slide 1</div><div class="slide">Slide 2</div>',
    previousLabel: 'Previous Slide',
    nextLabel: 'Next Slide',
    contentBottom: 'Bottom Content',
    theme: 'dark',
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'additional-class',
  });

  parityCase(meta, SOME_MISSING_KEY, Slider, {
    contentTop: 'Top Content',
    title: 'Slider Title',
    slides: '<div class="slide">Slide 1</div>',
    previousLabel: 'Previous Slide',
    nextLabel: 'Next Slide',
    contentBottom: '',
    theme: 'light',
    verticalSpacing: '',
    withBackground: false,
  });

  parityCase(meta, EMPTY_KEY, Slider, {
    slides: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, ALL_KEY, SOME_MISSING_KEY, EMPTY_KEY]);

  // Task 14c: `contentTop`/`title`/`contentBottom` also have Astro slots
  // that take precedence over the string props.
  describe('slot vs string-prop parity', () => {
    const slides = '<div class="slide">Slide 1</div>';

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Slider, { slides, contentTop: 'Top content' });
      const viaSlot = await renderNormalised(Slider, { slides }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    // `title` is also read as a plain string for the root `aria-label`
    // (independent of the printed heading), so both variants pass the
    // same `title` string prop here — only the printed heading markup
    // differs between the string-prop path and the slot.
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Slider, { slides, title: 'Slider Title' });
      const viaSlot = await renderNormalised(
        Slider,
        { slides, title: 'Slider Title' },
        { title: '<h2 class="ct-heading ct-slider__title ct-theme-light">Slider Title</h2>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(Slider, { slides, contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(Slider, { slides }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(Slider, { slides }, { contentTop: 'Live Top' });
      expect(html).toContain('ct-slider__content__top');
      expect(html).toContain('Live Top');
    });
  });
});
