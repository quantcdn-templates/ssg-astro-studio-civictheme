import { describe } from 'vitest';
import Table from '@civictheme/atoms/Table.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'table' };

const REQUIRED_KEY = 'Table Component renders with required attributes 1';
const OPTIONAL_KEY = 'Table Component renders with optional attributes 1';
const EMPTY_KEY = 'Table Component does not render when all content arrays are empty 1';

describe('Table', () => {
  parityCase(meta, REQUIRED_KEY, Table, {
    rows: [
      ['Row 1, Col 1', 'Row 1, Col 2'],
      ['Row 2, Col 1', 'Row 2, Col 2'],
    ],
  });

  parityCase(meta, OPTIONAL_KEY, Table, {
    caption: 'Sample Table Caption',
    captionPosition: 'after',
    header: ['Header 1', 'Header 2'],
    rows: [
      ['Row 1, Col 1', 'Row 1, Col 2'],
      ['Row 2, Col 1', 'Row 2, Col 2'],
    ],
    footer: ['Footer 1', 'Footer 2'],
    isStriped: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Table, {
    rows: [],
    header: [],
    footer: [],
    caption: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY]);
});
