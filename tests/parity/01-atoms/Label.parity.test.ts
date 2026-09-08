import { describe } from 'vitest';
import Label from '@civictheme/atoms/Label.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'label' };

const REQUIRED_KEY = 'Label Component renders with required attributes 1';
const OPTIONAL_KEY = 'Label Component renders with optional attributes 1';
const DEFAULTS_KEY = 'Label Component renders with default tag and size when invalid values are provided 1';
const EMPTY_KEY = 'Label Component does not render when content is empty 1';
const STRIPS_KEY = 'Label Component strips HTML tags from attribute values 1';

describe('Label', () => {
  parityCase(meta, REQUIRED_KEY, Label, {
    content: 'Sample label',
    tag: 'label',
  });

  parityCase(meta, OPTIONAL_KEY, Label, {
    content: 'Sample label',
    theme: 'dark',
    tag: 'legend',
    size: 'large',
    isRequired: true,
    requiredText: '(custom-required)',
    for: 'input-id',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, DEFAULTS_KEY, Label, {
    content: 'Sample label',
    tag: 'b',
    size: 'huge',
  });

  parityCase(meta, EMPTY_KEY, Label, {
    content: '',
  });

  parityCase(meta, STRIPS_KEY, Label, {
    content: 'Sample label',
    'data-test': '<script>alert(1)</script>',
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, DEFAULTS_KEY, EMPTY_KEY, STRIPS_KEY]);
});
