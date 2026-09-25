/**
 * Demo content awareness for tests (Task 17).
 *
 * A Studio migration deletes every file `quant.studio.json`'s
 * `_migration.demoContent` lists, and replaces `src/content/pages/index.mdx`
 * with the source site's own home page. A test that asserts something about
 * that demo content — a specific demo slug, a demo page's copy, a demo
 * form's target page — must skip once the content it asserts about is gone.
 * A test of generic behaviour (a library function, a build mechanic that
 * doesn't depend on which pages exist) must always run.
 *
 * Import `demoPresent`/`demoHomePresent` and guard with `it.skipIf`/
 * `test.skip(condition, …)` at the smallest unit that actually depends on
 * demo content — never delete the test, never weaken its assertion.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `import.meta.url`, not `__dirname`: Playwright runs specs as ES modules,
// where `__dirname` is undefined, unlike Vitest's CommonJS-shaped transform.
export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const manifest = JSON.parse(readFileSync(join(root, 'quant.studio.json'), 'utf8')) as {
  _migration: { demoContent: string[] };
};
const patterns = manifest._migration.demoContent;

/**
 * Expand one `_migration.demoContent` entry to the repo-relative paths it
 * names. Every entry is either a literal path or a single `dir/*.ext` glob
 * (the only shape `_migration.demoContent` uses), so this needs no glob
 * library — it just lists the directory when there's a `*` to expand.
 */
function expand(pattern: string): string[] {
  if (!pattern.includes('*')) return [pattern];
  const dir = dirname(pattern);
  const ext = pattern.slice(pattern.lastIndexOf('.'));
  const absDir = join(root, dir);
  if (!existsSync(absDir)) return [];
  return readdirSync(absDir)
    .filter((name) => name.endsWith(ext))
    .map((name) => `${dir}/${name}`);
}

const demoPaths = patterns.flatMap(expand);

/**
 * Is a given demo file present? `path` is repo-relative, e.g.
 * `'src/content/pages/contact-us.mdx'`. With no `path`, answers whether ANY
 * demo file (per `_migration.demoContent`) is still present, so a whole
 * demo-content-dependent suite can guard itself with one call.
 */
export function demoPresent(path?: string): boolean {
  if (path !== undefined) return existsSync(join(root, path));
  return demoPaths.some((demoPath) => existsSync(join(root, demoPath)));
}

/**
 * The frontmatter `title` CivicTheme's own demo home page ships with
 * (`src/content/pages/index.mdx`). Migration overwrites this file with the
 * source site's real home page, so this exact title marks the file as still
 * being the template's demo home, not a real one — it's implausible any
 * real site's home page happens to carry it.
 */
const DEMO_HOME_TITLE_MARKER = /^title:\s*Your organisation's tagline\s*$/m;

/** Is `src/content/pages/index.mdx` still CivicTheme's own demo home page? */
export function demoHomePresent(): boolean {
  const path = join(root, 'src/content/pages/index.mdx');
  if (!existsSync(path)) return false;
  return DEMO_HOME_TITLE_MARKER.test(readFileSync(path, 'utf8'));
}
