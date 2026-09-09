import { describe, it, expect } from 'vitest';
import Header from '@civictheme/organisms/Header.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '03-organisms', name: 'header' };

const ALL_KEY = 'Header Component renders with all attributes provided 1';
const MISSING_KEY = 'Header Component renders with some attributes missing 1';
const EMPTY_KEY = 'Header Component does not render when all slots are empty 1';

describe('Header', () => {
  parityCase(meta, ALL_KEY, Header, {
    theme: 'dark',
    contentTop1: 'Top content 1',
    contentTop2: 'Top content 2',
    contentTop3: 'Top content 3',
    contentMiddle1: 'Middle content 1',
    contentMiddle2: 'Middle content 2',
    contentMiddle3: 'Middle content 3',
    contentBottom1: 'Bottom content 1',
    class: 'additional-class',
  });

  parityCase(meta, MISSING_KEY, Header, {
    theme: 'light',
    contentTop1: 'Top content 1',
    contentTop2: '',
    contentTop3: '',
    contentMiddle1: '',
    contentMiddle2: 'Middle content 2',
    contentMiddle3: '',
    contentBottom1: 'Bottom content 1',
    class: '',
  });

  parityCase(meta, EMPTY_KEY, Header, {
    theme: 'light',
    contentTop1: '',
    contentTop2: '',
    contentTop3: '',
    contentMiddle1: '',
    contentMiddle2: '',
    contentMiddle3: '',
    contentBottom1: '',
    class: '',
  });

  describe('slots', () => {
    const NAMES = [
      'contentTop1',
      'contentTop2',
      'contentTop3',
      'contentMiddle1',
      'contentMiddle2',
      'contentMiddle3',
      'contentBottom1',
    ] as const;

    for (const name of NAMES) {
      it(`${name}: slot renders identically to the string prop`, async () => {
        const viaProp = await renderNormalised(Header, { [name]: 'Slotted content' });
        const viaSlot = await renderNormalised(Header, {}, { [name]: 'Slotted content' });
        expect(viaSlot).toBe(viaProp);
      });
    }

    it('a slot alone (no string prop) still opens its wrapper markup', async () => {
      const html = await renderNormalised(Header, {}, { contentMiddle3: 'Live Nav' });
      expect(html).toContain('ct-header__content-middle3');
      expect(html).toContain('Live Nav');
    });
  });

  expectAllKeysCovered(meta, [ALL_KEY, MISSING_KEY, EMPTY_KEY]);
});
