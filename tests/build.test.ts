import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
function builtCss(): string {
  const dir = join(root, 'dist/_astro');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
}

describe('astro build', () => {
  beforeAll(() => {
    execSync('npm run build', { cwd: root, stdio: 'pipe' });
  }, 300_000);
  it('emits the CivicTheme stylesheet', () => {
    const css = builtCss();
    expect(css).toContain('.ct-button');
    expect(css).toMatch(/--ct-color-light-brand1:\s*#00698f/);
  });
  it('emits index.html', () => {
    expect(existsSync(join(root, 'dist/index.html'))).toBe(true);
  });
});
