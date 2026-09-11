/**
 * quant.studio.json carries Studio component-editor hints (`_components.props`,
 * `_components.icons`, per-item `props`). Every hint must be one Studio
 * understands, and every per-item hint must name a real prop of that
 * component, or the editor silently ignores it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const raw = readFileSync(join(root, 'quant.studio.json'), 'utf8');
const manifest = JSON.parse(raw);
const HINT_KEYS = ['label', 'help', 'widget', 'options', 'group'];
const WIDGETS = ['image', 'link', 'icon', 'markdown', 'textarea', 'json', 'hidden'];
const TEXTAREA_PROPS = ['summary', 'content', 'contentTop', 'contentMiddle', 'contentBottom', 'imageOver'];

type Hint = Record<string, unknown>;

function expectValidHint(hint: Hint, where: string) {
  for (const [key, value] of Object.entries(hint)) {
    expect(HINT_KEYS, `${where}: unknown hint key ${key}`).toContain(key);
    if (key === 'widget') expect(WIDGETS, `${where}.widget`).toContain(value);
    if (key === 'group') expect(value, `${where}.group`).toBe('advanced');
    if (key === 'options') expect(Array.isArray(value) && value.length > 0, `${where}.options`).toBe(true);
  }
}

function propsInterface(path: string): string {
  const source = readFileSync(join(root, path), 'utf8');
  const match = /interface Props\s*\{([\s\S]*?)\n\}/.exec(source);
  expect(match, `${path}: interface Props`).not.toBeNull();
  return match![1];
}

describe('quant.studio.json component-editor hints', () => {
  it('keeps the JSON.stringify(…, 2) formatting Studio writes', () => {
    expect(raw).toBe(JSON.stringify(manifest, null, 2) + '\n');
  });

  it('gives icon props the icon grid, from the vendored icon module', () => {
    expect(manifest._components.props.icon).toEqual({ widget: 'icon' });
    const source = manifest._components.icons.source;
    expect(existsSync(join(root, source))).toBe(true);
    expect(readFileSync(join(root, source), 'utf8')).toMatch(/export const icons = \{/);
  });

  it('gives the HTML and plain-text string props a plain textarea, not the Markdown editor', () => {
    const textareas = Object.entries(manifest._components.props as Record<string, Hint>)
      .filter(([, hint]) => hint.widget === 'textarea')
      .map(([name]) => name);
    expect(textareas).toEqual(TEXTAREA_PROPS);
    const components = join(root, 'src/civictheme/components');
    const sources = ['00-base', '01-atoms', '02-molecules', '03-organisms'].flatMap((dir) =>
      readdirSync(join(components, dir))
        .filter((f) => f.endsWith('.astro'))
        .map((f) => readFileSync(join(components, dir, f), 'utf8'))
    );
    for (const name of TEXTAREA_PROPS) {
      const rendered = sources.some(
        (src) =>
          new RegExp(`\\n\\s*${name}\\?: string`).test(src) &&
          new RegExp(`set:html=\\{${name}\\}|\\{${name}\\}|=\\{${name}\\}`).test(src)
      );
      expect(rendered, `${name}: a string prop some component renders as HTML or text`).toBe(true);
    }
  });

  it('uses only hint keys and values Studio understands', () => {
    for (const [prop, hint] of Object.entries(manifest._components.props as Record<string, Hint>)) {
      expectValidHint(hint, `_components.props.${prop}`);
    }
    for (const item of manifest._components.items as Array<{ path: string; props?: Record<string, Hint> }>) {
      for (const [prop, hint] of Object.entries(item.props ?? {})) expectValidHint(hint, `${item.path}.props.${prop}`);
    }
  });

  it('names real props in every per-item hint', () => {
    const items = (manifest._components.items as Array<{ path: string; props?: Record<string, Hint> }>).filter(
      (i) => i.props
    );
    expect(items.map((i) => i.path.split('/').pop())).toEqual(['NavigationCard.astro', 'Grid.astro', 'Button.astro']);
    for (const item of items) {
      const props = propsInterface(item.path);
      for (const name of Object.keys(item.props!)) {
        expect(props, `${item.path}: prop ${name}`).toMatch(new RegExp(`\\n\\s*${name}\\??:`));
      }
    }
  });
});
