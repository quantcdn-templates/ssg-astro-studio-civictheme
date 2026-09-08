import { describe } from 'vitest';
import FieldDescription from '@civictheme/atoms/FieldDescription.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'field-description' };

const DEFAULT_KEY = 'Field Description Component renders with default values 1';
const CUSTOM_KEY = 'Field Description Component renders with custom theme and size 1';
const ATTRS_KEY = 'Field Description Component renders with additional attributes and classes 1';
const EMPTY_KEY = 'Field Description Component does not render when content is empty 1';

describe('Field Description', () => {
  parityCase(meta, DEFAULT_KEY, FieldDescription, {
    content: 'This is a description',
  });

  parityCase(meta, CUSTOM_KEY, FieldDescription, {
    content: 'This is a description',
    theme: 'dark',
    size: 'large',
  });

  parityCase(meta, ATTRS_KEY, FieldDescription, {
    content: 'This is a description',
    'data-test': 'true',
    class: 'custom-modifier',
  });

  parityCase(meta, EMPTY_KEY, FieldDescription, {
    content: '',
  });

  expectAllKeysCovered(meta, [DEFAULT_KEY, CUSTOM_KEY, ATTRS_KEY, EMPTY_KEY]);
});
