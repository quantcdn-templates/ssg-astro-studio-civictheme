import { defineConfig } from '@playwright/test';

/**
 * Visual story parity. Separate from `playwright.config.ts` because it needs
 * a site built with `PUBLIC_STORY_PARITY=1` (which emits the
 * `/story-parity/**` render route) and its own preview port, so it can never
 * be confused with the e2e run.
 *
 * Run it with `npm run test:story-parity:visual`, which does the build first.
 */
export default defineConfig({
  testDir: 'tests/story-parity',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/story-parity/visual-setup.ts',
  outputDir: 'test-results/story-parity',
  reporter: [['list']],
  webServer: {
    // Serves `dist-story-parity/`, not `dist/`: any other `npm run build` in
    // the repo rewrites `dist/` and would delete the story pages mid-run.
    command: 'node tests/story-parity/serve.mjs 4322 dist-story-parity',
    port: 4322,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4322',
    viewport: { width: 1024, height: 900 },
    deviceScaleFactor: 1,
  },
});
