// Usage: node scripts/sync-component-demos.mjs
//
// Copies the captured upstream Storybook story fixtures
// (`tests/story-parity/fixtures/args/**/*.json`) into `src/data/component-demos/`,
// mirroring the same `<layer>/<name>/<Story>.json` layout. The `/components/*`
// reference pages (Task 17) read from the `src/data/` copy, not from `tests/`
// directly: the Quant Studio runtime mounts the project file tree by extension
// allowlist but must not depend on `tests/`, so the fixtures a build-time page
// needs have to live under `src/`.
//
// Run this after `tests/story-parity/fixtures/args/**` changes (re-capturing
// upstream stories, editing a fixture by hand); `tests/component-demos.test.ts`
// asserts the two trees stay in sync so drift fails CI rather than silently
// serving stale demo data.
import { readdirSync, statSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const src = join(root, 'tests/story-parity/fixtures/args');
const dest = join(root, 'src/data/component-demos');

if (!existsSync(src)) {
  console.error(`error: ${src} not found`);
  process.exit(1);
}

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(src).filter((p) => p.endsWith('.json'));

rmSync(dest, { recursive: true, force: true });
for (const f of files) {
  const target = join(dest, relative(src, f));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(f, target);
}

console.log(`synced ${files.length} component demo fixtures from ${relative(root, src)} to ${relative(root, dest)}`);
