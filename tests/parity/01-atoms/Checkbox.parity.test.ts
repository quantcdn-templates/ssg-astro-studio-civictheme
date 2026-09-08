import { describe } from 'vitest';
import Checkbox from '@civictheme/atoms/Checkbox.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'checkbox' };

const REQUIRED_KEY = 'Checkbox Component renders with required attributes 1';
const OPTIONAL_KEY = 'Checkbox Component renders with optional attributes 1';
const EMPTY_KEY_1 = 'Checkbox Component does not render when name or id is empty 1';
const EMPTY_KEY_2 = 'Checkbox Component does not render when name or id is empty 2';

describe('Checkbox', () => {
  parityCase(meta, REQUIRED_KEY, Checkbox, {
    name: 'test-checkbox',
    id: 'test-checkbox-id',
  });

  parityCase(meta, OPTIONAL_KEY, Checkbox, {
    name: 'test-checkbox',
    id: 'test-checkbox-id',
    value: 'test-value',
    label: 'Test Label',
    isChecked: true,
    isRequired: true,
    isInvalid: true,
    isDisabled: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
  });

  parityCase(meta, EMPTY_KEY_1, Checkbox, {
    name: '',
    id: 'test-checkbox-id',
  });

  parityCase(meta, EMPTY_KEY_2, Checkbox, {
    name: 'test-checkbox',
    id: '',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY_1, EMPTY_KEY_2]);
});
