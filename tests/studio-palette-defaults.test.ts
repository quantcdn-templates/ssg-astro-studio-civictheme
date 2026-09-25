/**
 * Studio inserts every `_components` palette item with its `defaults`. Those
 * defaults must render something the author can see and open again: every
 * site path they name must exist in `public/`, every required prop must have
 * a value, and the component must render non-empty HTML with them.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { demoPresent } from './demo-content';

const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'quant.studio.json'), 'utf8'));

interface PaletteItem {
  path: string;
  defaults?: Record<string, unknown>;
}

const items = manifest._components.items as PaletteItem[];
const nameOf = (item: PaletteItem) =>
  item.path
    .split('/')
    .pop()!
    .replace(/\.astro$/, '');

// Rendered as an empty shell that a client script fills from the page's
// headings, so its server HTML has no visible text of its own.
const CLIENT_FILLED = ['TableOfContents'];

/** Every string inside a (nested) defaults value. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** Site-relative file paths (with an extension), bare or inside HTML attributes. */
function assetPaths(value: unknown): string[] {
  const found = new Set<string>();
  for (const text of strings(value)) {
    for (const match of text.matchAll(/(?:^|["'(\s=])(\/[^"'()\s?#<>]*\.[a-z0-9]{2,5})(?=$|["')\s?#<>])/gi)) {
      found.add(match[1]);
    }
  }
  return [...found];
}

/** Names of the props an item's `interface Props` declares without `?`. */
function requiredProps(path: string): string[] {
  const source = readFileSync(join(root, path), 'utf8');
  const body = /interface Props\s*\{([\s\S]*?)\n\}/.exec(source)?.[1] ?? '';
  return [...body.matchAll(/^ {2}(\w+):/gm)].map((m) => m[1]);
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0 || value.some(isEmpty);
  return false;
}

describe('quant.studio.json palette defaults', () => {
  it.each(items.map((item) => [nameOf(item), item] as const))('%s: default paths exist in public/', (_, item) => {
    const missing = assetPaths(item.defaults ?? {}).filter((p) => !existsSync(join(root, 'public', p)));
    expect(missing).toEqual([]);
  });

  it.each(items.map((item) => [nameOf(item), item] as const))('%s: required props have values', (_, item) => {
    const empty = requiredProps(item.path).filter((prop) => isEmpty(item.defaults?.[prop]));
    expect(empty).toEqual([]);
  });

  it.skipIf(!demoPresent())('points ManualList slugs at published entries of its collection', () => {
    const item = items.find((i) => nameOf(i) === 'ManualList')!;
    const { collection, slugs } = item.defaults as { collection: string; slugs: string[] };
    for (const slug of slugs) {
      const file = join(root, 'src/content', collection, `${slug}.mdx`);
      expect(existsSync(file), `${collection}/${slug}`).toBe(true);
      expect(readFileSync(file, 'utf8'), `${collection}/${slug} is a draft`).toMatch(/^draft: false$/m);
    }
  });

  it.each(items.map((item) => [nameOf(item), item] as const))(
    '%s: renders non-empty HTML with its defaults',
    async (_, item) => {
      const container = await AstroContainer.create();
      const Component = (await import(/* @vite-ignore */ join(root, item.path))).default;
      const html = await container.renderToString(Component, { props: item.defaults ?? {} });
      const visible = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(style|script)[\s\S]*?<\/\1>/g, '');
      expect(visible.trim()).not.toBe('');
      if (CLIENT_FILLED.includes(nameOf(item))) return;
      expect(visible).toMatch(/>[^<\s][^<]*<|<(img|video|iframe|input)\b/);
    }
  );
});
