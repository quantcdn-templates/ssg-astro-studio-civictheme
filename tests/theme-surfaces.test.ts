import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The component reference stages paint a fixed dark background. A Studio
 * migration rewrites the brand colours, and its contrast gate checks the
 * dark link colour against every surface `_migration.theme.darkSurfaces`
 * declares. This test keeps that list in step with the stages.
 */
const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'quant.studio.json'), 'utf8')) as {
  _migration: { theme: { darkSurfaces?: string[] } };
};
const declared = (manifest._migration.theme.darkSurfaces ?? []).map((c) => c.toLowerCase());

describe('_migration.theme.darkSurfaces', () => {
  it.each(['src/components/ComponentDemoBlock.astro', 'src/layouts/ComponentPreview.astro'])(
    'declares the fixed dark stage background of %s',
    (file) => {
      const source = readFileSync(join(root, file), 'utf8');
      const fixed = [...source.matchAll(/\.ct-theme-dark\s*\{[^}]*background:\s*(#[0-9a-fA-F]{6})/g)].map((m) =>
        m[1].toLowerCase()
      );
      expect(fixed.length).toBeGreaterThan(0);
      for (const colour of fixed) expect(declared).toContain(colour);
    }
  );
});
