/**
 * Writes `PARITY.md`: one row per captured upstream Storybook story, with its
 * HTML-parity result, whether it is a wrapper-only story, its pixel delta, and
 * the reason for any accepted difference.
 *
 * Usage: node scripts/story-parity-report.mjs [--skip-vitest]
 *
 * HTML results come from a `vitest run tests/story-parity` JSON report (run
 * here unless `--skip-vitest` is given). Pixel deltas come from the per-story
 * files `tests/story-parity/visual.spec.ts` writes into
 * `.story-parity-results/`; if the visual suite has not been run, that column
 * reads "not run" and the summary says so.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(REPO, 'tests/story-parity/fixtures');
const RESULTS = path.join(REPO, '.story-parity-results');
const VITEST_REPORT = path.join(RESULTS, 'html-results.json');

function listFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
}

/** The `## Wrapper-only stories` list in `fixtures/SOURCE.md`. */
function readWrapperOnly(source) {
  const section = /## Wrapper-only stories\n([\s\S]*?)\n## /.exec(source);
  if (!section) return new Map();
  return new Map(
    [...section[1].matchAll(/- `([^`]+)` — (\d+)% passthrough/g)].map((match) => [match[1], Number(match[2])])
  );
}

function runVitest() {
  fs.mkdirSync(RESULTS, { recursive: true });
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/story-parity', '--reporter=json', `--outputFile=${VITEST_REPORT}`], {
      cwd: REPO,
      stdio: 'pipe',
    });
  } catch {
    // A failing story is a legitimate report outcome, not a script error.
  }
}

/**
 * Maps `<layer>/<name>/<Export>` → 'exact' | 'accepted' | 'FAIL'.
 *
 * The suite names each case `<Export>[--dark] (<storyId>)` inside a
 * `<layer>/<name>` describe block, and an accepted no-component case
 * `<Export> … — SKIPPED: <reason>` — so the first whitespace-delimited token
 * of the title is always the fixture's file stem.
 */
function readHtmlResults(acceptedByStory) {
  if (!fs.existsSync(VITEST_REPORT)) return new Map();
  const report = JSON.parse(fs.readFileSync(VITEST_REPORT, 'utf8'));
  const results = new Map();
  for (const file of report.testResults ?? []) {
    for (const assertion of file.assertionResults ?? []) {
      const component = assertion.ancestorTitles?.[0];
      if (!component || !component.includes('/')) continue;
      const key = `${component}/${assertion.title.split(' ')[0]}`;
      if (assertion.status === 'failed') results.set(key, 'FAIL');
      else results.set(key, acceptedByStory.has(key) ? 'accepted' : 'exact');
    }
  }
  return results;
}

function readDeltas() {
  if (!fs.existsSync(RESULTS)) return new Map();
  return new Map(
    fs
      .readdirSync(RESULTS)
      .filter((file) => file.endsWith('.json') && file !== path.basename(VITEST_REPORT))
      .map((file) => {
        const entry = JSON.parse(fs.readFileSync(path.join(RESULTS, file), 'utf8'));
        return [entry.story, entry];
      })
  );
}

const accepted = JSON.parse(fs.readFileSync(path.join(REPO, 'tests/story-parity/accepted-differences.json'), 'utf8'));
const acceptedByStory = new Map(accepted.map((entry) => [entry.story, entry]));
const acceptedVisual = JSON.parse(
  fs.readFileSync(path.join(REPO, 'tests/story-parity/accepted-visual-differences.json'), 'utf8')
);
const acceptedVisualByStory = new Map(acceptedVisual.map((entry) => [entry.story, entry]));

const source = fs.readFileSync(path.join(FIXTURES, 'SOURCE.md'), 'utf8');
const wrapperOnly = readWrapperOnly(source);
const commit = /commit `([0-9a-f]+)`/.exec(source)?.[1] ?? 'unknown';

if (!process.argv.includes('--skip-vitest')) runVitest();
const htmlResults = readHtmlResults(acceptedByStory);
const deltas = readDeltas();

const stories = listFiles(path.join(FIXTURES, 'args'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const name = path.relative(path.join(FIXTURES, 'args'), file).replace(/\.json$/, '');
    return { name, data };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const rows = stories.map(({ name, data }) => {
  const delta = deltas.get(name);
  const reason = acceptedByStory.get(name)?.reason ?? acceptedVisualByStory.get(name)?.reason ?? '';
  return {
    name,
    component: data.component,
    story: data.exportName + (name.endsWith('--dark') ? '--dark' : ''),
    theme: data.theme ?? '—',
    html: htmlResults.get(name) ?? 'not run',
    wrapper: wrapperOnly.has(name) ? `${wrapperOnly.get(name)}%` : '—',
    pixels: delta ? `${(delta.delta * 100).toFixed(3)}%` : 'not compared',
    visual: delta ? (delta.delta <= delta.limit ? 'within' : 'FAIL') : '—',
    reason: reason.replace(/\s+/g, ' '),
  };
});

const count = (field, value) => rows.filter((row) => row[field] === value).length;
const exact = count('html', 'exact');
const acceptedCount = count('html', 'accepted');
const failed = count('html', 'FAIL');
const wrapperCount = rows.filter((row) => row.wrapper !== '—').length;
const within = count('visual', 'within');
const visualFailed = count('visual', 'FAIL');
const notCompared = count('visual', '—');
const visualAccepted = rows.filter((row) => acceptedVisualByStory.has(row.name)).length;

const escape = (value) => value.replace(/\|/g, '\\|');

const lines = [
  '# Parity with upstream',
  '',
  'Generated by `node scripts/story-parity-report.mjs`. Do not edit by hand.',
  '',
  `Oracle: the CivicTheme UI Kit Storybook at commit \`${commit}\`, captured by`,
  '`scripts/capture-upstream-stories.mjs` into `tests/story-parity/fixtures/`',
  '(see `fixtures/SOURCE.md` for what was captured, what was skipped, and why).',
  '',
  '## Summary',
  '',
  `**${rows.length} stories, ${exact} exact HTML matches, ${acceptedCount} accepted differences, ` +
    `${within} visually within tolerance` +
    (visualAccepted ? `, ${visualAccepted} accepted visual differences` : '') +
    (visualFailed ? `, ${visualFailed} visually failing` : '') +
    (failed ? `, ${failed} HTML failures` : '') +
    (notCompared ? `, ${notCompared} with no visual comparison` : '') +
    '.**',
  '',
  '"Exact" means the rendered Astro markup and the story\'s own rendered markup',
  'are identical once normalised. It is not a claim about the whole component',
  `tree: ${wrapperCount} of the ${rows.length} stories are **wrapper-only**, meaning more than half`,
  "of the fixture HTML arrives pre-rendered in the story's args because upstream's",
  '`*.stories.data.js` builds it by calling other Twig templates. For those, a',
  'pass is a **wrapper match** — the children are covered by their own stories',
  'and by the 697 `tests/parity/` snapshot cases. The `Wrapper` column gives the',
  'passthrough percentage.',
  '',
  notCompared
    ? `${notCompared} stories have no visual comparison: \`04-templates\` is not a ported layer, so no page exists to screenshot.`
    : null,
  notCompared ? '' : null,
  '- `npm run test:story-parity` — HTML comparison (fast, no browser).',
  '- `npm run test:story-parity:visual` — pixel comparison (builds the site, runs Playwright).',
  '- `node scripts/story-parity-report.mjs` — regenerates this file.',
  '',
  '## Stories',
  '',
  '| Component | Story | Theme | HTML | Wrapper | Pixels | Visual | Accepted difference |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(
    (row) =>
      `| \`${row.component}\` | ${escape(row.story)} | ${row.theme} | ${row.html} | ${row.wrapper} | ` +
      `${row.pixels} | ${row.visual} | ${escape(row.reason) || '—'} |`
  ),
  '',
].filter((line) => line !== null);

const output = path.join(REPO, 'PARITY.md');
fs.writeFileSync(output, `${lines.join('\n')}\n`);
// `npm run check` runs `prettier --check .` over the repo, and a generated
// Markdown table is not Prettier-shaped (it pads every column). Formatting it
// here keeps the generated file and the check in agreement.
execFileSync('npx', ['prettier', '--write', output], { cwd: REPO, stdio: 'pipe' });
console.log(
  `PARITY.md: ${rows.length} stories, ${exact} exact, ${acceptedCount} accepted, ` +
    `${within} visually within tolerance, ${visualFailed} visually failing, ${failed} HTML failures.`
);
