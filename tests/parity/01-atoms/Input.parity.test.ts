import { describe } from 'vitest';
import Input from '@civictheme/atoms/Input.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'input' };

const REQUIRED_KEY = 'Input Component renders with required attributes 1';
const OPTIONAL_KEY = 'Input Component renders with optional attributes 1';
const EMPTY_KEY = 'Input Component does not render when name is empty 1';
const STRIPS_KEY = 'Input Component strips HTML tags from attribute values 1';

describe('Input', () => {
  parityCase(meta, REQUIRED_KEY, Input, {
    name: 'test-input',
    value: 'Sample text',
    type: 'text',
  });

  parityCase(meta, OPTIONAL_KEY, Input, {
    name: 'test-input',
    value: 'Sample text',
    type: 'text',
    placeholder: 'Enter text here',
    isInvalid: true,
    isDisabled: true,
    isRequired: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
    id: 'input-id',
  });

  parityCase(meta, EMPTY_KEY, Input, {
    name: '',
    type: 'text',
  });

  parityCase(meta, STRIPS_KEY, Input, {
    name: 'test-input',
    value: 'Sample text',
    type: 'text',
    'data-test': '<script>alert(1)</script>',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, STRIPS_KEY]);
});
