import { describe } from 'vitest';
import Slider from '@civictheme/organisms/Slider.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
});
