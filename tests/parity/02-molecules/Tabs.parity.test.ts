import { describe } from 'vitest';
import Tabs from '@civictheme/molecules/Tabs.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'tabs' };

const REQUIRED_KEY = 'Tabs Component renders with required attributes 1';
const OPTIONAL_KEY = 'Tabs Component renders with optional attributes 1';
const EMPTY_KEY = 'Tabs Component does not render when panels are empty 1';
const GENERATED_LINKS_KEY = 'Tabs Component renders with generated links from panels 1';

const PANELS = [
  { title: 'Tab 1', content: 'Content for Tab 1', id: 'tab1', isSelected: true },
  { title: 'Tab 2', content: 'Content for Tab 2', id: 'tab2', isSelected: false },
];

describe('Tabs', () => {
  parityCase(meta, REQUIRED_KEY, Tabs, {
    panels: PANELS,
  });

  parityCase(meta, OPTIONAL_KEY, Tabs, {
    panels: PANELS,
    theme: 'dark',
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Tabs, {
    panels: [],
  });

  parityCase(meta, GENERATED_LINKS_KEY, Tabs, {
    panels: PANELS,
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, GENERATED_LINKS_KEY]);
});
