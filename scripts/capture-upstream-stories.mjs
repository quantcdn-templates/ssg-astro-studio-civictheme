/**
 * Capture upstream CivicTheme Storybook renders as parity fixtures.
 *
 * One-time capture. Writes, for every eligible upstream story:
 *   tests/story-parity/fixtures/args/<layer>/<name>/<Export>.json
 *   tests/story-parity/fixtures/html/<layer>/<name>/<Export>.html
 *   tests/story-parity/fixtures/png/<layer>/<name>/<Export>.png
 *
 * Usage: node scripts/capture-upstream-stories.mjs [--skip-build] [--skip-png] [--uikit <path>]
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};

const UIKIT = path.resolve(REPO, value('--uikit', process.env.UIKIT || '.upstream/uikit'));
const TWIG = path.join(UIKIT, 'packages/twig');
const STATIC_DIR = path.join(TWIG, 'storybook-static');
const FIXTURES = path.join(REPO, 'tests/story-parity/fixtures');
const PORT = Number(value('--port', '6099'));

/** Viewport width for PNG capture (height is the element's own height). */
const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 900;
/** Settle delay before screenshot, mirroring tools/visual-diff. */
const SETTLE_MS = 2000;
/** Mask selectors, copied from .upstream/uikit/tools/visual-diff/config/config.json. */
const MASK_SELECTORS = ['.ct-iframe', '.ct-map--canvas', '.ct-video-player', '.ct-video', 'video'];
/** 1x1 PNG used to replace every image, copied from tools/visual-diff/lib/screenshot.mjs. */
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt',
  '.txt': 'text/plain',
};

