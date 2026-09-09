/**
 * Parity harness: renders an Astro component via the Astro Container API and
 * compares its normalised markup against an upstream CivicTheme Twig snapshot.
 *
 * Usage contract for every `<Name>.parity.test.ts` file:
 *   1. Define `const meta = { layer: '01-atoms', name: 'paragraph' };` (etc).
 *      If the upstream `.snap`/`.test.js` file lives in a directory whose
 *      name differs from `name` (e.g. `slide.test.js.snap` lives inside the
 *      `slider/` directory, alongside `slider.twig`), add `dir: 'slider'` —
 *      the directory segment then reads `meta.dir`, while the `.snap`
 *      filename stem still reads `meta.name` (matching the upstream file's
 *      own basename, not the directory's).
 *   2. Call `parityCase(meta, key, Component, props?, slots?)` once per
 *      `test(...)` in the upstream `<name>.test.js` that has a matching
 *      snapshot key.
 *   3. Collect every key passed to `parityCase` into an array and finish the
 *      file with `expectAllKeysCovered(meta, keys)` — this guards against a
 *      new upstream snapshot key silently going unported.
 */
import { it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const UIKIT = process.env.UIKIT ?? join(process.cwd(), '.upstream/uikit');
let container: AstroContainer | undefined;

export async function renderComponent(
  Component: any,
  props: Record<string, unknown> = {},
  slots?: Record<string, string>
): Promise<string> {
  container ??= await AstroContainer.create();
  return container.renderToString(Component, { props, slots });
}

/** A component's location: `dir` is the directory segment when it differs from `name` (see the usage contract above). */
export interface SnapshotMeta {
  layer: string;
  name: string;
  dir?: string;
}

function snapshotFile(root: string, meta: SnapshotMeta): string {
  return join(
    root,
    'packages/twig/components',
    meta.layer,
    meta.dir ?? meta.name,
    '__snapshots__',
    `${meta.name}.test.js.snap`
  );
}

/**
 * Extracts the raw (still-escaped) body of one `exports[`key`] = `…`;` entry
 * from a Jest snapshot file's source text.
 *
 * The body is delimited by backticks, but may itself contain escaped
 * backticks (`` \` ``), escaped backslashes (`\\`) and escaped `${` sequences
 * (`` \$ ``) — exactly what Jest's snapshot serializer produces for content
 * that would otherwise break the enclosing template literal. `(?:\\.|[^`\\])*`
 * matches "an escaped pair" or "any char that isn't a backslash or backtick",
 * so it stops at the first real (unescaped) backtick rather than the first
 * literal one.
 */
function extractSnapshotBody(src: string, key: string, file: string): string {
  // `key` is the unescaped title (as a caller would write/read it). In the
  // .snap file itself, Jest escapes any backtick the key contains as `\``
  // (backslash + backtick, two literal bytes) — the same treatment the
  // snapshot *body* gets. So: first escape ordinary regex metacharacters,
  // then turn each backtick into the regex-source sequence `\\\`` (three
  // pattern characters: an escaped backslash, then a literal backtick) so
  // the compiled regex matches that literal two-byte `\`` run in the file,
  // rather than a single unescaped backtick.
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/`/g, '\\\\`');
  const re = new RegExp('exports\\[`' + escapedKey + '`\\] = `((?:\\\\.|[^`\\\\])*)`;', 'm');
  const m = src.match(re);
  if (!m) throw new Error(`snapshot key not found: ${key} in ${file}`);
  return m[1];
}

function unescapeSnapshotBody(raw: string): string {
  return raw.replace(/\\(`|\\|\$)/g, '$1');
}

// Matches a whole `exports[`key`] = `body`;` entry, escape-aware for both key
// and body (mirrors `extractSnapshotBody`). This is deliberately stricter
// than a naive `exports\[`([^`]*)`\]` scan: it requires the full
// `= `…`;` assignment shape immediately after the key, so literal text that
// merely *looks* like an export header (e.g. `exports[`x`]` appearing inside
// another entry's snapshot body) cannot be mistaken for a real entry.
const SNAPSHOT_ENTRY_RE = /exports\[`((?:\\.|[^`\\])*)`\] = `(?:\\.|[^`\\])*`;/g;

/** Lists every `exports[`…`]` key defined in the `.snap` file for `meta`. */
export function listSnapshotKeys(meta: SnapshotMeta, root: string = UIKIT): string[] {
  const file = snapshotFile(root, meta);
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(SNAPSHOT_ENTRY_RE)].map((m) => unescapeSnapshotBody(m[1]));
}

/** Snapshots wrap output in <div>…</div> (twig-testing-library). Return inner HTML, unwrapped. */
export function unwrapSnapshotHtml(html: string): string {
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const wrapper = document.body.firstElementChild;
  return wrapper && wrapper.tagName === 'DIV' && !wrapper.attributes.length ? wrapper.innerHTML : html;
}

// HTML void elements: the only tags where a trailing `/>` is meaningful to
// an HTML (non-XML) parser. Jest's pretty-format DOM serializer renders ANY
// childless element self-closed (`<a ... />`) purely as a display
// convention — but outside foreign content (svg/math), a `/` before `>` on a
// non-void tag like `<a>` is not real self-closing syntax and is silently
// ignored by an HTML parser, which then treats everything that follows as
// nested inside that (still-open) element until it finds a real `</a>`.
// Rewriting these back into an explicit `<tag ...></tag>` pair before
// parsing avoids that mis-nesting. Safe to apply blindly to genuinely void
// tags too (were any to appear) since `<br></br>` parses to the same tree a
// real parser builds for `<br />`.
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** See `VOID_ELEMENTS` above. */
export function fixNonVoidSelfClosingTags(html: string): string {
  return html.replace(/<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)\/>/g, (match, tag: string, attrs: string) =>
    VOID_ELEMENTS.has(tag.toLowerCase()) ? match : `<${tag}${attrs}></${tag}>`
  );
}

// A line that, once its leading indentation is stripped, is *nothing but* a
// bare `<tagname` opening (no attributes, no `>` yet on this line) — Jest's
// pretty-format prints an element's tag name alone on its own line whenever
// it has at least one attribute to print on the lines that follow. Real
// HTML syntax requires at least one whitespace character between a tag name
// and its first attribute (unlike between two subsequent attributes, which
// an HTML5 tokenizer accepts with *no* separating whitespace at all, since
// the previous attribute's closing quote already ends its value) — so this
// specific join point is the one place `dedentPrettyPrintedHtml` must add a
// space back, or `<a\n  href="#"\n>` would dedent to the single malformed
// tag name `<ahref="#">` instead of `<a href="#">`.
const BARE_OPEN_TAG_RE = /^<[a-zA-Z][a-zA-Z0-9-]*$/;
// A line that is a complete tag (name, optional attributes, and its closing
// `>`/`/>`) all on one line — e.g. `<br>`, `<div>`, `<input type="text">`.
const COMPLETE_TAG_RE = /^<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^<>]*?)?\s*(\/)?>$/;
// A closing tag alone on its own line, e.g. `</div>`.
const CLOSE_TAG_RE = /^<\/([a-zA-Z][a-zA-Z0-9-]*)>$/;
// The bracket that closes a *multi-line* open tag's attribute list — printed
// on its own line once pretty-format has finished listing the attributes
// (`>` for an element with children to follow, `/>` for a self-closed one).
const PLAIN_CLOSE_BRACKET_RE = /^>$/;
const SELF_CLOSE_BRACKET_RE = /^\/>$/;

