import { describe } from 'vitest';
import Radio from '@civictheme/atoms/Radio.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'radio' };

const REQUIRED_KEY = 'Radio Component renders with required attributes 1';
const OPTIONAL_KEY = 'Radio Component renders with optional attributes 1';
const EMPTY_NAME_KEY = 'Radio Component does not render when name or id is empty 1';
const EMPTY_ID_KEY = 'Radio Component does not render when name or id is empty 2';
const STRIPS_KEY = 'Radio Component strips HTML tags from attribute values 1';

describe('Radio', () => {
  parityCase(meta, REQUIRED_KEY, Radio, {
    name: 'test-radio',
    id: 'radio-id',
    value: 'radio-value',
  });

  parityCase(meta, OPTIONAL_KEY, Radio, {
    name: 'test-radio',
    id: 'radio-id',
    value: 'radio-value',
    label: 'Radio Label',
    theme: 'dark',
    isChecked: true,
    isRequired: true,
    isInvalid: true,
    isDisabled: true,
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_NAME_KEY, Radio, {
    name: '',
    id: 'radio-id',
  });

  parityCase(meta, EMPTY_ID_KEY, Radio, {
    name: 'test-radio',
    id: '',
  });

  parityCase(meta, STRIPS_KEY, Radio, {
    name: 'test-radio',
    id: 'radio-id',
    value: 'radio-value',
    'data-test': '<script>alert(1)</script>',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_NAME_KEY, EMPTY_ID_KEY, STRIPS_KEY]);
});
