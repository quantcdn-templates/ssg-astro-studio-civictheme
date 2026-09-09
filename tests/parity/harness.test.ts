import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import {
  normaliseHtml,
  unwrapSnapshotHtml,
  upstreamSnapshot,
  listSnapshotKeys,
  missingSnapshotKeys,
  fixNonVoidSelfClosingTags,
  dedentPrettyPrintedHtml,
} from './harness';

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

  it('compares attribute values as-is, not whitespace-collapsed', () => {
    expect(normaliseHtml('<a href="a  b">x</a>')).not.toBe(normaliseHtml('<a href="a b">x</a>'));
  });

  it('compares a non-class attribute value as-is, not edge-trimmed', () => {
    expect(normaliseHtml('<a href=" x ">t</a>')).not.toBe(normaliseHtml('<a href="x">t</a>'));
  });

  it('does not collapse attribute value whitespace on a nested element either', () => {
    expect(normaliseHtml('<div><a href="a  b">x</a></div>')).not.toBe(normaliseHtml('<div><a href="a b">x</a></div>'));
  });
});

describe('fixNonVoidSelfClosingTags', () => {
  it('rewrites a self-closed non-void tag into an explicit open/close pair', () => {
    expect(normaliseHtml(fixNonVoidSelfClosingTags('<a href="#" />'))).toBe(normaliseHtml('<a href="#"></a>'));
  });

  it('leaves a genuinely void element self-closed', () => {
    expect(fixNonVoidSelfClosingTags('<br />')).toBe('<br />');
  });

  it('prevents a following sibling from being mis-nested inside a self-closed non-void tag', () => {
    const withoutFix = normaliseHtml('<a href="#" /><div>x</div>');
    const withFix = normaliseHtml(fixNonVoidSelfClosingTags('<a href="#" /><div>x</div>'));
    expect(withoutFix).not.toBe(withFix);
    expect(withFix).toBe('<a href="#"></a><div>x</div>');
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
  const meta = { layer: 'fixture-atoms', name: 'widget' };

  it('unwraps the outer <div> from a real snapshot entry', () => {
    const html = upstreamSnapshot(meta, 'Widget renders div wrapper 1', FIXTURE_ROOT);
    expect(normaliseHtml(html)).toBe(normaliseHtml('<span class="k">v</span>'));
  });

  it('unescapes a backtick and a ${ interpolation marker in the snapshot body', () => {
    const html = upstreamSnapshot(meta, 'Widget renders backtick and interpolation 1', FIXTURE_ROOT);
    expect(normaliseHtml(html)).toBe(normaliseHtml('<code>`escaped` and ${interpolated}</code>'));
  });
});

describe('listSnapshotKeys', () => {
  const meta = { layer: 'fixture-atoms', name: 'widget' };

  it('lists every exports[`…`] key in the .snap file, escape-aware', () => {
    expect(listSnapshotKeys(meta, FIXTURE_ROOT)).toEqual([
      'Widget renders div wrapper 1',
      'Widget renders backtick and interpolation 1',
      'Widget `quoted` name 1',
      'Widget mentions a fake entry 1',
    ]);
  });

  it('round-trips a key containing a backtick through upstreamSnapshot', () => {
    const html = upstreamSnapshot(meta, 'Widget `quoted` name 1', FIXTURE_ROOT);
    expect(normaliseHtml(html)).toBe(normaliseHtml('<span class="k">quoted-key</span>'));
  });

  it('does not count an exports[`…`] look-alike inside a snapshot body as its own key', () => {
    expect(listSnapshotKeys(meta, FIXTURE_ROOT)).not.toContain('not a real key');
  });
});

describe('meta.dir (directory segment differs from the .snap filename stem)', () => {
  // Mirrors the real `slide.test.js.snap` situation: `slide.twig`/
  // `slide.test.js` live inside the upstream `slider/` directory, not a
  // `slide/` directory of their own. This fixture reproduces that shape:
  // `widget-in-container.test.js.snap` lives inside a `widget-container/`
  // directory (`dir`), not a `widget-in-container/` directory (`name`).
  const meta = { layer: 'fixture-atoms', name: 'widget-in-container', dir: 'widget-container' };

  it('listSnapshotKeys finds the .snap file via meta.dir, not meta.name', () => {
    expect(listSnapshotKeys(meta, FIXTURE_ROOT)).toEqual(['WidgetInContainer renders 1']);
  });

  it('upstreamSnapshot reads the same file via meta.dir', () => {
    const html = upstreamSnapshot(meta, 'WidgetInContainer renders 1', FIXTURE_ROOT);
    expect(normaliseHtml(html)).toBe(normaliseHtml('<span class="k">contained</span>'));
  });

  it('missingSnapshotKeys/expectAllKeysCovered also thread meta.dir through', () => {
    expect(missingSnapshotKeys(meta, [], FIXTURE_ROOT)).toEqual(['WidgetInContainer renders 1']);
    expect(missingSnapshotKeys(meta, ['WidgetInContainer renders 1'], FIXTURE_ROOT)).toEqual([]);
  });

  it('omitting dir when name does not match the real directory fails to find the file (sanity check)', () => {
    expect(() => listSnapshotKeys({ layer: 'fixture-atoms', name: 'widget-in-container' }, FIXTURE_ROOT)).toThrow();
  });
});

describe('missingSnapshotKeys / expectAllKeysCovered', () => {
  const meta = { layer: 'fixture-atoms', name: 'widget' };

  it('returns the keys omitted from coveredKeys', () => {
    expect(missingSnapshotKeys(meta, ['Widget renders div wrapper 1'], FIXTURE_ROOT)).toEqual([
      'Widget renders backtick and interpolation 1',
      'Widget `quoted` name 1',
      'Widget mentions a fake entry 1',
    ]);
  });

  it('returns an empty list once every key is covered', () => {
    expect(
      missingSnapshotKeys(
        meta,
        [
          'Widget renders div wrapper 1',
          'Widget renders backtick and interpolation 1',
          'Widget `quoted` name 1',
          'Widget mentions a fake entry 1',
        ],
        FIXTURE_ROOT
      )
    ).toEqual([]);
  });

  it('expectAllKeysCovered fails its generated assertion when a key is omitted', () => {
    expect(() => {
      expect(missingSnapshotKeys(meta, ['Widget renders div wrapper 1'], FIXTURE_ROOT)).toEqual([]);
    }).toThrow();
  });
});

describe('dedentPrettyPrintedHtml', () => {
  it('adds no space between two elements pretty-format prints with no gap line between them', () => {
    expect(dedentPrettyPrintedHtml('<span\n  class="a"\n>\nFoo\n</span>\n<span\n  class="b"\n>\nBar\n</span>')).toBe(
      '<span class="a">Foo</span><span class="b">Bar</span>'
    );
  });

  it('adds a single space where a whitespace-only line separates two elements', () => {
    expect(
      dedentPrettyPrintedHtml('<span\n  class="a"\n>\nFoo\n</span>\n   \n<span\n  class="b"\n>\nBar\n</span>')
    ).toBe('<span class="a">Foo</span> <span class="b">Bar</span>');
  });

  it('keeps a trailing space on a text line verbatim', () => {
    expect(dedentPrettyPrintedHtml('<span\n  class="a"\n>\nFoo \n</span>')).toBe('<span class="a">Foo </span>');
  });

  it('keeps a tag name apart from its first attribute when they are split across lines', () => {
    expect(dedentPrettyPrintedHtml('<a\n  href="x"\n>\nz\n</a>')).toBe('<a href="x">z</a>');
  });

  it('does not require whitespace between two consecutive attribute lines (HTML5 does not either)', () => {
    // Regression guard: an earlier draft of this function joined every line
    // with nothing, which is fine for attribute-to-attribute (a quoted
    // value's closing quote already ends the previous attribute), but wrong
    // for tag-name-to-first-attribute (see the previous test).
    const out = dedentPrettyPrintedHtml('<a\n  class="x"\n  href="y"\n>\nz\n</a>');
    expect(normaliseHtml(out)).toBe(normaliseHtml('<a class="x" href="y">z</a>'));
  });

  it('strips only the whitespace actually present when a text line has LESS than its structural indent', () => {
    // Regression guard for a real fixture
    // (.upstream/uikit/packages/twig/components/02-molecules/field/
    // __snapshots__/field.test.js.snap:608): a `content: 'Field <em>...'`
    // string rendered as raw HTML puts a "Field " text node at HALF its
    // structurally-expected indent. An earlier draft stripped a fixed
    // `depth * 2` unconditionally, which ate into "Field" itself. Depth
    // here: div(depth0, indent0) > div.a(depth1, indent2) > [svg(depth2,
    // indent4) ... "Field "(expected indent4, actually only indent2) ...
    // em(depth2, indent4) ... " has an error"(indent5 = 4 + 1 real space)].
    const out = dedentPrettyPrintedHtml(
      '<div\n  class="a"\n>\n  <svg\n    class="b"\n  >\n    <path\n      d="M1"\n    />\n  </svg>\nField \n  <em>\n    Test input\n  </em>\n   has an error\n</div>'
    );
    expect(out).toBe('<div class="a"><svg class="b"><path d="M1"/></svg>Field <em>Test input</em> has an error</div>');
  });

  it("joins two consecutive text lines (one multi-line text node's own embedded newline) with a real newline", () => {
    // Verified live: `document.createTextNode('Hello\\nWorld')` prints via
    // jest's pretty-format as `Hello` then `World` on the very next line
    // with NO indentation on that second line at all — not a case any
    // pinned `.upstream` snapshot happens to hit, but the general rule
    // ("two real text lines back to back with no tag/blank line between
    // them are one split text node") must still hold.
    const out = dedentPrettyPrintedHtml('<span\n  class="a"\n>\nHello\nWorld\n</span>');
    expect(normaliseHtml(out)).toBe(normaliseHtml('<span class="a">Hello World</span>'));
  });

  describe('against real pretty-format-shaped fixtures', () => {
    const meta = { layer: 'fixture-atoms', name: 'spacing' };

    it('two sibling <span>s on adjacent indented lines normalise WITHOUT a space between them', () => {
      const html = upstreamSnapshot(meta, 'Spacing adjacent siblings with no gap 1', FIXTURE_ROOT);
      expect(normaliseHtml(html)).toBe(normaliseHtml('<span class="a">Foo</span><span class="b">Bar</span>'));
    });

    it('the same siblings with a whitespace-only line between them normalise WITH a single space', () => {
      const html = upstreamSnapshot(meta, 'Spacing adjacent siblings with a whitespace gap 1', FIXTURE_ROOT);
      expect(normaliseHtml(html)).toBe(normaliseHtml('<span class="a">Foo</span> <span class="b">Bar</span>'));
    });

    it('a multi-attribute tag split across lines parses with both attributes intact', () => {
      const html = upstreamSnapshot(meta, 'Spacing multi-attribute tag split across lines 1', FIXTURE_ROOT);
      expect(normaliseHtml(html)).toBe(normaliseHtml('<a class="x" href="y">z</a>'));
    });

    it('a text node printed with less than its structural indent (field.snap-shaped) keeps its real content intact', () => {
      const html = upstreamSnapshot(
        meta,
        'Spacing text node with less indentation than its structural depth 1',
        FIXTURE_ROOT
      );
      expect(html).toContain('</em> has an error');
      expect(normaliseHtml(html)).toBe(
        normaliseHtml('<div class="a"><svg class="b"><path d="M1"/></svg>Field <em>Test input</em> has an error</div>')
      );
    });

    it('a multi-line text node (embedded newline, no pinned snapshot exercises this) normalises to one space', () => {
      const html = upstreamSnapshot(meta, 'Spacing multi-line text node (embedded newline) 1', FIXTURE_ROOT);
      expect(normaliseHtml(html)).toBe(normaliseHtml('<span class="a">Hello World</span>'));
    });
  });

  describe('against the real field.test.js.snap fixture that surfaced this defect', () => {
    it('keeps the real leading space on the text node after </em> intact', () => {
      // No explicit root: uses the default UIKIT path (the real
      // `.upstream/uikit` checkout), not the hand-authored fixtures above.
      const html = upstreamSnapshot(
        { layer: '02-molecules', name: 'field' },
        'Field Component textarea with all attributes 1'
      );
      expect(html).toContain('</em> has an error');
    });
  });

  describe('one-line self-closing non-void tags (COMPLETE_TAG_RE)', () => {
    // Regression guard: `COMPLETE_TAG_RE`'s attribute run used to be greedy
    // (`[^<>]*`), so it swallowed the self-closing `/>` on a one-line tag
    // like `<svg />` — the `(\/)?` capture group never matched, the tag was
    // treated as an opening tag with children, and `depth` incremented
    // permanently with no matching decrement (no `</svg>` line ever
    // follows a genuinely self-closed element). Every text node after it
    // then had one extra level of structural indent stripped, eating into
    // its real leading whitespace. Made the lazy run (`[^<>]*?`) capture the
    // `/` correctly.
    it('a one-line <svg /> does not inflate depth: a following text line keeps its own real leading space', () => {
      const out = dedentPrettyPrintedHtml('<div>\n  <svg />\n   real space text\n</div>');
      expect(out).toBe('<div><svg /> real space text</div>');
    });

    it('a one-line <svg /> followed by a sibling element then text: depth still returns to the parent correctly', () => {
      const out = dedentPrettyPrintedHtml('<div>\n  <svg />\n  <em>\n    Test input\n  </em>\n   has an error\n</div>');
      expect(out).toBe('<div><svg /><em>Test input</em> has an error</div>');
    });

    it('a one-line <input ... /> behaves the same as <svg />', () => {
      const out = dedentPrettyPrintedHtml('<div>\n  <input type="x" />\n   real space text\n</div>');
      expect(out).toBe('<div><input type="x" /> real space text</div>');
    });

    it('a one-line <br /> (genuinely void) behaves the same as <svg />', () => {
      const out = dedentPrettyPrintedHtml('<div>\n  <br />\n   real space text\n</div>');
      expect(out).toBe('<div><br /> real space text</div>');
    });
  });
});

describe('BOOLEAN_ATTRS normalisation (normaliseHtml)', () => {
  it('treats checked="checked" as equal to bare checked', () => {
    expect(normaliseHtml('<input checked="checked" />')).toBe(normaliseHtml('<input checked />'));
  });

  it('treats disabled="disabled" as equal to bare disabled', () => {
    expect(normaliseHtml('<button disabled="disabled">x</button>')).toBe(normaliseHtml('<button disabled>x</button>'));
  });

  it('does NOT normalise aria-disabled — it is an ordinary string-valued attribute, not an HTML boolean one', () => {
    expect(normaliseHtml('<button aria-disabled="true">x</button>')).not.toBe(
      normaliseHtml('<button aria-disabled>x</button>')
    );
  });

  it('does NOT normalise aria-invalid either', () => {
    expect(normaliseHtml('<input aria-invalid="true" />')).not.toBe(normaliseHtml('<input aria-invalid />'));
  });
});
