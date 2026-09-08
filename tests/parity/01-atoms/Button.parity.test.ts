import { describe } from 'vitest';
import Button from '@civictheme/atoms/Button.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '01-atoms', name: 'button' };

const REQUIRED_KEY = 'Button Component renders with required attributes 1';
const LINK_KEY = 'Button Component renders as a link with optional attributes 1';
const LINK_EXTERNAL_KEY = 'Button Component renders as a link with optional attributes, is external 1';
const SUBMIT_KEY = 'Button Component renders as a submit button 1';
const RESET_KEY = 'Button Component renders as a reset button 1';
const DISABLED_KEY = 'Button Component renders with disabled state 1';

describe('Button', () => {
  parityCase(meta, REQUIRED_KEY, Button, {
    text: 'Click me',
  });

  parityCase(meta, LINK_KEY, Button, {
    kind: 'link',
    text: 'Click me',
    url: 'https://example.com',
    isNewWindow: true,
    isExternal: false,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
    icon: 'call',
    iconPlacement: 'before',
  });

  parityCase(meta, LINK_EXTERNAL_KEY, Button, {
    kind: 'link',
    text: 'Click me',
    url: 'https://example.com',
    isNewWindow: true,
    isExternal: true,
    'data-test': 'true',
    class: 'custom-class',
    theme: 'dark',
    icon: 'call',
    iconPlacement: 'before',
  });

  parityCase(meta, SUBMIT_KEY, Button, {
    kind: 'submit',
    text: 'Submit',
  });

  parityCase(meta, RESET_KEY, Button, {
    kind: 'reset',
    text: 'Reset',
  });

  parityCase(meta, DISABLED_KEY, Button, {
    text: 'Click me',
    isDisabled: true,
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, LINK_KEY, LINK_EXTERNAL_KEY, SUBMIT_KEY, RESET_KEY, DISABLED_KEY]);
});
