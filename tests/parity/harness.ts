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
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('exports\\[`' + escapedKey + '`\\] = `((?:\\\\.|[^`\\\\])*)`;', 'm');
  const m = src.match(re);
  if (!m) throw new Error(`snapshot key not found: ${key} in ${file}`);
  return m[1];
}

function unescapeSnapshotBody(raw: string): string {
  return raw.replace(/\\(`|\\|\$)/g, '$1');
}

/** Lists every `exports[`…`]` key defined in the `.snap` file for `layer`/`name`. */
export function listSnapshotKeys(layer: string, name: string, root: string = UIKIT): string[] {
  const file = snapshotFile(root, layer, name);
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(/exports\[`([^`]*)`\]/g)].map((m) => m[1]);
}

/** Snapshots wrap output in <div>…</div> (twig-testing-library). Return inner HTML, unwrapped. */
export function unwrapSnapshotHtml(html: string): string {
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const wrapper = document.body.firstElementChild;
  return wrapper && wrapper.tagName === 'DIV' && !wrapper.attributes.length ? wrapper.innerHTML : html;
}

export function upstreamSnapshot(layer: string, name: string, key: string, root: string = UIKIT): string {
  const file = snapshotFile(root, layer, name);
  const src = readFileSync(file, 'utf8');
  const raw = extractSnapshotBody(src, key, file);
  const html = unescapeSnapshotBody(raw);
  return unwrapSnapshotHtml(html);
}

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function normaliseHtml(html: string): string {
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const walk = (node: any): string => {
    if (node.nodeType === 3) {
      // Collapse runs of whitespace to one space but do NOT trim here — the
      // space (or its absence) at a text node's edge is what distinguishes
      // `Hello <b>world</b>` from `Hello<b>world</b>`. Edges are trimmed once,
      // per element, below.
      return node.textContent.replace(/\s+/g, ' ');
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
    const children = collapse([...node.childNodes].map(walk).filter(Boolean).join(''));
    const tag = node.tagName.toLowerCase();
    return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
  };
  return collapse([...document.body.childNodes].map(walk).filter(Boolean).join(''));
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
 * Guards against a new upstream snapshot key going unported: fails, listing
 * the missing keys, if the `.snap` file defines a key not present in
 * `coveredKeys` (the keys already passed to `parityCase` in the same file).
 */
export function expectAllKeysCovered(meta: { layer: string; name: string }, coveredKeys: string[]) {
  it('covers every upstream snapshot key', () => {
    const allKeys = listSnapshotKeys(meta.layer, meta.name);
    const missing = allKeys.filter((k) => !coveredKeys.includes(k));
    expect(missing).toEqual([]);
  });
}
