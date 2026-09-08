import { describe, it, expect } from 'vitest';
import Button from '@civictheme/atoms/Button.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

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

  // button.twig: `value="{{- text -}}"` is unconditional (no `{% if %}`
  // guard) and trims the printed value — no upstream snapshot exercises a
  // submit/reset button with no `text` (or with untrimmed whitespace), so
  // asserted directly here rather than via parityCase.
  it('emits a trimmed, always-present value attribute on a submit/reset button, even with no text', async () => {
    const html = await renderNormalised(Button, { kind: 'submit' });
    // renderNormalised serialises an empty-string attribute value bare (no
    // `=""`) — see normaliseHtml's own attribute-serialisation step — so an
    // *always-present, empty* value attribute shows up as bare `value` here.
    expect(html).toContain(' value>');

    const trimmedHtml = await renderNormalised(Button, { kind: 'reset', text: '  Reset  ' });
    expect(trimmedHtml).toContain('value="Reset"');
  });
});
