import { describe } from 'vitest';
import Fieldset from '@civictheme/atoms/Fieldset.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
});
