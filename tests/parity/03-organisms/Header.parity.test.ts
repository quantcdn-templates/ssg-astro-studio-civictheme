import { describe } from 'vitest';
import Header from '@civictheme/organisms/Header.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '03-organisms', name: 'header' };

const ALL_KEY = 'Header Component renders with all attributes provided 1';
const MISSING_KEY = 'Header Component renders with some attributes missing 1';
const EMPTY_KEY = 'Header Component does not render when all slots are empty 1';

describe('Header', () => {
  parityCase(meta, ALL_KEY, Header, {
    theme: 'dark',
    contentTop1: 'Top content 1',
    contentTop2: 'Top content 2',
    contentTop3: 'Top content 3',
    contentMiddle1: 'Middle content 1',
    contentMiddle2: 'Middle content 2',
    contentMiddle3: 'Middle content 3',
    contentBottom1: 'Bottom content 1',
    class: 'additional-class',
  });

  parityCase(meta, MISSING_KEY, Header, {
    theme: 'light',
    contentTop1: 'Top content 1',
    contentTop2: '',
    contentTop3: '',
    contentMiddle1: '',
    contentMiddle2: 'Middle content 2',
    contentMiddle3: '',
    contentBottom1: 'Bottom content 1',
    class: '',
  });

  parityCase(meta, EMPTY_KEY, Header, {
    theme: 'light',
    contentTop1: '',
    contentTop2: '',
    contentTop3: '',
    contentMiddle1: '',
    contentMiddle2: '',
    contentMiddle3: '',
    contentBottom1: '',
    class: '',
  });

  expectAllKeysCovered(meta, [ALL_KEY, MISSING_KEY, EMPTY_KEY]);
});
