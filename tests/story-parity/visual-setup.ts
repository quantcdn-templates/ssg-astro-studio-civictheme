/**
 * Prepares a visual run: copies the vendored Storybook shell stylesheets into
 * the built site so the `/story-parity/**` pages can link them, and clears the
 * previous run's pixel results.
 *
 * They are deliberately NOT imported by the route: an import would emit them
 * into `dist/_astro/` on every normal build, and these are test fixtures, not
 * site assets.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export default function globalSetup() {
  const from = join(process.cwd(), 'tests/story-parity/fixtures/shell');
  const to = join(process.cwd(), 'dist-story-parity/story-parity-shell');
  if (!existsSync(join(process.cwd(), 'dist-story-parity/story-parity'))) {
    throw new Error(
      'dist/story-parity is missing — build with PUBLIC_STORY_PARITY=1 --outDir dist-story-parity first (npm run test:story-parity:visual).'
    );
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });

  // Clear last run's per-story pixel results. Without this, a story that has
  // since been removed — or a run that covered fewer stories — would leave a
  // stale file behind for `scripts/story-parity-report.mjs` to report as if it
  // were current.
  rmSync(join(process.cwd(), '.story-parity-results'), { recursive: true, force: true });
}