/**
 * Reverses Jest's pretty-format DOM-serializer formatting back into literal
 * HTML text, so `upstreamSnapshot`'s parse sees the same text a browser
 * would parse from the real (un-formatted) rendered output, not the
 * indentation pretty-format adds purely for human readability.
 *
 * Every attribute and every child node in a Jest DOM snapshot is printed on
 * its own line, indented by nesting depth, regardless of whether a real
 * whitespace TEXT NODE separates two sibling nodes in the live DOM. A line
 * that is *whitespace-only* (once its trailing newline is dropped)
 * corresponds to one line of a real whitespace text node's own content
 * (that content, split on '\n', is printed one raw line per split, with the
 * current indentation prepended) — pretty-format never emits such a line
 * between two elements/attributes it prints back-to-back with no text node
 * between them at all. So a whitespace-only line (any length, including
 * empty) emits a single space; any number of these in a row between two
 * non-whitespace lines still collapses to the ONE whitespace-collapsed text
 * node a browser would see there (`normaliseHtml`'s own text-node collapse
 * already reduces a run of adjacent space characters to one), so there is
 * no need to reproduce the exact original whitespace length.
 *
 * Every other line needs its leading pretty-format indentation stripped,
 * keeping the rest verbatim (including a text line's own trailing space,
 * which is real text-node content — e.g. the literal `text_start ~ ' '`
 * some twig templates produce, a real separator to whatever sibling
 * follows). That indentation is `nestingDepth * 2` spaces — tracked here by
 * walking the tag structure line by line (a `<tagname` line with no
 * attributes/close yet, an attribute line, the line with the closing
 * `>`/`/>`, or a whole `<tag ...>` / `<tag ... />` on one line, or a
 * `</tagname>` closing line) exactly as pretty-format itself nests them: a
 * non-void, non-self-closed tag's *children* print one level deeper than
 * the tag itself, starting on the line after the one that closes its
 * opening tag; a `</tagname>` line prints back at the *parent's* depth.
 *
 * The amount actually stripped from a line is `min(expectedIndent,
 * line's own leading-whitespace length)`, not the full `expectedIndent`
 * unconditionally — a real text node occasionally prints with LESS leading
 * whitespace than its structural nesting depth would predict (observed in
 * `.upstream/uikit/packages/twig/components/02-molecules/field/
 * __snapshots__/field.test.js.snap`, where a `content: 'Field <em>...'`
 * string rendered via `set:html`-equivalent raw HTML puts a "Field " text
 * node at half its expected indent). Clamping to what is actually there
 * means such a line still has all of its (whatever amount of) leading
 * whitespace consumed as structural padding, and none of its real text
 * accidentally eaten — while a line with MORE than the expected indent
 * (a real text node with its own genuine leading space, e.g. the "one
 * extra space" pattern already documented in this file) still keeps that
 * extra character as real content.
 *
 * Lines are then joined with NO separator — a newline between two
 * non-whitespace lines carries no meaning of its own in pretty-format's
 * output; only an explicit whitespace-only *line* does. The one exception
 * (besides `BARE_OPEN_TAG_RE`, below) is two consecutive *text* lines (real
 * content, not a tag/attribute/bracket line and not whitespace-only): that
 * shape only arises from ONE multi-line text node's own content being
 * split on its embedded `\n` (verified with a live `pretty-format` run —
 * `document.createTextNode('Hello\nWorld')` prints as `Hello` then `World`
 * on the next line, the second with NO indentation at all, matching the
 * `min(expectedIndent, actualIndent)` clamp above), so they are re-joined
 * with a real `\n` — which `normaliseHtml`'s text-node whitespace collapse
 * then turns into the single space a browser's rendered text would have
 * there. `BARE_OPEN_TAG_RE` (see above) gets a single space appended
 * instead, to keep the tag name and its first attribute apart.
 */
