import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { normaliseHtml, unwrapSnapshotHtml, upstreamSnapshot, listSnapshotKeys } from './harness';

const FIXTURE_ROOT = join(__dirname, 'fixtures/uikit');

describe('normaliseHtml', () => {
  it('is not vacuous: a non-empty input normalises to a non-empty string', () => {
    expect(normaliseHtml('<div class="a">x</div>')).not.toBe('');
  });

  it('treats equivalent class order as equal', () => {
    expect(normaliseHtml('<div class="a b">x</div>')).toBe(normaliseHtml('<div class="b a">x</div>'));
  });

  it('treats a different class set as different', () => {
    expect(normaliseHtml('<div class="a">x</div>')).not.toBe(normaliseHtml('<div class="a b">x</div>'));
  });

  it('treats a different attribute set as different', () => {
    expect(normaliseHtml('<a href="x">t</a>')).not.toBe(normaliseHtml('<a href="x" target="_blank">t</a>'));
  });

  it('preserves the inter-element space between a text node and a following element', () => {
    expect(normaliseHtml('<p>Hello <b>world</b></p>')).not.toBe(normaliseHtml('<p>Hello<b>world</b></p>'));
  });

  it('collapses insignificant leading/trailing whitespace inside an element', () => {
    expect(normaliseHtml('<p>\n  Hello\n</p>')).toBe(normaliseHtml('<p>Hello</p>'));
  });

  it('treats an HTML entity and its literal character as equal after DOM parsing', () => {
    expect(normaliseHtml('<p>a &amp; b</p>')).toBe(normaliseHtml('<p>a & b</p>'));
  });

  it('strips data-astro-cid-* attributes', () => {
    expect(normaliseHtml('<div data-astro-cid-abc123 class="x">t</div>')).toBe(normaliseHtml('<div class="x">t</div>'));
  });
});

describe('unwrapSnapshotHtml', () => {
  it('strips an unattributed outer <div> wrapper (twig-testing-library)', () => {
    const unwrapped = unwrapSnapshotHtml('<div>\n  <span class="k">v</span>\n</div>');
    expect(normaliseHtml(unwrapped)).toBe(normaliseHtml('<span class="k">v</span>'));
  });

  it('leaves html alone when the outer element carries attributes', () => {
    const html = '<div class="k">v</div>';
    expect(unwrapSnapshotHtml(html)).toBe(html);
  });
});

describe('upstreamSnapshot (fixture .snap)', () => {
  it('unwraps the outer <div> from a real snapshot entry', () => {
    const html = upstreamSnapshot('fixture-atoms', 'widget', 'Widget renders div wrapper 1', FIXTURE_ROOT);
    expect(normaliseHtml(html)).toBe(normaliseHtml('<span class="k">v</span>'));
  });

  it('unescapes a backtick and a ${ interpolation marker in the snapshot body', () => {
    const html = upstreamSnapshot(
      'fixture-atoms',
      'widget',
      'Widget renders backtick and interpolation 1',
      FIXTURE_ROOT
    );
    expect(normaliseHtml(html)).toBe(normaliseHtml('<code>`escaped` and ${interpolated}</code>'));
  });
});

describe('listSnapshotKeys', () => {
  it('lists every exports[`…`] key in the .snap file', () => {
    expect(listSnapshotKeys('fixture-atoms', 'widget', FIXTURE_ROOT)).toEqual([
      'Widget renders div wrapper 1',
      'Widget renders backtick and interpolation 1',
    ]);
  });
});