function run(command, args, cwd) {
  console.log(`> ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function buildUpstream() {
  if (!fs.existsSync(UIKIT)) {
    throw new Error(`Upstream checkout not found at ${UIKIT}`);
  }
  if (!fs.existsSync(path.join(UIKIT, 'node_modules'))) {
    run('npm', ['install'], UIKIT);
  }
  run('npm', ['run', 'dist', '--workspace=packages/twig'], UIKIT);
  run('npm', ['run', 'build-storybook', '--workspace=packages/twig'], UIKIT);
}

function startServer(root, port) {
  const server = http.createServer((request, response) => {
    let urlPath = decodeURIComponent(request.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    if (urlPath === '/iframe') urlPath = '/iframe.html';
    const file = path.join(root, urlPath);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    response.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, () => resolve(server));
  });
}

/**
 * Story selection.
 *
 * Skipped:
 *  - stories whose `component` is a `*.stories.twig` Storybook-only template
 *    (docs and utility demos: welcome, about, colors, fonts, typography,
 *    background, elevation, spacing, collapsible, flyout, responsive,
 *    scrollspy, back-to-top); shared-reference R1 says these are not ported.
 *  - stories that declare `render:` (composite demos that do not render one
 *    component with its args).
 */
function readIndex() {
  const index = JSON.parse(fs.readFileSync(path.join(STATIC_DIR, 'index.json'), 'utf8'));
  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => {
      const match = /^\.\/components\/([^/]+)\/([^/]+)\//.exec(entry.importPath);
      return {
        storyId: entry.id,
        title: entry.title,
        name: entry.name,
        exportName: entry.exportName,
        importPath: entry.importPath,
        componentPath: entry.componentPath,
        layer: match ? match[1] : 'unknown',
        component: match ? match[2] : 'unknown',
      };
    });
}

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

/**
 * One pass over every story to learn what the capture loop needs BEFORE it
 * navigates: whether the story declares `render:`, its Storybook `layout`
 * and background globals, and its `theme` arg. The args themselves are NOT
 * read here — see `capture()`.
 */
async function extractStoryData(page, storyIds) {
  return page.evaluate(async (ids) => {
    const store = window.__STORYBOOK_PREVIEW__.storyStore;
    const out = {};
    for (const id of ids) {
      const story = await store.loadStory({ storyId: id });
      out[id] = {
        theme: story.initialArgs?.theme ?? null,
        hasRender: Object.prototype.hasOwnProperty.call(story.moduleExport || {}, 'render'),
        layout: story.parameters?.layout ?? null,
        background: (story.storyGlobals ?? story.globals)?.backgrounds?.value ?? null,
      };
    }
    return out;
  }, storyIds);
}

async function prepareForScreenshot(page, selectors, pixel) {
  await page.evaluate(
    ({ maskSelectors, pixelImage }) => {
      const style = document.createElement('style');
      style.textContent =
        '*, *::before, *::after { transition: none !important; transition-duration: 0s !important; animation: none !important; }';
      document.head.appendChild(style);

      document.querySelectorAll(maskSelectors.join(', ')).forEach((element) => {
        element.style.visibility = 'hidden';
      });

      document.querySelectorAll('img').forEach((image) => {
        if (image.src && !image.src.startsWith('data:')) image.src = pixelImage;
      });
      document.querySelectorAll('.ct-footer, .ct-banner__inner, .ct-background').forEach((element) => {
        const background = window.getComputedStyle(element).backgroundImage;
        if (background && background !== 'none' && !background.includes('data:')) {
          element.style.backgroundImage = `url("${pixelImage}")`;
        }
      });
    },
    { maskSelectors: selectors, pixelImage: pixel }
  );
}

/**
 * Renders one story twice:
 *
 * - HTML comes from the story's OWN render function
 *   (`story.undecoratedStoryFn`), which returns the raw Twig output string
 *   without inserting it into the document. This is the template's real
 *   markup. Reading `#storybook-root.innerHTML` instead would capture the
 *   DOM *after* CivicTheme's behaviour scripts have run, and those scripts
 *   mutate it at init (`button.js` adds `data-button="true"`, `chip.js` adds
 *   `data-chip="true"`, `collapsible.js` rewrites the bare `data-collapsible`
 *   to `"true"` and adds `aria-expanded`, and `chip.event.stories.js` adds
 *   `story-processed="1"`). A static Astro render cannot and must not
 *   reproduce those.
 * - PNG comes from the mounted, fully-initialised story, because the visual
 *   comparison in the Astro template runs the same behaviours in the browser.
 */
async function capture(page, baseUrl, story, fixtureName, themeOverride, argsOverride, skipPng) {
  const query = argsOverride ? `&args=${encodeURIComponent(argsOverride)}` : '';
  await page.goto(`${baseUrl}/iframe.html?id=${story.storyId}&viewMode=story${query}`, {
    waitUntil: 'load',
  });
  await page.waitForFunction(
    () => {
      const root = document.querySelector('#storybook-root');
      return Boolean(root && root.childNodes.length);
    },
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);

  // The args are read from the SAME page load that renders the HTML. Several
  // `*.stories.data.js` modules generate ids with `random()` at module scope,
  // so every navigation produces a fresh set — reading the args once up front
  // and rendering later would pair an args fixture with HTML containing
  // different ids.
  //
  // The render uses the story's OWN `initialArgs`, not the serialised copy
  // written to the args fixture: a `DrupalAttribute` arg must reach the Twig
  // template as the live class instance it is, or the markup it contributes
  // (e.g. Tabs' `id="panel-1-tab"`) is lost from the fixture.
  const { html, args } = await page.evaluate(
    async ({ storyId, theme }) => {
      // A story arg may be a CLASS INSTANCE, not a plain object: upstream's
      // `tabs.stories.js` and `grid.stories.js` build `attributes` with
      // `new DrupalAttribute([...])`, which extends `Map`. `JSON.stringify`
      // serialises a Map as `{}`, silently dropping every attribute it holds,
      // so Map entries are unwrapped into a plain `{ name: value }` object.
      // `DrupalAttribute` is the only class instance upstream's stories are
      // known to pass; anything else falls through the plain-object branch.
      const toPlain = (value) => {
        if (value instanceof Map) {
          return Object.fromEntries([...value.entries()].map(([key, item]) => [String(key), toPlain(item)]));
        }
        if (Array.isArray(value)) return value.map(toPlain);
        if (value && typeof value === 'object') {
          return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPlain(item)]));
        }
        return value;
      };

      const loaded = await window.__STORYBOOK_PREVIEW__.storyStore.loadStory({ storyId });
      const storyArgs = theme ? { ...loaded.initialArgs, theme } : loaded.initialArgs;
      const context = {
        ...loaded,
        id: storyId,
        args: storyArgs,
        globals: {},
        viewMode: 'story',
        loaded: {},
        hooks: {},
        canvasElement: document.createElement('div'),
        abortSignal: new AbortController().signal,
      };
      const result = loaded.undecoratedStoryFn(context);
      if (typeof result !== 'string') throw new Error(`${storyId} did not render to a string`);
      return { html: result, args: toPlain(storyArgs) };
    },
    { storyId: story.storyId, theme: themeOverride }
  );

  const dir = path.join(story.layer, story.component);
  writeFile(path.join(FIXTURES, 'html', dir, `${fixtureName}.html`), html);

  if (skipPng) return args;
  await prepareForScreenshot(page, MASK_SELECTORS, PIXEL);
  await page.waitForTimeout(SETTLE_MS);
  await page.locator('#storybook-root').screenshot({
    path: path.join(FIXTURES, 'png', dir, `${fixtureName}.png`),
    animations: 'disabled',
    scale: 'css',
  });
  return args;
}