export function dedentPrettyPrintedHtml(body: string): string {
  let depth = 0;
  // The tag a bare `<tagname` open-line started, awaiting its closing
  // `>`/`/>` on a later line (attribute lines sit in between, one level
  // deeper than the tag's own line — see `lineDepth` below). `null` when
  // not currently inside such a multi-line opening tag.
  let pendingTag: { void: boolean } | null = null;

  const closesWithChildren = (tag: string, selfClosed: boolean) => !selfClosed && !VOID_ELEMENTS.has(tag.toLowerCase());

  type Kind = 'space' | 'tag' | 'text';
  const lines: Array<{ kind: Kind; content: string }> = body.split('\n').map((line) => {
    if (line.trim() === '') return { kind: 'space', content: ' ' };

    const bare = line.replace(/^[ \t]+/, '');
    const actualIndent = line.length - bare.length;
    const isCloseTag = CLOSE_TAG_RE.test(bare);
    const isCloseBracket = PLAIN_CLOSE_BRACKET_RE.test(bare) || SELF_CLOSE_BRACKET_RE.test(bare);
    // A `</tagname>` line prints at the *parent's* depth — one shallower
    // than the depth its own now-closing tag's children were at — so the
    // decrement must happen before this line's own indent is computed, not
    // after. An attribute line (still awaiting its tag's closing bracket)
    // prints one level DEEPER than its own tag's `<tagname` line — the
    // tag-open line, the closing bracket line, and a `</tagname>` line all
    // share one depth; only their (pending) attribute lines sit at
    // depth + 1.
    if (isCloseTag) depth = Math.max(0, depth - 1);
    const lineDepth = pendingTag && !isCloseBracket ? depth + 1 : depth;
    const expectedIndent = lineDepth * 2;
    const content = line.slice(Math.min(expectedIndent, actualIndent));

    if (isCloseTag) {
      pendingTag = null;
      return { kind: 'tag', content };
    }
    if (BARE_OPEN_TAG_RE.test(bare)) {
      pendingTag = { void: VOID_ELEMENTS.has(bare.slice(1).toLowerCase()) };
      return { kind: 'tag', content: `${content} ` };
    }
    if (PLAIN_CLOSE_BRACKET_RE.test(bare)) {
      if (pendingTag && !pendingTag.void) depth += 1;
      pendingTag = null;
      return { kind: 'tag', content };
    }
    if (SELF_CLOSE_BRACKET_RE.test(bare)) {
      pendingTag = null;
      return { kind: 'tag', content };
    }
    const completeMatch = bare.match(COMPLETE_TAG_RE);
    if (completeMatch) {
      const [, tag, selfClose] = completeMatch;
      if (closesWithChildren(tag, Boolean(selfClose))) depth += 1;
      pendingTag = null;
      return { kind: 'tag', content };
    }
    if (pendingTag) return { kind: 'tag', content }; // an attribute line
    return { kind: 'text', content };
  });

  return lines.reduce((out, line, i) => {
    const prev = lines[i - 1];
    const separator = prev && prev.kind === 'text' && line.kind === 'text' ? '\n' : '';
    return out + separator + line.content;
  }, '');
}

