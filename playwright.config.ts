import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    // ASTRO_PREVIEW_BACKGROUND: `astro preview` auto-detaches into a background daemon
    // when it detects it is being run by an AI agent, which exits the launching process
    // immediately and makes Playwright report "Process from config.webServer exited
    // early". This forces it to stay in the foreground, as Playwright's webServer needs.
    command: 'npm run preview -- --port 4321',
    port: 4321,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
  },
  use: { baseURL: 'http://localhost:4321' },
});
