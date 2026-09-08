import { describe, it, expect } from 'vitest';
import Fieldset from '@civictheme/atoms/Fieldset.astro';
import Icon from '@civictheme/base/Icon.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '01-atoms', name: 'fieldset' };

const DEFAULT_KEY = 'Fieldset Component renders with default values 1';
const LEGEND_KEY = 'Fieldset Component renders with legend 1';
const DESC_BEFORE_KEY = 'Fieldset Component renders with description before 1';
const DESC_AFTER_KEY = 'Fieldset Component renders with description after 1';
const DESC_INVISIBLE_KEY = 'Fieldset Component renders with invisible description 1';
const MESSAGE_KEY = 'Fieldset Component renders with message 1';
const FIELDS_KEY = 'Fieldset Component renders with fields 1';
const PREFIX_SUFFIX_KEY = 'Fieldset Component renders with prefix and suffix 1';
const ATTRS_KEY = 'Fieldset Component renders with additional attributes and classes 1';

describe('Fieldset', () => {
  parityCase(meta, DEFAULT_KEY, Fieldset, {});

  parityCase(meta, LEGEND_KEY, Fieldset, {
    legend: 'Test Legend',
  });

  parityCase(meta, DESC_BEFORE_KEY, Fieldset, {
    description: '<strong>Test Description</strong>',
    descriptionDisplay: 'before',
  });

  parityCase(meta, DESC_AFTER_KEY, Fieldset, {
    description: '<strong>Test Description</strong>',
    descriptionDisplay: 'after',
  });

  parityCase(meta, DESC_INVISIBLE_KEY, Fieldset, {
    description: 'Test Description',
    descriptionDisplay: 'invisible',
  });

  parityCase(meta, MESSAGE_KEY, Fieldset, {
    message: '<strong>Test Message</strong>',
    messageType: 'warning',
  });

  parityCase(meta, FIELDS_KEY, Fieldset, {
    fields: '<div class="test-field">Test Field</div>',
  });

  parityCase(meta, PREFIX_SUFFIX_KEY, Fieldset, {
    prefix: '<div class="test-prefix"><span>Prefix</span></div>',
    suffix: '<div class="test-suffix"><span>Suffix</span></div>',
  });

  parityCase(meta, ATTRS_KEY, Fieldset, {
    'data-test': 'true',
    class: 'custom-modifier',
  });

  expectAllKeysCovered(meta, [
    DEFAULT_KEY,
    LEGEND_KEY,
    DESC_BEFORE_KEY,
    DESC_AFTER_KEY,
    DESC_INVISIBLE_KEY,
    MESSAGE_KEY,
    FIELDS_KEY,
    PREFIX_SUFFIX_KEY,
    ATTRS_KEY,
  ]);

  // fieldset.twig: `{% set _message_type = message_type|default('error') %}`
  // — no upstream snapshot passes `message` without `message_type`, so this
  // asserts the resolved default directly rather than via parityCase.
  it('defaults messageType to "error" (not FieldMessage\'s own "information" default) when message is given without one', async () => {
    const closeOutlineIconPath = (await renderNormalised(Icon, { symbol: 'close-outline' })).match(
      /<path d="([^"]+)"/
    )?.[1];
    const informationIconPath = (await renderNormalised(Icon, { symbol: 'information-mark' })).match(
      /<path d="([^"]+)"/
    )?.[1];
    const html = await renderNormalised(Fieldset, { message: 'Oops' });
    expect(html).toContain('ct-field-message--error');
    expect(html).not.toContain('ct-field-message--information');
    expect(closeOutlineIconPath).toBeTruthy();
    expect(informationIconPath).toBeTruthy();
    expect(html).toContain(closeOutlineIconPath);
    expect(html).not.toContain(informationIconPath);
  });
});
