import { describe } from 'vitest';
import Datetime from '@civictheme/base/Datetime.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '00-base', name: 'datetime' };

const EMPTY_KEY = 'Datetime Component does not render when start time is empty 1';
const CUSTOM_KEY = 'Datetime Component renders with custom attributes and classes 1';
const START_END_KEY = 'Datetime Component renders with start and end time 1';
const START_ONLY_KEY = 'Datetime Component renders with start time only 1';
const STRIP_KEY = 'Datetime Component strips HTML tags from attribute values 1';

describe('Datetime', () => {
  parityCase(meta, EMPTY_KEY, Datetime, {
    start: '',
  });

  parityCase(meta, CUSTOM_KEY, Datetime, {
    start: '2023-06-15T08:00',
    startIso: '2023-06-15T08:00:00Z',
    class: 'custom-class',
    'data-test': 'true',
  });

  parityCase(meta, START_END_KEY, Datetime, {
    start: '2023-06-15T08:00',
    startIso: '2023-06-15T08:00:00Z',
    end: '2023-06-15T17:00',
    endIso: '2023-06-15T17:00:00Z',
  });

  parityCase(meta, START_ONLY_KEY, Datetime, {
    start: '2023-06-15T08:00',
    startIso: '2023-06-15T08:00:00Z',
  });

  parityCase(meta, STRIP_KEY, Datetime, {
    start: '<b>2023-06-15T08:00</b>',
    startIso: '<i>2023-06-15T08:00:00Z</i>',
    end: '<b>2023-06-15T17:00</b>',
    endIso: '<i>2023-06-15T17:00:00Z</i>',
  });

  expectAllKeysCovered(meta, [EMPTY_KEY, CUSTOM_KEY, START_END_KEY, START_ONLY_KEY, STRIP_KEY]);
});