/**
 * Fraction of a story's fixture HTML that arrived PRE-RENDERED in its args.
 *
 * Upstream's `*.stories.data.js` files build args by calling other Twig
 * templates, so a story such as `organisms-list--list` feeds its component a
 * ready-made block of child markup. A parity pass on such a story proves the
 * WRAPPER matches, not the children. Measured as (bytes of every HTML-bearing
 * string arg, at any depth) / (bytes of the fixture HTML).
 */
function passthroughRatio(args, htmlFile) {
  let bytes = 0;
  const walk = (value) => {
    if (typeof value === 'string') {
      if (value.includes('<')) bytes += value.length;
      return;
    }
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(args);
  const html = fs.readFileSync(htmlFile, 'utf8').replace(/\s+/g, ' ').trim();
  return html.length === 0 ? 0 : Math.min(1, bytes / html.length);
}

/** Astro components under `src/civictheme/components` that no captured story covers. */
function componentsWithoutFixtures(captured) {
  const covered = new Set(
    captured.map(({ component }) => {
      const name = component.split('/')[1];
      return name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    })
  );
  const root = path.join(REPO, 'src/civictheme/components');
  const names = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((layer) =>
      fs
        .readdirSync(path.join(root, layer.name))
        .filter((file) => file.endsWith('.astro'))
        .map((file) => `${layer.name}/${file.replace(/\.astro$/, '')}`)
    );
  return names.filter((name) => !covered.has(name.split('/')[1])).sort();
}

async function main() {
  const skipPng = flag('--skip-png');
  if (!flag('--skip-build')) buildUpstream();
  if (!fs.existsSync(path.join(STATIC_DIR, 'index.json'))) {
    throw new Error(`No Storybook build at ${STATIC_DIR}. Run without --skip-build.`);
  }

  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: UIKIT }).toString().trim();
  const allStories = readIndex();
  const server = await startServer(STATIC_DIR, PORT);
  const baseUrl = `http://localhost:${PORT}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });

  try {
    await page.goto(`${baseUrl}/iframe.html?id=${allStories[0].storyId}&viewMode=story`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean(window.__STORYBOOK_PREVIEW__?.storyStore), undefined, { timeout: 30000 });
    const data = await extractStoryData(
      page,
      allStories.map((story) => story.storyId)
    );

    const skipped = [];
    const stories = allStories.filter((story) => {
      if (story.componentPath && story.componentPath.endsWith('.stories.twig')) {
        skipped.push({ storyId: story.storyId, reason: 'storybook-only template (*.stories.twig)' });
        return false;
      }
      if (data[story.storyId].hasRender) {
        skipped.push({ storyId: story.storyId, reason: 'story declares render:' });
        return false;
      }
      return true;
    });

    // A story gets an extra dark capture only when its own theme is light and
    // no sibling story of the same title already renders in the dark theme.
    const darkTitles = new Set(
      stories.filter((story) => data[story.storyId].theme === 'dark').map((story) => story.title)
    );

    fs.rmSync(path.join(FIXTURES, 'args'), { recursive: true, force: true });
    fs.rmSync(path.join(FIXTURES, 'html'), { recursive: true, force: true });
    if (!skipPng) fs.rmSync(path.join(FIXTURES, 'png'), { recursive: true, force: true });

    let light = 0;
    let dark = 0;
    const captured = [];
    for (const story of stories) {
      const entry = data[story.storyId];
      const variants = [{ suffix: '', theme: entry.theme, override: null }];
      if (entry.theme === 'light' && !darkTitles.has(story.title)) {
        variants.push({ suffix: '--dark', theme: 'dark', override: 'theme:dark' });
      }

      for (const variant of variants) {
        const fixtureName = `${story.exportName}${variant.suffix}`;
        const args = await capture(
          page,
          baseUrl,
          story,
          fixtureName,
          variant.override ? 'dark' : null,
          variant.override,
          skipPng
        );
        writeFile(
          path.join(FIXTURES, 'args', story.layer, story.component, `${fixtureName}.json`),
          `${JSON.stringify(
            {
              storyId: story.storyId,
              title: story.title,
              name: story.name,
              exportName: story.exportName,
              component: `${story.layer}/${story.component}`,
              importPath: story.importPath,
              theme: variant.theme ?? null,
              layout: entry.layout,
              background: entry.background,
              argsOverride: variant.override,
              args,
            },
            null,
            2
          )}\n`
        );
        captured.push({ component: `${story.layer}/${story.component}`, fixtureName, args });
        if (variant.suffix) dark += 1;
        else light += 1;
        console.log(`captured ${story.layer}/${story.component}/${fixtureName}`);
      }
    }

    const wrapperOnly = captured
      .map((item) => ({
        fixtureName: `${item.component}/${item.fixtureName}`,
        ratio: passthroughRatio(item.args, path.join(FIXTURES, 'html', item.component, `${item.fixtureName}.html`)),
      }))
      .filter((item) => item.ratio > 0.5)
      .sort((a, b) => b.ratio - a.ratio);

    // UTC, so the recorded date does not depend on the capturing machine's zone.
    const captureDate = new Date().toISOString().slice(0, 10);

    writeFile(
      path.join(FIXTURES, 'SOURCE.md'),
      [
        '# Upstream story fixtures',
        '',
        'Generated by `node scripts/capture-upstream-stories.mjs`. Do not edit by hand.',
        '',
        `- Upstream: https://github.com/civictheme/uikit \`packages/twig\`, commit \`${commit}\``,
        `- Captured: ${captureDate}`,
        `- Storybook: \`npm run build-storybook --workspace=packages/twig\` (static build), served over HTTP`,
        '- Args: read at runtime from the Storybook preview store',
        '  (`window.__STORYBOOK_PREVIEW__.storyStore.loadStory({ storyId }).initialArgs`).',
        '  This gives the exact args the story rendered with, including nested HTML',
        '  strings that `*.stories.data.js` produces by calling other Twig templates.',
        '- Class-instance args are serialised to plain objects before being written:',
        '  a `Map` (which is what `@civictheme/drupal-attribute` extends) becomes',
        '  `{ name: value }`, because `JSON.stringify` would flatten it to `{}` and lose',
        '  every attribute. Verified only for `DrupalAttribute`, the one class upstream',
        '  stories are known to pass (`tabs.stories.js`, `grid.stories.js`). The HTML',
        '  fixture is still rendered from the ORIGINAL, unserialised args.',
        '',
        `- Stories in Storybook index: ${allStories.length}`,
        `- Captured stories (as upstream defines them): ${light}`,
        `- Extra dark-theme captures (\`--dark\`, via \`&args=theme:dark\`): ${dark}`,
        `- Total fixtures: ${light + dark}`,
        '',
        '## Skipped stories',
        '',
        ...skipped.map((item) => `- \`${item.storyId}\` — ${item.reason}`),
        '',
        '## Ported components with no story fixture',
        '',
        'These have an Astro component but no story in this fixture set, so the story',
        'suite proves nothing about them. Their `tests/parity/` snapshot cases still do.',
        '',
        ...componentsWithoutFixtures(captured).map((name) => `- \`${name}\``),
        '',
        '## Wrapper-only stories',
        '',
        'For these, more than half the fixture HTML arrives PRE-RENDERED in the args:',
        "upstream's `*.stories.data.js` calls other Twig templates and passes the",
        'resulting markup in as a string prop. A pass here proves the wrapper markup',
        'matches, not the children — the children are covered by their own stories and',
        'by the 697 `tests/parity/` snapshot cases.',
        '',
        ...(wrapperOnly.length
          ? wrapperOnly.map((item) => `- \`${item.fixtureName}\` — ${Math.round(item.ratio * 100)}% passthrough`)
          : ['- (none)']),
        '',
        '## Capture options',
        '',
        `- Viewport: ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}, device scale 1 (CSS pixels).`,
        "  1024 wide instead of upstream's 1280 to keep the committed PNG set small.",
        '- PNG is an element screenshot of `#storybook-root` (full element height).',
        `- Mirrors \`tools/visual-diff\`: CSS transitions disabled, ${MASK_SELECTORS.join(', ')} hidden,`,
        `  every image replaced with a 1x1 PNG, ${SETTLE_MS} ms settle delay.`,
        "- HTML is the story render function's own raw output (`story.undecoratedStoryFn`),",
        "  i.e. the Twig template markup BEFORE CivicTheme's behaviour scripts mutate the DOM.",
        '',
      ].join('\n')
    );

    console.log(`\n${light} story fixtures, ${dark} extra dark fixtures, ${skipped.length} skipped.`);
  } finally {
    await browser.close();
    server.close();
  }
}

await main();
