import { describe } from 'vitest';
import Alert from '@civictheme/organisms/Alert.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '03-organisms', name: 'alert' };

const REQUIRED_KEY = 'Alert Component renders with required attributes 1';
const OPTIONAL_KEY = 'Alert Component renders with optional attributes 1';
const EMPTY_KEY = 'Alert Component does not render when description is empty 1';
const ICON_KEY = 'Alert Component renders with correct icon for alert type 1';

describe('Alert', () => {
  parityCase(meta, REQUIRED_KEY, Alert, {
    description: 'This is an info alert.',
  });

  parityCase(meta, OPTIONAL_KEY, Alert, {
    description: 'This is a warning alert.',
    theme: 'dark',
    type: 'warning',
    id: 'alert-1',
    title: 'Warning Alert',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Alert, {
    description: '',
  });

  parityCase(meta, ICON_KEY, Alert, {
    description: 'This is a success alert.',
    type: 'success',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, ICON_KEY]);
});
