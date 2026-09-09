/**
 * Visual story parity: screenshots each `/story-parity/**` page's `#story-root`
 * and compares it, pixel for pixel, with the upstream Storybook screenshot in
 * `fixtures/png/**`.
 *
 * The page reproduces Storybook's own preview shell (`sb-show-main` +
 * `sb-main-<layout>`, see `fixtures/shell/storybook-shell.css`), and this spec
 * applies exactly the same pre-screenshot treatment the capture applied —
 * transitions off, mask selectors hidden, every image replaced with a 1x1 PNG,
 * a settle delay — so a difference here is a real rendering difference.
 *
 * Failures write `<name>.actual.png`, `.expected.png` and `.diff.png` under
 * `test-results/story-parity/`.
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Playwright runs this through Node's ESM loader, which requires an import
// attribute for JSON; `readFileSync` keeps it working under both loaders.
const accepted = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/story-parity/accepted-visual-differences.json'), 'utf8')
) as AcceptedVisualDifference[];

interface AcceptedVisualDifference {
  story: string;
  reason: string;
  maxDelta: number;
}

const FIXTURES = join(process.cwd(), 'tests/story-parity/fixtures');
const OUT = join(process.cwd(), 'test-results/story-parity');
/**
 * Per-story pixel deltas for `scripts/story-parity-report.mjs`. Deliberately
 * NOT under `test-results/`: Playwright wipes its `outputDir` at the start of
 * every run, including the e2e config's, so results written there do not
 * survive another suite running afterwards.
 */
const RESULTS = join(process.cwd(), '.story-parity-results');

/** Same options as `scripts/capture-upstream-stories.mjs`. */
const MASK_SELECTORS = ['.ct-iframe', '.ct-map--canvas', '.ct-video-player', '.ct-video', 'video'];
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const SETTLE_MS = 2000;
/** 1x1 fully transparent PNG — see the zero-area branch below. */
const EMPTY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4AWMAAQAABQABNtCI3QAAAABJRU5ErkJggg==',
  'base64'
);

/** Fraction of differing pixels allowed before a story is reported as failing. */
const TOLERANCE = 0.001;
/** pixelmatch per-pixel colour distance; upstream's visual-diff uses the default. */
const PIXEL_THRESHOLD = 0.1;

const acceptedByStory = new Map<string, AcceptedVisualDifference>(accepted.map((entry) => [entry.story, entry]));

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)]
  );
}