export function upstreamSnapshot(meta: SnapshotMeta, key: string, root: string = UIKIT): string {
  const file = snapshotFile(root, meta);
  const src = readFileSync(file, 'utf8');
  const raw = extractSnapshotBody(src, key, file);
  const dedented = dedentPrettyPrintedHtml(unescapeSnapshotBody(raw));
  const html = fixNonVoidSelfClosingTags(dedented);
  return unwrapSnapshotHtml(html);
}

// Collapses runs of whitespace in TEXT NODE content to a single space. Must
// never run over an already-serialised markup string (one containing tags
// with attributes) — doing so would also rewrite whitespace inside attribute
// values, which must compare as-is (except the class-token sort/trim
// already applied separately, below).
function collapseText(s: string): string {
  return s.replace(/\s+/g, ' ');
}

// HTML boolean attributes: presence alone conveys their meaning to a
// browser, so `checked`, `checked=""` and `checked="checked"` are all
// exactly equivalent. Astro's own renderer (`htmlBooleanAttributes` in
// astro/dist/runtime/server/render/util.js) always emits these bare when
// truthy, regardless of what string value a component passes in — so an
// Astro port can never reproduce a `.snap` fixture's literal
// `disabled="disabled"` / `checked="checked"` text (only Twig, running
// outside that renderer, can). Normalising every boolean attribute's value
// to '' on both sides (so only its presence is compared) matches real HTML
// semantics and is the only way parity can hold for these attributes.
const BOOLEAN_ATTRS = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'disablepictureinpicture',
  'disableremoteplayback',
  'formnovalidate',
  'inert',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'scoped',
  'seamless',
  'selected',
  'itemscope',
]);

