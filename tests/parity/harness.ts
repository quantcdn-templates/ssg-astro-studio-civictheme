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

/** Snapshots wrap output in <div>…</div> (twig-testing-library). Return inner HTML. */
export function upstreamSnapshot(layer: string, name: string, key: string): string {
  const file = join(UIKIT, 'packages/twig/components', layer, name, '__snapshots__', `${name}.test.js.snap`);
  const src = readFileSync(file, 'utf8');
  const re = new RegExp('exports\\[`' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '`\\] = `([\\s\\S]*?)`;', 'm');
  const m = src.match(re);
  if (!m) throw new Error(`snapshot key not found: ${key} in ${file}`);
  const html = m[1].replace(/\\`/g, '`');
  const { document } = parseHTML(`<body>${html}</body>`);
  const wrapper = document.body.firstElementChild;
  return wrapper && wrapper.tagName === 'DIV' && !wrapper.attributes.length ? wrapper.innerHTML : html;
}

export function normaliseHtml(html: string): string {
  const { document } = parseHTML(`<body>${html}</body>`);
  const walk = (node: any): string => {
    if (node.nodeType === 3) {
      const t = node.textContent.replace(/\s+/g, ' ').trim();
      return t;
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
    const children = [...node.childNodes].map(walk).filter(Boolean).join('');
    const tag = node.tagName.toLowerCase();
    return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
  };
  return [...document.body.childNodes].map(walk).filter(Boolean).join('');
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
