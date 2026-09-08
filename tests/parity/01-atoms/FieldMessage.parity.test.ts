import { describe } from 'vitest';
import FieldMessage from '@civictheme/atoms/FieldMessage.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'field-message' };

const DEFAULT_KEY = 'Field Message Component renders with default values 1';
const CUSTOM_KEY = 'Field Message Component renders with custom theme and type 1';
const ATTRS_KEY = 'Field Message Component renders with additional attributes and classes 1';
const EMPTY_KEY = 'Field Message Component does not render when content is empty 1';
const ICON_KEY = 'Field Message Component renders with icons 1';

describe('Field Message', () => {
  parityCase(meta, DEFAULT_KEY, FieldMessage, {
    content: 'This is a message',
  });

  parityCase(meta, CUSTOM_KEY, FieldMessage, {
    content: 'This is an error message',
    theme: 'dark',
    type: 'error',
  });

  parityCase(meta, ATTRS_KEY, FieldMessage, {
    content: 'This is a message',
    'data-test': 'true',
    class: 'custom-modifier',
  });

  parityCase(meta, EMPTY_KEY, FieldMessage, {
    content: '',
  });

  parityCase(meta, ICON_KEY, FieldMessage, {
    content: 'This is a warning message',
    type: 'warning',
  });

  expectAllKeysCovered(meta, [DEFAULT_KEY, CUSTOM_KEY, ATTRS_KEY, EMPTY_KEY, ICON_KEY]);
});