export function normaliseHtml(html: string): string {
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const walk = (node: any): string => {
    if (node.nodeType === 3) {
      // Collapse runs of whitespace to one space but do NOT trim here — the
      // space (or its absence) at a text node's edge is what distinguishes
      // `Hello <b>world</b>` from `Hello<b>world</b>`. Edges are trimmed once,
      // per element, below.
      return collapseText(node.textContent);
    }
    if (node.nodeType !== 1) return '';
    const attrs = [...node.attributes]
      .filter((a: any) => !a.name.startsWith('data-astro-cid-'))
      .map(
        (a: any) =>
          [
            a.name,
            a.name === 'class'
              ? a.value.split(/\s+/).filter(Boolean).sort().join(' ')
              : BOOLEAN_ATTRS.has(a.name.toLowerCase())
                ? ''
                : a.value,
          ] as [string, string]
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => (v === '' ? k : `${k}="${v}"`))
      .join(' ');
    // Trim only — do NOT run a whitespace-collapse regex over this string:
    // it already contains fully-serialised child markup (tags + attribute
    // values), and a regex collapse would corrupt whitespace inside those
    // attribute values. Each text-node descendant was already
    // whitespace-collapsed on its own above, so only the edges (leading /
    // trailing whitespace contributed by an edge text-node child) need
    // trimming here. This is a per-element trim, which is stricter than
    // rendered-text equivalence would require — by design (see PORTING.md).
    const children = [...node.childNodes].map(walk).filter(Boolean).join('').trim();
    const tag = node.tagName.toLowerCase();
    return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
  };
  return [...document.body.childNodes].map(walk).filter(Boolean).join('').trim();
}

export async function renderNormalised(
  Component: any,
  props?: Record<string, unknown>,
  slots?: Record<string, string>
): Promise<string> {
  return normaliseHtml(await renderComponent(Component, props, slots));
}

/** Defines one vitest case comparing Astro output to the upstream snapshot `key`. `meta` is the component's location (see the usage contract above for `dir`). */
export function parityCase(
  meta: SnapshotMeta,
  key: string,
  Component: any,
  props?: Record<string, unknown>,
  slots?: Record<string, string>
) {
  it(key, async () => {
    const actual = await renderNormalised(Component, props, slots);
    const expected = normaliseHtml(upstreamSnapshot(meta, key));
    expect(actual).toBe(expected);
  });
}

/**
 * Pure helper: returns every upstream snapshot key for `meta`
 * that is NOT present in `coveredKeys`. Empty when every key is covered.
 */
export function missingSnapshotKeys(meta: SnapshotMeta, coveredKeys: string[], root: string = UIKIT): string[] {
  const allKeys = listSnapshotKeys(meta, root);
  return allKeys.filter((k) => !coveredKeys.includes(k));
}

/**
 * Guards against a new upstream snapshot key going unported: fails, listing
 * the missing keys, if the `.snap` file defines a key not present in
 * `coveredKeys` (the keys already passed to `parityCase` in the same file).
 */
export function expectAllKeysCovered(meta: SnapshotMeta, coveredKeys: string[], root: string = UIKIT) {
  it('covers every upstream snapshot key', () => {
    expect(missingSnapshotKeys(meta, coveredKeys, root)).toEqual([]);
  });
}
