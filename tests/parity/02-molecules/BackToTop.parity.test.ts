import { describe } from 'vitest';
import BackToTop from '@civictheme/molecules/BackToTop.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'back-to-top' };

const RENDERS_KEY = 'Back to Top Component renders correctly 1';
const BUTTON_KEY = 'Back to Top Component renders button with correct attributes 1';
const ICON_KEY = 'Back to Top Component button contains correct icon 1';

describe('BackToTop', () => {
  parityCase(meta, RENDERS_KEY, BackToTop);
  parityCase(meta, BUTTON_KEY, BackToTop);
  parityCase(meta, ICON_KEY, BackToTop);

  expectAllKeysCovered(meta, [RENDERS_KEY, BUTTON_KEY, ICON_KEY]);
});
