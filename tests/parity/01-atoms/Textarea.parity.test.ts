import { describe } from 'vitest';
import Textarea from '@civictheme/atoms/Textarea.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'textarea' };

const REQUIRED_KEY = 'Textarea Component renders with required attributes 1';
const OPTIONAL_KEY = 'Textarea Component renders with optional attributes 1';
const EMPTY_KEY = 'Textarea Component does not render when name is empty 1';
const STRIPS_KEY = 'Textarea Component strips HTML tags from attribute values 1';

describe('Textarea', () => {
  parityCase(meta, REQUIRED_KEY, Textarea, {
    name: 'test-textarea',
    value: 'Sample text',
  });

  parityCase(meta, OPTIONAL_KEY, Textarea, {
    name: 'test-textarea',
    value: 'Sample text',
    placeholder: 'Enter text here',
    rows: 5,
    isInvalid: true,
    isDisabled: true,
    isRequired: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY, Textarea, {
    name: '',
  });

  parityCase(meta, STRIPS_KEY, Textarea, {
    name: 'test-textarea',
    value: 'Sample text',
    'data-test': '<script>alert(1)</script>',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, STRIPS_KEY]);
});
