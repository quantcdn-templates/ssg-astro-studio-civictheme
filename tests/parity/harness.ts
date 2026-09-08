/**
 * Parity harness: renders an Astro component via the Astro Container API and
 * compares its normalised markup against an upstream CivicTheme Twig snapshot.
 *
 * Usage contract for every `<Name>.parity.test.ts` file:
 *   1. Define `const meta = { layer: '01-atoms', name: 'paragraph' };` (etc).
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

function snapshotFile(root: string, layer: string, name: string): string {
  return join(root, 'packages/twig/components', layer, name, '__snapshots__', `${name}.test.js.snap`);
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

/** Lists every `exports[`…`]` key defined in the `.snap` file for `layer`/`name`. */
export function listSnapshotKeys(layer: string, name: string, root: string = UIKIT): string[] {
  const file = snapshotFile(root, layer, name);
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

export function upstreamSnapshot(layer: string, name: string, key: string, root: string = UIKIT): string {
  const file = snapshotFile(root, layer, name);
  const src = readFileSync(file, 'utf8');
  const raw = extractSnapshotBody(src, key, file);
  const html = fixNonVoidSelfClosingTags(unescapeSnapshotBody(raw));
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
          [a.name, a.name === 'class' ? a.value.split(/\s+/).filter(Boolean).sort().join(' ') : a.value.trim()] as [
            string,
            string,
          ]
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

/** Defines one vitest case comparing Astro output to the upstream snapshot `key`. `layer`/`name` are the component's location, given explicitly via `meta`. */
export function parityCase(
  meta: { layer: string; name: string },
  key: string,
  Component: any,
  props?: Record<string, unknown>,
  slots?: Record<string, string>
) {
  it(key, async () => {
    const actual = await renderNormalised(Component, props, slots);
    const expected = normaliseHtml(upstreamSnapshot(meta.layer, meta.name, key));
    expect(actual).toBe(expected);
  });
}

/**
 * Pure helper: returns every upstream snapshot key for `meta.layer`/`meta.name`
 * that is NOT present in `coveredKeys`. Empty when every key is covered.
 */
export function missingSnapshotKeys(
  meta: { layer: string; name: string },
  coveredKeys: string[],
  root: string = UIKIT
): string[] {
  const allKeys = listSnapshotKeys(meta.layer, meta.name, root);
  return allKeys.filter((k) => !coveredKeys.includes(k));
}

/**
 * Guards against a new upstream snapshot key going unported: fails, listing
 * the missing keys, if the `.snap` file defines a key not present in
 * `coveredKeys` (the keys already passed to `parityCase` in the same file).
 */
export function expectAllKeysCovered(
  meta: { layer: string; name: string },
  coveredKeys: string[],
  root: string = UIKIT
) {
  it('covers every upstream snapshot key', () => {
    expect(missingSnapshotKeys(meta, coveredKeys, root)).toEqual([]);
  });
}
