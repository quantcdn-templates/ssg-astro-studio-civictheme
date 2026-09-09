/**
 * Copies the vendored Storybook shell stylesheets into the built site so the
 * `/story-parity/**` pages can link them.
 *
 * They are deliberately NOT imported by the route: an import would emit them
 * into `dist/_astro/` on every normal build, and these are test fixtures, not
 * site assets.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
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
}
