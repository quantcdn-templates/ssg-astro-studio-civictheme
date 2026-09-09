import { describe } from 'vitest';
import Footer from '@civictheme/organisms/Footer.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
});
