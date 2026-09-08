import { describe } from 'vitest';
import Textfield from '@civictheme/atoms/Textfield.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'textfield' };

const REQUIRED_KEY = 'Textfield Component renders with required attributes 1';
const OPTIONAL_KEY = 'Textfield Component renders with optional attributes 1';
const EMPTY_KEY = 'Textfield Component does not render when name is empty 1';
const STRIPS_KEY = 'Textfield Component strips HTML tags from attribute values 1';

describe('Textfield', () => {
  parityCase(meta, REQUIRED_KEY, Textfield, {
    name: 'test-textfield',
    value: 'Sample text',
  });

  parityCase(meta, OPTIONAL_KEY, Textfield, {
    name: 'test-textfield',
    value: 'Sample text',
    placeholder: 'Enter text here',
    isInvalid: true,
    isDisabled: true,
    isRequired: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Textfield, {
    name: '',
  });

  parityCase(meta, STRIPS_KEY, Textfield, {
    name: 'test-textfield',
    value: 'Sample text',
    'data-test': '<script>alert(1)</script>',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, STRIPS_KEY]);
});
