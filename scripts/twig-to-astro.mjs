import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ALIAS = {
  base: '@civictheme/base',
  atoms: '@civictheme/atoms',
  molecules: '@civictheme/molecules',
  organisms: '@civictheme/organisms',
};
export const pascal = (s) =>
  s
    .split(/[-_]/)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
export const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

function tsType(twigType, name) {
  const parts = twigType.split(',').map((t) => t.trim());
  const nullable = parts.includes('null');
  const base = parts.find((t) => t !== 'null') ?? 'string';
  const map = {
    string: name === 'theme' ? "'light' | 'dark'" : 'string',
    boolean: 'boolean',
    number: 'number',
    integer: 'number',
    array: 'unknown[]',
    object: 'Record<string, unknown>',
  };
  return (map[base] ?? 'unknown') + (nullable ? ' | null' : '');
}

/** Parse "Props:" block of the doc header into [{name, type, children}] (one level of nesting for arrays/objects). */
export function parseProps(twig) {
  const header = twig.match(/\{#[\s\S]*?#\}/)?.[0] ?? '';
  const lines = header.split('\n').map((l) => l.replace(/^\s*\*\s?/, ''));
  const start = lines.findIndex((l) => /^Props:/.test(l));
  const end = lines.findIndex((l, i) => i > start && /^(Slots|Blocks):/.test(l));
  const body = lines.slice(start + 1, end === -1 ? undefined : end);
  const props = [];
  for (const l of body) {
    const top = l.match(/^- (\w+): \[([^\]]+)\]/);
    const child = l.match(/^\s{2,}- (\w+): \[([^\]]+)\]/);
    if (top) props.push({ name: top[1], type: top[2], children: [] });
    else if (child && props.length) props.at(-1).children.push({ name: child[1], type: child[2] });
  }
  return props.filter((p) => p.name !== 'attributes');
}

export function generateSkeleton(twig, layerName) {
  const [layer, name] = layerName.split('/');
  const props = parseProps(twig);
  const iface = props.map((p) => {
    if (p.name === 'modifier_class') return '  class?: string;';
    if (p.children.length) {
      const inner = p.children.map((c) => `${camel(c.name)}?: ${tsType(c.type, c.name)}`).join('; ');
      return `  ${camel(p.name)}?: ${p.type.startsWith('array') ? `Array<{ ${inner} }>` : `{ ${inner} }`};`;
    }
    return `  ${camel(p.name)}?: ${tsType(p.type, p.name)};`;
  });
  const includes = [...twig.matchAll(/@(base|atoms|molecules|organisms)\/([\w-]+)\/[\w-]+\.twig/g)];
  const imports = [
    ...new Set(includes.map((m) => `import ${pascal(m[2])} from '${ALIAS[m[1]]}/${pascal(m[2])}.astro';`)),
  ].sort();
  const destructure = props
    .map((p) =>
      p.name === 'modifier_class' ? "class: className = ''" : p.name === 'theme' ? "theme = 'light'" : camel(p.name)
    )
    .join(', ');
  const body = twig.replace(/\{#[\s\S]*?#\}\s*/, '');
  return `---\n${imports.join('\n')}${imports.length ? '\n\n' : ''}interface Props {\n${iface.join('\n')}\n  [key: string]: unknown;\n}\nconst { ${destructure}, ...rest } = Astro.props;\n---\n<!-- TWIG:\n${body.trim()}\n-->\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [layerName, flag] = process.argv.slice(2);
  if (!layerName) {
    console.error('usage: twig-to-astro.mjs <layer>/<name> [--force]');
    process.exit(1);
  }
  const [layer, name] = layerName.split('/');
  const root = join(dirname(new URL(import.meta.url).pathname), '..');
  const src = join(root, '.upstream/uikit/packages/twig/components', layer, name, `${name}.twig`);
  const dest = join(root, 'src/civictheme/components', layer, `${pascal(name)}.astro`);
  if (existsSync(dest) && flag !== '--force') {
    console.error(`refusing to overwrite ${dest} (use --force)`);
    process.exit(2);
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, generateSkeleton(readFileSync(src, 'utf8'), layerName));
  console.log('wrote', dest);
}
