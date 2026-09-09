/**
 * Asserts `src/data/component-demos/` (what `src/lib/component-demos.ts`
 * reads at build time) is in sync with `tests/story-parity/fixtures/args/`
 * (what `scripts/sync-component-demos.mjs` copies from) — same file set,
 * same content. A drift here (fixtures re-captured without re-running
 * `npm run demos:sync`) would silently serve stale demo data to the
 * `/components/*` reference pages, so it fails CI instead.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(__dirname, '..');
const fixturesDir = join(root, 'tests/story-parity/fixtures/args');
const demosDir = join(root, 'src/data/component-demos');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe('src/data/component-demos sync (Task 17 fix)', () => {
  it('has the same set of fixture files as tests/story-parity/fixtures/args', () => {
    const fixtureFiles = walk(fixturesDir)
      .filter((p) => p.endsWith('.json'))
      .map((p) => relative(fixturesDir, p))
      .sort();
    const demoFiles = walk(demosDir)
      .filter((p) => p.endsWith('.json'))
      .map((p) => relative(demosDir, p))
      .sort();
    expect(demoFiles).toEqual(fixtureFiles);
  });

  it('has byte-identical content to tests/story-parity/fixtures/args for every fixture', () => {
    const fixtureFiles = walk(fixturesDir)
      .filter((p) => p.endsWith('.json'))
      .map((p) => relative(fixturesDir, p));

    const mismatched = fixtureFiles.filter((rel) => {
      const fixtureContent = readFileSync(join(fixturesDir, rel), 'utf8');
      const demoContent = readFileSync(join(demosDir, rel), 'utf8');
      return fixtureContent !== demoContent;
    });

    expect(mismatched).toEqual([]);
  });
});
