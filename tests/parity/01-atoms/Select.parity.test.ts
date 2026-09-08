import { describe } from 'vitest';
import Select from '@civictheme/atoms/Select.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'select' };

const REQUIRED_KEY = 'Select Component renders with required attributes 1';
const OPTIONAL_KEY = 'Select Component renders with optional attributes 1';
const OPTGROUP_KEY = 'Select Component renders optgroup with options 1';
const EMPTY_NAME_KEY = 'Select Component does not render when name or options are empty 1';
const EMPTY_OPTIONS_KEY = 'Select Component does not render when name or options are empty 2';
const STRIPS_KEY = 'Select Component strips HTML tags from attribute values 1';

describe('Select', () => {
  parityCase(meta, REQUIRED_KEY, Select, {
    name: 'test-select',
    options: [
      { type: 'option', label: 'Option 1', value: '1' },
      { type: 'option', label: 'Option 2', value: '2' },
    ],
  });

  parityCase(meta, OPTIONAL_KEY, Select, {
    name: 'test-select',
    id: 'select-id',
    options: [
      { type: 'option', label: 'Option 1', value: '1', isSelected: true },
      { type: 'option', label: 'Option 2', value: '2' },
      { type: 'option', label: 'Option 3', value: '3', isDisabled: true },
    ],
    theme: 'dark',
    isMultiple: true,
    isInvalid: true,
    isDisabled: true,
    isRequired: true,
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, OPTGROUP_KEY, Select, {
    name: 'test-select',
    options: [
      {
        type: 'optgroup',
        label: 'Group 1',
        options: [
          { label: 'Option 1.1', value: '1.1' },
          { label: 'Option 1.2', value: '1.2' },
        ],
      },
      {
        type: 'option',
        label: 'Option 2',
        value: '2',
      },
    ],
  });

  parityCase(meta, EMPTY_NAME_KEY, Select, {
    name: '',
    options: [{ type: 'option', label: 'Option 1', value: '1' }],
  });

  parityCase(meta, EMPTY_OPTIONS_KEY, Select, {
    name: 'test-select',
    options: [],
  });

  parityCase(meta, STRIPS_KEY, Select, {
    name: 'test-select',
    options: [{ type: 'option', label: 'Option 1', value: '1' }],
    'data-test': '<script>alert(1)</script>',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, OPTGROUP_KEY, EMPTY_NAME_KEY, EMPTY_OPTIONS_KEY, STRIPS_KEY]);
});
