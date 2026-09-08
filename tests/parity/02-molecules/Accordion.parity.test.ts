import { describe } from 'vitest';
import Accordion from '@civictheme/molecules/Accordion.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'accordion' };

const REQUIRED_KEY = 'Accordion Component renders with required attributes 1';
const OPTIONAL_KEY = 'Accordion Component renders with optional attributes 1';
const EMPTY_KEY = 'Accordion Component does not render when panels are empty 1';
const EXPAND_ALL_KEY = 'Accordion Component expands all panels when expand_all is true 1';
const INDIVIDUAL_KEY = 'Accordion Component renders individual panels with expanded state 1';

describe('Accordion', () => {
  parityCase(meta, REQUIRED_KEY, Accordion, {
    panels: [
      { title: 'Panel 1', content: 'Content 1' },
      { title: 'Panel 2', content: 'Content 2' },
    ],
  });

  parityCase(meta, OPTIONAL_KEY, Accordion, {
    contentTop: 'Top content',
    expandAll: true,
    panels: [
      { title: 'Panel 1', content: 'Content 1' },
      { title: 'Panel 2', content: 'Content 2', expanded: true },
    ],
    contentBottom: 'Bottom content',
    theme: 'dark',
    withBackground: true,
    verticalSpacing: 'both',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Accordion, {
    panels: [],
  });

  parityCase(meta, EXPAND_ALL_KEY, Accordion, {
    expandAll: true,
    panels: [
      { title: 'Panel 1', content: 'Content 1' },
      { title: 'Panel 2', content: 'Content 2' },
    ],
  });

  parityCase(meta, INDIVIDUAL_KEY, Accordion, {
    panels: [
      { title: 'Panel 1', content: 'Content 1', expanded: true },
      { title: 'Panel 2', content: 'Content 2' },
    ],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, EXPAND_ALL_KEY, INDIVIDUAL_KEY]);
});
