import { describe } from 'vitest';
import Icon from '@civictheme/base/Icon.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '00-base', name: 'icon' };

const EMPTY_KEY = 'Icon Component does not render when symbol is empty 1';
const ADDITIONAL_KEY = 'Icon Component renders with additional attributes and classes 1';
const SIZE_KEY = 'Icon Component renders with custom size 1';
const DEFAULT_KEY = 'Icon Component renders with default values 1';

describe('Icon', () => {
  parityCase(meta, EMPTY_KEY, Icon, {
    symbol: '',
  });

  parityCase(meta, ADDITIONAL_KEY, Icon, {
    symbol: 'close',
    class: 'custom-modifier',
    'data-test': 'true',
  });

  parityCase(meta, SIZE_KEY, Icon, {
    symbol: 'close',
    size: 'large',
  });

  parityCase(meta, DEFAULT_KEY, Icon, {
    symbol: 'close',
  });

  expectAllKeysCovered(meta, [EMPTY_KEY, ADDITIONAL_KEY, SIZE_KEY, DEFAULT_KEY]);
});