const stories = listFiles(join(FIXTURES, 'args'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => relative(join(FIXTURES, 'args'), file).replace(/\.json$/, ''))
  // `build.format: 'file'` writes `<name>.html`, not `<name>/index.html`.
  // A story with no ported component (04-templates/page) has no page at all.
  .filter((name) => existsSync(join(process.cwd(), 'dist-story-parity/story-parity', `${name}.html`)))
  .sort();

test.describe.configure({ mode: 'parallel' });

test('every built story page has a PNG fixture', () => {
  for (const name of stories) {
    expect(existsSync(join(FIXTURES, 'png', `${name}.png`)), `missing PNG fixture for ${name}`).toBe(true);
  }
  expect(stories.length).toBeGreaterThan(0);
});

for (const name of stories) {
  test(name, async ({ page }) => {
    await page.goto(`/story-parity/${name}`, { waitUntil: 'load' });
    // `attached`, not the default `visible`: `skip-link` renders visually hidden.
    await page.waitForSelector('#story-root > *', { state: 'attached' });

    await page.evaluate(
      ({ maskSelectors, pixelImage }) => {
        const style = document.createElement('style');
        style.textContent =
          '*, *::before, *::after { transition: none !important; transition-duration: 0s !important; animation: none !important; }';
        document.head.appendChild(style);

        document.querySelectorAll<HTMLElement>(maskSelectors.join(', ')).forEach((element) => {
          element.style.visibility = 'hidden';
        });
        document.querySelectorAll('img').forEach((image) => {
          if (image.src && !image.src.startsWith('data:')) image.src = pixelImage;
        });
        // A <video> is hidden by the mask, but its BOX still comes from the
        // intrinsic size of its poster. Storybook served the demo poster at
        // `/demo/videos/`, relative to `/iframe.html`; here the same relative
        // URL would resolve under `/story-parity/<layer>/<name>/`. Point it at
        // the vendored copy so the element sizes the same on both sides.
        document.querySelectorAll<HTMLVideoElement>('video[poster]').forEach((video) => {
          const poster = video.getAttribute('poster') ?? '';
          if (!poster.startsWith('/') && !poster.startsWith('data:')) {
            video.setAttribute('poster', `/story-parity-shell/${poster}`);
          }
        });
        document.querySelectorAll<HTMLElement>('.ct-footer, .ct-banner__inner, .ct-background').forEach((element) => {
          const background = window.getComputedStyle(element).backgroundImage;
          if (background && background !== 'none' && !background.includes('data:')) {
            element.style.backgroundImage = `url("${pixelImage}")`;
          }
        });
      },
      { maskSelectors: MASK_SELECTORS, pixelImage: PIXEL }
    );
    await page.waitForTimeout(SETTLE_MS);

    // Playwright cannot screenshot a zero-area element (`skip-link` renders
    // entirely `ct-visually-hidden`); the capture writes a 1x1 transparent PNG
    // in that case, so this side does the same.
    const box = await page.locator('#story-root').boundingBox();
    const shot =
      !box || box.width < 1 || box.height < 1
        ? EMPTY_PNG
        : await page.locator('#story-root').screenshot({ animations: 'disabled', scale: 'css' });

    const actual = PNG.sync.read(shot);
    const expectedPng = PNG.sync.read(readFileSync(join(FIXTURES, 'png', `${name}.png`)));
    const difference = acceptedByStory.get(name);

    const width = Math.max(actual.width, expectedPng.width);
    const height = Math.max(actual.height, expectedPng.height);
    const pad = (png: PNG) => {
      if (png.width === width && png.height === height) return png;
      const padded = new PNG({ width, height });
      PNG.bitblt(png, padded, 0, 0, png.width, png.height, 0, 0);
      return padded;
    };
    const a = pad(actual);
    const b = pad(expectedPng);
    const diff = new PNG({ width, height });
    const differing = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: PIXEL_THRESHOLD });
    // Size mismatch alone is a real difference: the padded region counts.
    const delta = differing / (width * height);

    const limit = difference ? difference.maxDelta : TOLERANCE;

    // One file per story (workers run in parallel, so nothing is appended to
    // a shared file). `scripts/story-parity-report.mjs` reads these to fill in
    // PARITY.md's pixel-delta column.
    const deltaFile = join(RESULTS, `${name.replace(/\//g, '__')}.json`);
    mkdirSync(dirname(deltaFile), { recursive: true });
    writeFileSync(
      deltaFile,
      `${JSON.stringify({
        story: name,
        delta,
        limit,
        width,
        height,
        renderSize: `${actual.width}x${actual.height}`,
        fixtureSize: `${expectedPng.width}x${expectedPng.height}`,
        accepted: difference?.reason ?? null,
      })}\n`
    );

    if (delta > limit) {
      const base = join(OUT, name);
      mkdirSync(dirname(base), { recursive: true });
      writeFileSync(`${base}.actual.png`, PNG.sync.write(a));
      writeFileSync(`${base}.expected.png`, PNG.sync.write(b));
      writeFileSync(`${base}.diff.png`, PNG.sync.write(diff));
    }
    expect(
      delta,
      `${name}: ${(delta * 100).toFixed(3)}% of pixels differ (limit ${(limit * 100).toFixed(3)}%; ` +
        `render ${actual.width}x${actual.height}, fixture ${expectedPng.width}x${expectedPng.height})` +
        (difference ? ` — accepted: ${difference.reason}` : '')
    ).toBeLessThanOrEqual(limit);
  });
}
