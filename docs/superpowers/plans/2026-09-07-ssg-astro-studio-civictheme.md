# ssg-astro-studio-civictheme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `ssg-astro-studio-civictheme` Quant Cloud template: the CivicTheme UI Kit (91 Twig components, v1.13.0) ported markup-faithfully to Astro components with a snapshot parity harness, CivicTheme SCSS compiled live, content collections for pages/events/news/publications/alerts, the ten CivicTheme demo pages, a components reference section, OG images, Quant deploy/CI workflows, and a passing Studio gate.

**Architecture:** A clean Astro 7 static project with no Tailwind. `src/civictheme/` holds everything derived from the UI Kit (hand-finished `.astro` components, vendored SCSS/JS/icons via a script). Template-level layouts, compositions (`ListingAuto`, `ManualList`, `SiteHeader`, …) and demo content live outside that subtree. A vitest parity suite renders each `.astro` component through Astro's container API with the props from the upstream Jest tests and compares normalised HTML against the upstream `.snap` files. Pages are MDX composing components (Studio renders arrays/objects as raw JSON, so no block arrays in frontmatter).

**Tech Stack:** Astro ^7.3, @astrojs/mdx, @astrojs/sitemap, astro-robots-txt, satori + @resvg/resvg-js (OG images), sass ^1.104 (dev, for local `astro build`), vitest, linkedom (parity normaliser), @playwright/test + @axe-core/playwright (behaviour + a11y smoke), Node 22.

**Spec:** `docs/superpowers/specs/2026-09-07-ssg-astro-studio-civictheme-design.md`

## Global Constraints

- Upstream source: https://github.com/civictheme/uikit, `packages/twig`, **v1.13.0, commit `fe4291907b1ea15cfc0ea5d9ca47d31964a5b91a`**. Clone once to `.upstream/uikit` (git-ignored) at that commit; every script and test that reads upstream takes that path (`UIKIT` env or argument, default `.upstream/uikit`).
- Licence: the template is **GPL-2.0-or-later**. `LICENSE.txt` is CivicTheme's; `NOTICE.md` credits Salsa Digital with repo, version and commit.
- **Markup fidelity**: rendered DOM and every `ct-*` class identical to upstream. Vendored SCSS/JS are never edited; behaviour shims live only in `src/civictheme/js/civictheme.js`.
- **Studio-compilable only**: no Node-only import in any `.astro`, `.mdx`, `.ts` under `src/` except `src/pages/og/[...slug].png.ts` (satori/resvg, same as `ssg-astro-studio`). No Tailwind. Frontmatter schemas use only `z.string()`, `z.enum()`, `z.boolean()`, `z.coerce.date()`, `z.number()`, `z.array(z.string())`, image paths as strings.
- Props: CivicTheme names in camelCase; `modifier_class` → `class`; Twig `attributes` → rest props spread onto the root element; slots keep CivicTheme names in camelCase; `theme` defaults to `'light'`.
- **No lock file committed** (`package-lock.json` in `.gitignore`). `npm install`, never `npm ci`, in workflows. Node `>=22.12.0`.
- Definition of done for a component: its parity cases pass AND it appears on the components section page for its family (Task 15).
- Commit after every task; commit messages in conventional style. Run `npm run check` (astro check + prettier) before each commit that touches `src/`.
- Repository: `/Users/stuart/apps/quant-templates/ssg-astro-studio-civictheme`, branch `main`, first commit `254022a` (spec). Work on `main` directly is NOT allowed for the executor: create branch `feat/template-build` (or a worktree) and merge at the end.

---

## Shared reference (read once; every port task uses it)

### R1. Layer → folder → alias

| Upstream layer | `.astro` folder | Alias |
|---|---|---|
| `00-base` | `src/civictheme/components/00-base/` | `@civictheme/base/*` |
| `01-atoms` | `src/civictheme/components/01-atoms/` | `@civictheme/atoms/*` |
| `02-molecules` | `src/civictheme/components/02-molecules/` | `@civictheme/molecules/*` |
| `03-organisms` | `src/civictheme/components/03-organisms/` | `@civictheme/organisms/*` |

File name = PascalCase of the Twig basename (`promo-card.twig` → `PromoCard.astro`; `mobile-navigation-trigger.twig` → `MobileNavigationTrigger.astro`; `slide.twig` → `Slide.astro`). Storybook-only templates (`*.stories.twig`) are NOT ported.

### R2. Twig → Astro translation table

| Twig | Astro |
|---|---|
| doc header `- foo_bar: [string] …` | `fooBar?: string` in `interface Props` (`[boolean]`→`boolean`, `[array]`→typed array, `[object]`→inline interface, `[string,null]`→`string \| null`) |
| `theme\|default('light')` | `const { theme = 'light' } = Astro.props` |
| `modifier_class` | `class?: string` prop, appended last in the class list |
| `attributes` | `const { ..., ...rest } = Astro.props; <div {...rest}>` |
| `{% set x_class = cond ? 'a' : '' %}` + `'%s %s'\|format(...)` | `const classes = ['ct-foo', \`ct-theme-${theme}\`, cond && 'ct-foo--x', className].filter(Boolean).join(' ')` |
| `{% include '@atoms/tag/tag.twig' with {...} only %}` | `import Tag from '@civictheme/atoms/Tag.astro'` + `<Tag ... />` |
| `{% if slot_name is not empty %}{{ slot_name }}{% endif %}` | `{Astro.slots.has('slotName') && <div class="…"><slot name="slotName" /></div>}` |
| `{% block foo_block %}…{% endblock %}` | rendered inline; no override mechanism (record in `PORTING.md` if a Drupal template relied on it) |
| `content` / html-bearing string props | prop typed `string` and rendered with `set:html` |
| `\|raw` | `set:html` |
| `{% for item in items %}` | `{items.map((item) => …)}` |
| `create_attribute()` / `attr.addClass` | class list + rest spread |
| `source(assets_dir ~ '/icons/' ~ symbol ~ '.svg')` (Icon only) | generated `icons.ts` symbol map (Task 2) |

Whitespace-control (`{%-`, `-}}`) is ignored: the parity normaliser collapses whitespace.

### R3. Parity case authoring (from Task 3 onward)

For component `<layer>/<name>`:

1. Open `.upstream/uikit/packages/twig/components/<layer>/<name>/<name>.test.js` and `__snapshots__/<name>.test.js.snap`.
2. For each `test('<title>', …)` that calls `expect(...).toMatchSnapshot()` (directly or via a helper), add a case to `tests/parity/<layer>/<Name>.parity.test.ts`:
   ```ts
   parityCase('<Component title as in describe()> <test title> 1', Component, { ...props in camelCase... }, { slotName: '<html>' });
   ```
   The first argument is the exact `exports[...]` key in the `.snap` file.
3. Upstream `DrupalAttribute().setAttribute('data-test','true')` → pass `'data-test': 'true'` as a prop (rest spread).
4. Upstream tests that assert only with `querySelector` and never snapshot → port as normal vitest assertions on `renderNormalised(...)` output.
5. Run `npm run test:parity -- <Name>`; iterate on the component until green.

### R4. Harness API (defined in Task 3)

```ts
// tests/parity/harness.ts
export async function renderComponent(Component: any, props?: Record<string, unknown>, slots?: Record<string, string>): Promise<string>;
export function normaliseHtml(html: string): string;              // parse, sort attrs, collapse ws, strip data-astro-cid-*, drop empty text
export function upstreamSnapshot(layer: string, name: string, key: string): string; // reads .snap, unwraps outer <div>
export function parityCase(key: string, Component: any, props?: Record<string, unknown>, slots?: Record<string, string>): void; // defines an `it()`
export async function renderNormalised(Component: any, props?: Record<string, unknown>, slots?: Record<string, string>): Promise<string>;
```

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.prettierrc.cjs`, `.prettierignore`, `.nvmrc`, `.editorconfig` | project config |
| `LICENSE.txt`, `NOTICE.md`, `README.md`, `PORTING.md` | licence, credits, docs, per-component porting notes |
| `quant/meta.json` | dashboard registration |
| `.github/workflows/deploy.yml`, `ci.yml` | deploy to QuantCDN; daily build validation |
| `scripts/vendor-civictheme.mjs` | copy SCSS/JS/icons/backgrounds/logos from `.upstream/uikit`; write `scss/index.scss`, `components/00-base/icons.ts`, refresh `NOTICE.md` |
| `scripts/twig-to-astro.mjs` | one-shot `.astro` skeleton generator |
| `src/civictheme/scss/**`, `src/civictheme/js/behaviours/**`, `src/civictheme/js/civictheme.js` | vendored SCSS tree + index; vendored behaviours + init module |
| `src/civictheme/variables.base.scss`, `variables.components.scss` | theming entry points |
| `src/civictheme/components/<layer>/<Name>.astro` | ported components |
| `src/civictheme/components/00-base/icons.ts` | generated `Record<string,string>` of SVG markup |
| `public/civictheme/{backgrounds,logos}/` | static assets referenced by SCSS `url()` and demo content |
| `src/styles/global.scss` | single stylesheet entry |
| `src/content.config.ts`, `src/content/**` | collections and demo content |
| `src/components/*.astro` | template-level compositions |
| `src/layouts/{BaseLayout,PageLayout,DetailLayout}.astro` | layouts |
| `src/pages/**` | routes, listings, components section, OG endpoint, 404, search |
| `tests/parity/harness.ts`, `tests/parity/<layer>/*.parity.test.ts` | parity suite |
| `tests/content.test.ts`, `tests/build.test.ts` | schema + build tests |
| `tests/e2e/behaviours.spec.ts`, `tests/e2e/a11y.spec.ts` | Playwright smoke + axe |

---

### Task 1: Project scaffold, licence, workflows, meta

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`, `.editorconfig`, `.prettierrc.cjs`, `.prettierignore`, `LICENSE.txt`, `NOTICE.md`, `README.md`, `PORTING.md`, `quant/meta.json`, `.github/workflows/deploy.yml`, `.github/workflows/ci.yml`, `src/pages/index.astro`, `src/env.d.ts`, `public/favicon.svg`

**Interfaces:**
- Produces: path aliases `@civictheme/base|atoms|molecules|organisms/*`, `@/*` → `src/*`; scripts `dev`, `build`, `preview`, `check`, `test`, `test:parity`, `test:e2e`, `vendor`.

- [ ] **Step 1: Branch and upstream checkout**

```bash
cd /Users/stuart/apps/quant-templates/ssg-astro-studio-civictheme
git checkout -b feat/template-build
mkdir -p .upstream && git clone -q https://github.com/civictheme/uikit.git .upstream/uikit
git -C .upstream/uikit checkout -q fe4291907b1ea15cfc0ea5d9ca47d31964a5b91a
grep '"version"' .upstream/uikit/package.json   # expect 1.13.0
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "ssg-astro-studio-civictheme",
  "description": "CivicTheme design system on Astro with Quant Studio integration",
  "type": "module",
  "version": "0.1.0",
  "license": "GPL-2.0-or-later",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check && prettier --check .",
    "fix": "prettier --write .",
    "test": "vitest run",
    "test:parity": "vitest run tests/parity",
    "test:e2e": "playwright test",
    "vendor": "node scripts/vendor-civictheme.mjs"
  },
  "dependencies": {
    "astro": "^7.3.1",
    "@astrojs/mdx": "^8.0.0",
    "@astrojs/sitemap": "^3.7.4",
    "@resvg/resvg-js": "^2.6.2",
    "astro-robots-txt": "^1.0.0",
    "satori": "^0.26.0"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.10.0",
    "@playwright/test": "^1.50.0",
    "linkedom": "^0.18.0",
    "prettier": "^3.0.0",
    "prettier-plugin-astro": "^0.14.0",
    "sass": "^1.104.0",
    "typescript": "^5.0.0",
    "vitest": "^3.0.0"
  },
  "engines": { "node": ">=22.12.0" }
}
```

- [ ] **Step 3: Write `astro.config.mjs`, `tsconfig.json`, dotfiles**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  build: { format: 'file' },
  integrations: [mdx(), sitemap(), robotsTxt()],
});
```

```json
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@civictheme/base/*": ["src/civictheme/components/00-base/*"],
      "@civictheme/atoms/*": ["src/civictheme/components/01-atoms/*"],
      "@civictheme/molecules/*": ["src/civictheme/components/02-molecules/*"],
      "@civictheme/organisms/*": ["src/civictheme/components/03-organisms/*"]
    }
  }
}
```

`.gitignore`:
```
node_modules/
dist/
.astro/
package-lock.json
.upstream/
test-results/
playwright-report/
.superpowers/
```

`.nvmrc`: `22`. `.editorconfig` and `.prettierrc.cjs`: copy verbatim from `/Users/stuart/apps/quant-templates/ssg-astro-studio/`. `.prettierignore`: `dist\n.astro\nsrc/civictheme/scss\nsrc/civictheme/js/behaviours\nsrc/civictheme/components/00-base/icons.ts\n.upstream`.

`src/env.d.ts`: `/// <reference types="astro/client" />`.

- [ ] **Step 4: Licence, notice, README, PORTING, meta**

```bash
cp .upstream/uikit/LICENSE.txt LICENSE.txt
```

`NOTICE.md`:
```markdown
# Notice

This template is a derivative work of the CivicTheme UI Kit by Salsa Digital.

- Upstream: https://github.com/civictheme/uikit (`packages/twig`)
- Version: 1.13.0
- Commit: fe4291907b1ea15cfc0ea5d9ca47d31964a5b91a
- Licence: GPL-2.0-or-later (see LICENSE.txt)

Everything under `src/civictheme/` is derived from the UI Kit: SCSS and JavaScript are
vendored unchanged by `scripts/vendor-civictheme.mjs`; the `.astro` components are
hand-ported from the Twig templates and keep the upstream markup and class names.
The rest of this repository (configuration, layouts, demo content) is © Quant Pty Ltd
and distributed under the same licence.
```

`README.md` (initial; Task 16 completes it):
```markdown
# CivicTheme for Astro + Quant Studio

The CivicTheme design system (Salsa Digital) ported to Astro, editable in Quant Studio.
See `NOTICE.md` for licence. Quick start: `npm install && npm run dev`.
```

`PORTING.md`:
```markdown
# Porting notes

One row per component where the Twig → Astro port needed a decision.

| Component | Twig construct | Astro decision |
|---|---|---|
```

`quant/meta.json`:
```json
[{
  "title": "CivicTheme (Astro Studio)",
  "url": "/deploy/static/ssg-astro-studio-civictheme",
  "summary": "CivicTheme design system on Astro with Quant Studio visual editing",
  "content": "The Salsa Digital CivicTheme design system ported to Astro: 90+ accessible components, live SCSS theming, pages, events, news and publications collections, and a full demo site. Designed for visual editing with Quant Studio.",
  "image": "https://raw.githubusercontent.com/quantcdn-templates/ssg-astro-studio-civictheme/main/quant/screenshot.png",
  "categories": ["javascript", "astro", "studio", "civictheme"],
  "tags": ["design-system", "government", "scss", "mdx", "og-images", "accessibility"],
  "template_type": "ssg",
  "requires_db": false,
  "og_images": true
}]
```

- [ ] **Step 5: Workflows**

`.github/workflows/deploy.yml`: copy `/Users/stuart/apps/quant-templates/ssg-astro-studio/.github/workflows/deploy.yml` verbatim, then change the Astro cache key line to `key: astro-build-${{ hashFiles('src/content/**', 'public/**') }}`.

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm install
      - name: Unit and parity tests
        run: npm test
      - name: Build
        run: npm run build
        env:
          NODE_OPTIONS: '--max-old-space-size=8192'
      - name: Verify build output
        run: |
          test -d dist && test -f dist/index.html && echo "✓ dist present"
          grep -q "ct-" dist/_astro/*.css && echo "✓ CivicTheme CSS present"
```

- [ ] **Step 6: Minimal page and first build**

`src/pages/index.astro`:
```astro
---
---
<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>CivicTheme</title></head>
<body><h1>CivicTheme for Astro</h1></body></html>
```

```bash
npm install && npm run build && test -f dist/index.html && echo OK
```
Expected: `OK`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold ssg-astro-studio-civictheme (licence, workflows, meta, config)"
```

---

### Task 2: Vendoring script — SCSS index, behaviours, icons, assets

**Files:**
- Create: `scripts/vendor-civictheme.mjs`, `src/styles/global.scss`, `src/civictheme/variables.base.scss`, `src/civictheme/variables.components.scss`
- Generated: `src/civictheme/scss/**`, `src/civictheme/js/behaviours/**`, `src/civictheme/components/00-base/icons.ts`, `public/civictheme/{backgrounds,logos}/**`
- Test: `tests/build.test.ts`

**Interfaces:**
- Produces: `icons.ts` exporting `export const icons: Record<string, string>` (symbol → SVG markup) and `export type IconSymbol = keyof typeof icons`; `src/civictheme/scss/index.scss`; `src/styles/global.scss`.

- [ ] **Step 1: Write the failing build test**

```ts
// tests/build.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
function builtCss(): string {
  const dir = join(root, 'dist/_astro');
  return readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
}

describe('astro build', () => {
  beforeAll(() => { execSync('npm run build', { cwd: root, stdio: 'pipe' }); }, 300_000);
  it('emits the CivicTheme stylesheet', () => {
    const css = builtCss();
    expect(css).toContain('.ct-button');
    expect(css).toMatch(/--ct-color-light-brand1:\s*#00698f/);
  });
  it('emits index.html', () => { expect(existsSync(join(root, 'dist/index.html'))).toBe(true); });
});
```
Run: `npx vitest run tests/build.test.ts` → FAIL (`.ct-button` absent).

- [ ] **Step 2: Write the vendoring script**

```js
// scripts/vendor-civictheme.mjs
// Usage: node scripts/vendor-civictheme.mjs [path-to-uikit-checkout]   (default .upstream/uikit)
import { readdirSync, statSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const uikit = process.argv[2] ?? join(root, '.upstream/uikit');
const twig = join(uikit, 'packages/twig');
const components = join(twig, 'components');
const out = {
  scss: join(root, 'src/civictheme/scss'),
  js: join(root, 'src/civictheme/js/behaviours'),
  icons: join(root, 'src/civictheme/components/00-base/icons.ts'),
  pub: join(root, 'public/civictheme'),
};

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const isStory = (p) => /\.stories\./.test(p);
const isVariablesFile = (p) => /(^|\/)_?variables(\.base|\.components)?\.scss$/.test(p);

// 1. SCSS tree (minus stories, style.scss, style.stories.scss) + explicit index
rmSync(out.scss, { recursive: true, force: true });
const scssFiles = walk(components).filter((p) => p.endsWith('.scss') && !isStory(p) && !/\/style(\.stories)?\.scss$/.test(p));
for (const f of scssFiles) {
  // variables.base/components at the components root are the THEMING files; they live one level up in src/civictheme/
  const rel = relative(components, f);
  if (/^variables\.(base|components)\.scss$/.test(rel)) continue;
  const dest = join(out.scss, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(f, dest);
}
const layers = ['00-base', '01-atoms', '02-molecules', '03-organisms', '04-templates', '05-pages'];
let index = "// Generated by scripts/vendor-civictheme.mjs — do not edit.\n@import '00-base/variables';\n";
for (const layer of layers) {
  const dir = join(out.scss, layer);
  if (!existsSync(dir)) continue;
  for (const f of walk(dir).filter((p) => p.endsWith('.scss') && !isVariablesFile(p)).sort()) {
    index += `@import '${relative(out.scss, f).replace(/\.scss$/, '')}';\n`;
  }
}
writeFileSync(join(out.scss, 'index.scss'), index);
// 00-base/variables.scss imports '../variables.base' and '../variables.components' relative to the scss root →
// the theming files must sit at src/civictheme/scss/../variables.*.scss = src/civictheme/variables.*.scss (created once in Step 3, never overwritten here).

// 2. JS behaviours (non-story, non-test, non-utils)
rmSync(out.js, { recursive: true, force: true });
const jsFiles = walk(components).filter((p) => p.endsWith('.js') && !isStory(p) && !/\.test\.js$/.test(p) && !/\.utils\.js$/.test(p) && !/storybook/.test(p));
for (const f of jsFiles) { const dest = join(out.js, basename(f)); mkdirSync(dirname(dest), { recursive: true }); copyFileSync(f, dest); }
writeFileSync(join(out.js, 'index.js'), jsFiles.map((f) => `import './${basename(f)}';`).sort().join('\n') + '\n');

// 3. Icons → TS symbol map
const iconDir = join(twig, 'assets/icons');
const icons = readdirSync(iconDir).filter((f) => f.endsWith('.svg')).sort();
let ts = '// Generated by scripts/vendor-civictheme.mjs — do not edit.\nexport const icons = {\n';
for (const f of icons) ts += `  ${JSON.stringify(f.replace(/\.svg$/, ''))}: ${JSON.stringify(readFileSync(join(iconDir, f), 'utf8').trim())},\n`;
ts += '} as const;\nexport type IconSymbol = keyof typeof icons;\n';
writeFileSync(out.icons, ts);

// 4. Backgrounds + logos → public/civictheme
for (const sub of ['backgrounds', 'logos']) {
  const src = join(twig, 'assets', sub); const dest = join(out.pub, sub);
  rmSync(dest, { recursive: true, force: true }); mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(src)) copyFileSync(join(src, f), join(dest, f));
}

// 5. NOTICE version/commit
const version = JSON.parse(readFileSync(join(uikit, 'package.json'), 'utf8')).version;
let commit = 'unknown'; try { commit = execSync('git rev-parse HEAD', { cwd: uikit }).toString().trim(); } catch {}
const notice = join(root, 'NOTICE.md');
writeFileSync(notice, readFileSync(notice, 'utf8').replace(/- Version: .*/, `- Version: ${version}`).replace(/- Commit: .*/, `- Commit: ${commit}`));
console.log(`vendored ${scssFiles.length} scss, ${jsFiles.length} js, ${icons.length} icons from uikit ${version} (${commit.slice(0, 7)})`);
```

- [ ] **Step 3: Theming files and global stylesheet**

`src/civictheme/variables.base.scss` — copy `.upstream/uikit/packages/twig/components/variables.base.scss`, then prepend:
```scss
// CivicTheme theming entry point (base variables). Edit this file in Studio to re-theme the site.
// RULE: if you override $ct-colors-brands you must supply the FULL map — brand1, brand2 and brand3
// for BOTH 'light' and 'dark' — otherwise CivicTheme raises "@error: brandN is not an available color".
```
`src/civictheme/variables.components.scss` — copy upstream `components/variables.components.scss` with a one-line header comment.

`src/styles/global.scss`:
```scss
// Single stylesheet entry. Imported once from BaseLayout.
$ct-assets-directory: '/civictheme/';
@import '../civictheme/scss/index';

// Site overrides go below this line.
```

- [ ] **Step 4: Run the script, wire the stylesheet, verify**

```bash
node scripts/vendor-civictheme.mjs
ls src/civictheme/scss | head; wc -l src/civictheme/scss/index.scss; grep -c '"' src/civictheme/components/00-base/icons.ts   # ≈ 59 icons
```
Edit `src/pages/index.astro` frontmatter: `import '@/styles/global.scss';`. Then `npx vitest run tests/build.test.ts` → PASS. Also `npm run check`.

- [ ] **Step 5: Commit** (`src/civictheme/scss`, `js/behaviours`, `icons.ts`, `public/civictheme` ARE committed — the template must build without the upstream checkout)

```bash
git add -A && git commit -m "feat: vendor CivicTheme 1.13.0 SCSS, behaviours, icons and assets with explicit import index"
```

---

### Task 3: Parity harness + first hand-ported component (Paragraph)

**Files:**
- Create: `vitest.config.ts`, `tests/parity/harness.ts`, `src/civictheme/components/01-atoms/Paragraph.astro`, `tests/parity/01-atoms/Paragraph.parity.test.ts`

**Interfaces:**
- Produces: harness API in R4.

- [ ] **Step 1: vitest config using Astro's Vite config**

```ts
// vitest.config.ts
import { getViteConfig } from 'astro/config';
export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    testTimeout: 30_000,
  },
});
```

- [ ] **Step 2: Harness**

```ts
// tests/parity/harness.ts
import { it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const UIKIT = process.env.UIKIT ?? join(process.cwd(), '.upstream/uikit');
let container: AstroContainer | undefined;

export async function renderComponent(Component: any, props: Record<string, unknown> = {}, slots?: Record<string, string>): Promise<string> {
  container ??= await AstroContainer.create();
  return container.renderToString(Component, { props, slots });
}

/** Snapshots wrap output in <div>…</div> (twig-testing-library). Return inner HTML. */
export function upstreamSnapshot(layer: string, name: string, key: string): string {
  const file = join(UIKIT, 'packages/twig/components', layer, name, '__snapshots__', `${name}.test.js.snap`);
  const src = readFileSync(file, 'utf8');
  const re = new RegExp('exports\\[`' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '`\\] = `([\\s\\S]*?)`;', 'm');
  const m = src.match(re);
  if (!m) throw new Error(`snapshot key not found: ${key} in ${file}`);
  const html = m[1].replace(/\\`/g, '`');
  const { document } = parseHTML(`<body>${html}</body>`);
  const wrapper = document.body.firstElementChild;
  return wrapper && wrapper.tagName === 'DIV' && !wrapper.attributes.length ? wrapper.innerHTML : html;
}

export function normaliseHtml(html: string): string {
  const { document } = parseHTML(`<body>${html}</body>`);
  const walk = (node: any): string => {
    if (node.nodeType === 3) { const t = node.textContent.replace(/\s+/g, ' ').trim(); return t; }
    if (node.nodeType !== 1) return '';
    const attrs = [...node.attributes]
      .filter((a: any) => !a.name.startsWith('data-astro-cid-'))
      .map((a: any) => [a.name, a.name === 'class' ? a.value.split(/\s+/).filter(Boolean).sort().join(' ') : a.value.trim()] as [string, string])
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => (v === '' ? k : `${k}="${v}"`)).join(' ');
    const children = [...node.childNodes].map(walk).filter(Boolean).join('');
    const tag = node.tagName.toLowerCase();
    return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
  };
  return [...document.body.childNodes].map(walk).filter(Boolean).join('');
}

export async function renderNormalised(Component: any, props?: Record<string, unknown>, slots?: Record<string, string>): Promise<string> {
  return normaliseHtml(await renderComponent(Component, props, slots));
}

/** Defines one vitest case comparing Astro output to the upstream snapshot `key`. `layer`/`name` are derived from the Component file path via `meta`. */
export function parityCase(meta: { layer: string; name: string }, key: string, Component: any, props?: Record<string, unknown>, slots?: Record<string, string>) {
  it(key, async () => {
    const actual = await renderNormalised(Component, props, slots);
    const expected = normaliseHtml(upstreamSnapshot(meta.layer, meta.name, key));
    expect(actual).toBe(expected);
  });
}
```

(R4's `parityCase(key, …)` is shorthand; the real signature takes `meta` first as above. Every parity file begins with `const meta = { layer: '01-atoms', name: 'paragraph' };`.)

- [ ] **Step 3: Failing parity test for Paragraph**

Read `.upstream/uikit/packages/twig/components/01-atoms/paragraph/paragraph.twig`, `paragraph.test.js`, `__snapshots__/paragraph.test.js.snap`. Write one case per snapshot key found in the `.snap` (use `grep -o 'exports\[`[^`]*`\]' <snap>` to list them). Example shape:

```ts
// tests/parity/01-atoms/Paragraph.parity.test.ts
import { describe } from 'vitest';
import Paragraph from '@civictheme/atoms/Paragraph.astro';
import { parityCase } from '../harness';
const meta = { layer: '01-atoms', name: 'paragraph' };
describe('Paragraph', () => {
  parityCase(meta, 'Paragraph Component renders with default values 1', Paragraph, { content: 'Sample paragraph text' });
  // …one parityCase per remaining snapshot key, props copied from paragraph.test.js and camelCased…
});
```
Run `npm run test:parity -- Paragraph` → FAIL (module not found).

- [ ] **Step 4: Port `Paragraph.astro` by hand**

Translate `paragraph.twig` with R2. Expected shape (adjust to the actual Twig):

```astro
---
interface Props {
  theme?: 'light' | 'dark';
  content?: string;
  size?: 'extra-large' | 'large' | 'regular' | 'small';
  allowHtml?: boolean;
  noMargin?: boolean;
  class?: string;
  [key: string]: unknown;
}
const { theme = 'light', content, size = 'regular', allowHtml = false, noMargin = false, class: className = '', ...rest } = Astro.props;
const classes = ['ct-paragraph', `ct-theme-${theme}`, `ct-paragraph--${size}`, noMargin && 'ct-paragraph--no-margin', className].filter(Boolean).join(' ');
---
{content && (allowHtml ? <div class={classes} {...rest} set:html={content} /> : <div class={classes} {...rest}>{content}</div>)}
```
Iterate until `npm run test:parity -- Paragraph` is green. Record any decision in `PORTING.md`.

- [ ] **Step 5: Commit**

```bash
npm run check && git add -A && git commit -m "feat: parity harness (Astro container + upstream snapshots) and Paragraph atom"
```

---

### Task 4: Twig → Astro skeleton generator

**Files:**
- Create: `scripts/twig-to-astro.mjs`, `tests/twig-to-astro.test.ts`

**Interfaces:**
- Produces: `node scripts/twig-to-astro.mjs <layer>/<name> [--force]` writes `src/civictheme/components/<layer>/<Name>.astro` ONLY if it does not exist (or `--force`), containing: `interface Props` from the doc header, imports for every `{% include '@layer/x/x.twig' %}`, a `const { … } = Astro.props` destructure, and the Twig body pasted inside an HTML comment as `<!-- TWIG:\n…\n-->` for the porter to translate.

- [ ] **Step 1: Failing test**

```ts
// tests/twig-to-astro.test.ts
import { describe, it, expect } from 'vitest';
import { generateSkeleton } from '../scripts/twig-to-astro.mjs';

const twig = `{#
/**
 * @file
 * CivicTheme Tag component.
 *
 * Props:
 * - theme: [string] Theme variation (light or dark).
 * - type: [string] Tag type (primary, secondary, tertiary).
 * - content: [string] Tag content.
 * - is_new_window: [boolean] Open in new window.
 * - icon: [string,null] Icon name.
 * - tags: [array] Items:
 *   Each item contains:
 *   - text: [string] Text.
 * - modifier_class: [string] Additional CSS classes.
 * - attributes: [Drupal\\Core\\Template\\Attribute] Additional HTML attributes.
 */
#}
{% include '@base/icon/icon.twig' with { symbol: icon } only %}
<span class="ct-tag">{{ content }}</span>`;

describe('generateSkeleton', () => {
  const out = generateSkeleton(twig, '01-atoms/tag');
  it('builds a camelCase Props interface with types', () => {
    expect(out).toContain('interface Props');
    expect(out).toContain("theme?: 'light' | 'dark';");
    expect(out).toContain('isNewWindow?: boolean;');
    expect(out).toContain('icon?: string | null;');
    expect(out).toContain('tags?: Array<{ text?: string }>;');
    expect(out).toContain('class?: string;');
    expect(out).toContain('[key: string]: unknown;');
    expect(out).not.toContain('modifier_class');
    expect(out).not.toContain('attributes?:');
  });
  it('imports included components via aliases', () => {
    expect(out).toContain("import Icon from '@civictheme/base/Icon.astro';");
  });
  it('destructures props with defaults and rest', () => {
    expect(out).toMatch(/const \{ theme = 'light', .*class: className = '', \.\.\.rest \} = Astro\.props;/);
  });
  it('embeds the twig body for translation', () => {
    expect(out).toContain('<!-- TWIG:');
    expect(out).toContain('<span class="ct-tag">');
  });
});
```
Run → FAIL (no export).

- [ ] **Step 2: Implement**

```js
// scripts/twig-to-astro.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ALIAS = { base: '@civictheme/base', atoms: '@civictheme/atoms', molecules: '@civictheme/molecules', organisms: '@civictheme/organisms' };
export const pascal = (s) => s.split(/[-_]/).map((p) => p[0].toUpperCase() + p.slice(1)).join('');
export const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

function tsType(twigType, name) {
  const parts = twigType.split(',').map((t) => t.trim());
  const nullable = parts.includes('null');
  const base = parts.find((t) => t !== 'null') ?? 'string';
  const map = { string: name === 'theme' ? "'light' | 'dark'" : 'string', boolean: 'boolean', number: 'number', integer: 'number', array: 'unknown[]', object: 'Record<string, unknown>' };
  return (map[base] ?? 'unknown') + (nullable ? ' | null' : '');
}

/** Parse "Props:" block of the doc header into [{name, type, children}] (one level of nesting for arrays/objects). */
export function parseProps(twig) {
  const header = twig.match(/\{#[\s\S]*?#\}/)?.[0] ?? '';
  const lines = header.split('\n').map((l) => l.replace(/^\s*\*\s?/, ''));
  const start = lines.findIndex((l) => /^Props:/.test(l));
  const end = lines.findIndex((l, i) => i > start && /^(Slots|Blocks):/.test(l));
  const body = lines.slice(start + 1, end === -1 ? undefined : end);
  const props = [];
  for (const l of body) {
    const top = l.match(/^- (\w+): \[([^\]]+)\]/);
    const child = l.match(/^\s{2,}- (\w+): \[([^\]]+)\]/);
    if (top) props.push({ name: top[1], type: top[2], children: [] });
    else if (child && props.length) props.at(-1).children.push({ name: child[1], type: child[2] });
  }
  return props.filter((p) => p.name !== 'attributes');
}

export function generateSkeleton(twig, layerName) {
  const [layer, name] = layerName.split('/');
  const props = parseProps(twig);
  const iface = props.map((p) => {
    if (p.name === 'modifier_class') return '  class?: string;';
    if (p.children.length) {
      const inner = p.children.map((c) => `${camel(c.name)}?: ${tsType(c.type, c.name)}`).join('; ');
      return `  ${camel(p.name)}?: ${p.type.startsWith('array') ? `Array<{ ${inner} }>` : `{ ${inner} }`};`;
    }
    return `  ${camel(p.name)}?: ${tsType(p.type, p.name)};`;
  });
  const includes = [...twig.matchAll(/@(base|atoms|molecules|organisms)\/([\w-]+)\/[\w-]+\.twig/g)];
  const imports = [...new Set(includes.map((m) => `import ${pascal(m[2])} from '${ALIAS[m[1]]}/${pascal(m[2])}.astro';`))].sort();
  const destructure = props.map((p) => (p.name === 'modifier_class' ? "class: className = ''" : p.name === 'theme' ? "theme = 'light'" : camel(p.name))).join(', ');
  const body = twig.replace(/\{#[\s\S]*?#\}\s*/, '');
  return `---\n${imports.join('\n')}${imports.length ? '\n\n' : ''}interface Props {\n${iface.join('\n')}\n  [key: string]: unknown;\n}\nconst { ${destructure}, ...rest } = Astro.props;\n---\n<!-- TWIG:\n${body.trim()}\n-->\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [layerName, flag] = process.argv.slice(2);
  if (!layerName) { console.error('usage: twig-to-astro.mjs <layer>/<name> [--force]'); process.exit(1); }
  const [layer, name] = layerName.split('/');
  const root = join(dirname(new URL(import.meta.url).pathname), '..');
  const src = join(root, '.upstream/uikit/packages/twig/components', layer, name, `${name}.twig`);
  const dest = join(root, 'src/civictheme/components', layer, `${pascal(name)}.astro`);
  if (existsSync(dest) && flag !== '--force') { console.error(`refusing to overwrite ${dest} (use --force)`); process.exit(2); }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, generateSkeleton(readFileSync(src, 'utf8'), layerName));
  console.log('wrote', dest);
}
```
Run `npx vitest run tests/twig-to-astro.test.ts` → PASS.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: twig-to-astro skeleton generator"
```

---

### Task 5: Port 00-base components (7) + Icon

**Files:**
- Create: `src/civictheme/components/00-base/{Icon,Datetime,Grid,ItemList,Layout,Menu,TextIcon}.astro`; `tests/parity/00-base/*.parity.test.ts`; rows in `PORTING.md`

**Interfaces:**
- Produces: `Icon` props `{ symbol: IconSymbol | string; size?: 'extra-small'|'small'|'regular'|'large'|'extra-large'; class?; …rest }` rendering upstream SVG with `class="ct-icon ct-icon--size-<size>" aria-hidden="true" role="img"` merged into the `<svg` tag exactly as upstream does (`source|replace({'<svg ': '<svg ' ~ attr ~ ' '})`); `Grid` (`container`, `rowClass`, `columnClass`, `fillWidth`, `isFluid`, slot default) ; `Menu` recursive (`items: Array<{ title, url, below?, isExpanded?, inActiveTrail?, isExternal?, isNewWindow? }>`); `Datetime`, `ItemList`, `Layout`, `TextIcon`.

- [ ] **Step 1: Generate skeletons**

```bash
for c in icon datetime grid item-list layout menu text-icon; do node scripts/twig-to-astro.mjs 00-base/$c; done
```

- [ ] **Step 2: Parity tests first** — for each of the 7, list snapshot keys (`grep -o 'exports\[`[^`]*`\]' .upstream/uikit/packages/twig/components/00-base/<c>/__snapshots__/*.snap`), write `tests/parity/00-base/<Name>.parity.test.ts` per R3 (`meta = { layer: '00-base', name: '<c>' }`). Components without a `.test.js` (check with `ls`) get a smoke test asserting the root class via `renderNormalised`. Run `npm run test:parity -- 00-base` → FAIL.

- [ ] **Step 3: Port each component** replacing the `<!-- TWIG: -->` block per R2. `Icon.astro`:

```astro
---
import { icons, type IconSymbol } from './icons';
interface Props { symbol?: IconSymbol | string | null; size?: string | null; class?: string; [key: string]: unknown }
const { symbol, size, class: className = '', ...rest } = Astro.props;
const svg = symbol ? (icons as Record<string, string>)[symbol] : undefined;
const classes = ['ct-icon', size && `ct-icon--size-${size}`, ...className.split(' ')].filter(Boolean).join(' ');
const attrs = Object.entries({ class: classes, 'aria-hidden': 'true', role: 'img', ...rest }).map(([k, v]) => `${k}="${String(v)}"`).join(' ');
const html = svg ? svg.replace('<svg ', `<svg ${attrs} `) : '';
---
{html && <Fragment set:html={html} />}
```
`Menu.astro` recurses by importing itself (`import Menu from './Menu.astro'`). Iterate until `npm run test:parity -- 00-base` is green.

- [ ] **Step 4: Commit**

```bash
npm run check && git add -A && git commit -m "feat(civictheme): port 00-base components with parity tests"
```

---

### Task 6: Port 01-atoms, part 1 (11)

**Files:** `src/civictheme/components/01-atoms/{Button,Checkbox,Chip,ContentLink,FieldDescription,FieldMessage,Fieldset,Heading,Iframe,Image,Input}.astro`; `tests/parity/01-atoms/*.parity.test.ts`; `PORTING.md` rows.

**Interfaces:** Consumes `Icon`. Produces atoms used by molecules: `Button` (`text`, `type` primary|secondary|tertiary, `kind` button|link|reset|submit, `size`, `icon`, `iconPlacement`, `isExternal`, `isNewWindow`, `isDisabled`, `url`, …), `Heading` (`content`, `level` 1–6, `display`), `Image` (`url`, `alt`, `width`, `height`, `loading`), `Input` (`type`, `name`, `value`, `id`, `isRequired`, `isDisabled`, `isInvalid`, …), `Checkbox`, `Chip`, `ContentLink`, `FieldDescription`, `FieldMessage`, `Fieldset`, `Iframe`.

- [ ] **Step 1:** `for c in button checkbox chip content-link field-description field-message fieldset heading iframe image input; do node scripts/twig-to-astro.mjs 01-atoms/$c; done`
- [ ] **Step 2:** parity tests per R3 for all 11 (every atom has a `.test.js`); run → FAIL.
- [ ] **Step 3:** port each per R2 until `npm run test:parity -- 01-atoms` (these 11) is green. Note: `Button` renders `<a>` when `kind === 'link'` else `<button>`; `Heading` uses a dynamic tag (`const Tag = \`h${level}\``); `Image` must not emit `alt` when undefined vs empty string — follow the snapshot.
- [ ] **Step 4:** `npm run check && git add -A && git commit -m "feat(civictheme): port 01-atoms part 1 (button…input) with parity tests"`

---

### Task 7: Port 01-atoms, part 2 (11)

**Files:** `src/civictheme/components/01-atoms/{Label,Link,Popover,Radio,Select,Table,Tag,Textarea,Textfield,Video}.astro` (+ `Paragraph` already done); `tests/parity/01-atoms/*.parity.test.ts`.

**Interfaces:** Produces `Link` (`text`, `url`, `title`, `isExternal`, `isNewWindow`, `isActive`, `isDisabled`, `iconPlacement`, `icon`, `iconGroupDisabled`, `iconSingleOnly`), `Tag` (`content`, `type`, `icon`, `iconPlacement`, `url`, `isNewWindow`), `Select` (`options: Array<{type?: 'option'|'optgroup', label, value, isSelected?, isDisabled?, options?}>`), `Table` (`header: string[]`, `rows: string[][]`, `footer`, `caption`, `isStriped`), `Radio`, `Label`, `Popover`, `Textarea`, `Textfield`, `Video` (`sources: Array<{url, type}>`, `poster`, `hasControls`).

- [ ] Steps 1–4 exactly as Task 6 for this list; commit `feat(civictheme): port 01-atoms part 2 (label…video) with parity tests`. After this task `npm run test:parity -- 01-atoms` must be fully green (22 atoms).

---

### Task 8: Port 02-molecules, part 1 (10)

**Files:** `src/civictheme/components/02-molecules/{Accordion,Attachment,BackToTop,BasicContent,Breadcrumb,Callout,EventCard,FastFactCard,Field,Figure}.astro`; parity tests.

**Interfaces:** Consumes atoms + base. Produces `Accordion` (`panels: Array<{title, content, expanded?}>`, `expandAll`, `withBackground`, `verticalSpacing`), `Attachment` (`title`, `content`, `files: Array<{url, name, ext, size, createdIso, created, icon?}>`, `theme`, `withBackground`, `verticalSpacing`), `Breadcrumb` (`links: Array<{text,url}>`, `activeIsLink`), `Callout` (`title`, `content`, `links: Array<{text,url,isNewWindow,isExternal}>`, `theme`, `verticalSpacing`), `EventCard` (`title`, `summary`, `image`, `date`, `dateIso`, `dateEnd`, `dateEndIso`, `location`, `link`, `tags`, `theme`), `FastFactCard`, `Field` (form field wrapper: `type`, `label`, `description`, `message`, `isInvalid`, `isRequired`, control props…), `Figure`, `BasicContent` (`content`, `theme`, `verticalSpacing`, `withBackground`, `isContained`), `BackToTop`.

- [ ] Steps as Task 6 with `for c in accordion attachment back-to-top basic-content breadcrumb callout event-card fast-fact-card field figure; do node scripts/twig-to-astro.mjs 02-molecules/$c; done`. Behaviour-driven molecules (Accordion uses `data-collapsible`; BackToTop uses `data-back-to-top`) must emit the same `data-*` attributes as upstream — the parity snapshots enforce this. Commit `feat(civictheme): port 02-molecules part 1 (accordion…figure) with parity tests`.

---

### Task 9: Port 02-molecules, part 2 (11)

**Files:** `src/civictheme/components/02-molecules/{GroupFilter,InlineFilter,Logo,Map,NavigationCard,NextStep,Pagination,PromoCard,PublicationCard,Search,ServiceCard}.astro`; parity tests.

**Interfaces:** Produces `PromoCard` (props per upstream header: `image {url,alt}`, `isTitleClick`, `date`, `dateIso`, `dateEnd`, `dateEndIso`, `link {url,isNewWindow,isExternal}`, `subtitle`, `tags: Array<{content,url,isNewWindow}>`, `title`, `summary`, slots `contentTop`, `imageOver`, `contentMiddle`, `contentBottom`), `PublicationCard`, `NavigationCard`, `ServiceCard` (`title`, `links`), `NextStep` (`title`, `content`, `link`, `theme`, `verticalSpacing`, `withBackground`), `Pagination` (`items: Array<{type: 'first'|'previous'|'page'|'ellipsis'|'next'|'last', href?, text?, isActive?}>`, `currentPage`, `heading`), `Logo` (`logos: { primary: { mobile: {url,alt}, desktop: {url,alt} }, secondary?… }`, `url`, `title`, `theme`), `Search` (`text`, `url`, `theme`), `Map` (`url`, `address`, `viewLink`), `GroupFilter`, `InlineFilter`.

- [ ] Steps as Task 6. Commit `feat(civictheme): port 02-molecules part 2 (group-filter…service-card) with parity tests`.

---

### Task 10: Port 02-molecules, part 3 (10)

**Files:** `src/civictheme/components/02-molecules/{SingleFilter,Snippet,SocialLinks,SubjectCard,TableOfContents,Tabs,TagList,Tooltip,VideoPlayer}.astro`; parity tests. (`basic-content` already done → 9 files here; list stays 31 total.)

**Interfaces:** Produces `Snippet` (`title`, `summary`, `link`, `tags`, `theme`), `SubjectCard` (`title`, `image`, `link`, `theme`), `SocialLinks` (`items: Array<{title, url, icon}>`, `withBorder`, `theme`), `TableOfContents` (`title`, `anchorSelector`, `scopeSelector`, `position` before|after|prepend|append, `theme`), `Tabs` (`panels: Array<{id, title, content}>`, `verticalSpacing`), `TagList` (`tags`, `theme`), `Tooltip`, `VideoPlayer` (`sources`, `embedUrl`, `poster`, `transcriptLink`, `width`, `height`), `SingleFilter`.

- [ ] Steps as Task 6. After this task `npm run test:parity -- 02-molecules` must be fully green (31 molecules). Commit `feat(civictheme): port 02-molecules part 3 (single-filter…video-player) with parity tests`.

---

### Task 11: Port 03-organisms, part 1 (9)

**Files:** `src/civictheme/components/03-organisms/{Alert,Banner,Campaign,Footer,Header,List,Message,MobileNavigation,MobileNavigationTrigger}.astro`; parity tests.

**Interfaces:** Produces `Banner` (all upstream props: `breadcrumb`, `siteSection`, `title`, `isDecorative`, `featuredImage`, `backgroundImage`, `backgroundImageBlendMode`, `theme`, slots `contentTop1..3`, `contentMiddle`, `contentBottom`, `content`), `Header` (theme, slots `contentTop1..3`, `contentMiddle1..3`, `contentBottom1`), `Footer` (theme, `backgroundImage`, slots `contentTop1..2`, `contentMiddle1..4`, `contentBottom1..2`), `Alert` (`id`, `type`, `title`, `description`, `theme`, `dismissible` → `data-alert*` attrs as upstream), `Message`, `Campaign` (`title`, `content`, `image`, `links`, `tags`, `date`, `theme`, `imagePosition`), `List` (`title`, `content`, `filters` slot, `results` slot, `pager` slot, `theme`, `verticalSpacing`, `withBackground`), `MobileNavigation` + `MobileNavigationTrigger` (+ `MobileNavigationClose`, `MobileNavigationMenu` sub-templates as separate files).

- [ ] Steps as Task 6 with the organism list (`mobile-navigation` has 4 twig files → 4 `.astro` files). Commit `feat(civictheme): port 03-organisms part 1 (alert…mobile-navigation) with parity tests`.

---

### Task 12: Port 03-organisms, part 2 (9) — completes the 91

**Files:** `src/civictheme/components/03-organisms/{Navigation,Promo,SideNavigation,SkipLink,Slide,Slider,Webform}.astro` (+ `MobileNavigationClose`, `MobileNavigationMenu` if not done in Task 11); parity tests.

**Interfaces:** Produces `Navigation` (`items` Menu items, `type` none|inline|dropdown|drawer, `dropdownColumns`, `dropdownColumnsFill`, `isAnimated`, `inDrawer`, `theme`), `SideNavigation` (`title`, `items`, `theme`), `Promo` (`title`, `content`, `link`, `theme`, `verticalSpacing`, `withBackground`), `Slider` + `Slide` (`slides` slot, `previousLabel`, `nextLabel`, `title`, `theme`, `withBackground`, `verticalSpacing`), `SkipLink` (`url`, `text`), `Webform` (`referencedWebform` html string, `theme`, `verticalSpacing`, `withBackground`).

- [ ] Steps as Task 6. After this task run the WHOLE parity suite: `npm run test:parity` → all green; count cases: `npx vitest run tests/parity --reporter=json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).numTotalTests))"` — expect ≈ 300 (upstream has 323 test cases; some are non-snapshot assertions). Record the number in `PORTING.md`. Commit `feat(civictheme): port 03-organisms part 2 (navigation…webform); all 91 components ported`.

---

### Task 13: JS behaviours init + behaviour smoke (Playwright)

**Files:**
- Create: `src/civictheme/js/civictheme.js`, `playwright.config.ts`, `tests/e2e/behaviours.spec.ts`, `src/pages/_dev/behaviours.astro` (a dev-only page under `src/pages/_dev/` — Astro ignores routes starting with `_`? No: Astro EXCLUDES files/dirs starting with `_` from routing. So instead create `src/pages/components/behaviours.astro` which is also the "Behaviours" components-section page.)

**Interfaces:** Produces `civictheme.js` (hoisted from `BaseLayout` in Task 15): imports `./behaviours/index.js`, and re-runs init on `astro:page-load`.

- [ ] **Step 1: init module**

Read three behaviour files to learn the init contract: upstream behaviours self-initialise on `DOMContentLoaded` via `document.querySelectorAll('[data-<x>]').forEach(el => new CivicTheme<X>(el))` (confirm in `.upstream/uikit/packages/twig/components/00-base/collapsible/collapsible.js` tail and `../../03-organisms/mobile-navigation/*.js`). Write:

```js
// src/civictheme/js/civictheme.js
// Loads the vendored CivicTheme behaviours once and re-runs their initialisers after
// Astro client-side navigation. Vendored files are never edited; shims live here.
import './behaviours/index.js';

function reinit() {
  // Behaviours attach on DOMContentLoaded; after an Astro page swap fire it again on the new document.
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: false }));
}
document.addEventListener('astro:page-load', reinit);
```
If a behaviour guards against double-init (they check `data-<x>="true"`), this is safe; if one does not, add a shim here (not upstream) and note it in `PORTING.md`.

- [ ] **Step 2: Behaviours page** `src/pages/components/behaviours.astro` renders, in a minimal `<html>` (BaseLayout arrives in Task 15; switch to it then): one `Accordion` with two panels, one `Tabs` with two panels, one `TableOfContents` above three `<h2 id>` sections, one `MobileNavigationTrigger` + `MobileNavigation`, one `BackToTop`; imports `@/styles/global.scss` and `<script src="@/civictheme/js/civictheme.js"></script>` (hoisted).

- [ ] **Step 3: Playwright**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run preview -- --port 4321', port: 4321, reuseExistingServer: true, timeout: 120_000 },
  use: { baseURL: 'http://localhost:4321' },
});
```
```ts
// tests/e2e/behaviours.spec.ts
import { test, expect } from '@playwright/test';
test.describe('CivicTheme behaviours', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/components/behaviours'); });
  test('accordion expands a panel', async ({ page }) => {
    const trigger = page.locator('[data-collapsible-trigger]').first();
    await trigger.click();
    await expect(page.locator('[data-collapsible]').first()).not.toHaveAttribute('data-collapsible-collapsed', '');
  });
  test('tabs switch panels', async ({ page }) => {
    const second = page.locator('.ct-tabs__tab').nth(1);
    await second.click();
    await expect(second).toHaveAttribute('aria-selected', 'true');
  });
  test('mobile navigation opens', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.locator('[data-flyout-open-trigger]').first().click();
    await expect(page.locator('[data-flyout]').first()).toHaveAttribute('data-flyout-expanded', '');
  });
  test('table of contents highlights on scroll', async ({ page }) => {
    await page.locator('#section-3').scrollIntoViewIfNeeded();
    await expect(page.locator('.ct-table-of-contents a.ct-link--active, [data-scrollspy] .active').first()).toBeVisible();
  });
});
```
The exact attribute names come from the vendored behaviours (`grep -o "data-[a-z-]*" src/civictheme/js/behaviours/*.js | sort -u`); adjust selectors to what the behaviours actually set, and document the final selectors in the spec file header comment.

```bash
npx playwright install chromium && npm run build && npm run test:e2e
```
Expected: 4 passed.

- [ ] **Step 4: Commit** `feat: CivicTheme behaviours init module and Playwright behaviour smoke`

---

### Task 14: Content collections, demo content, listings

**Files:**
- Create: `src/content.config.ts`; `src/content/pages/*.mdx` (placeholders replaced in Task 16); `src/content/events/*.mdx` (6); `src/content/news/*.mdx` (6); `src/content/publications/*.mdx` (4); `src/content/alerts/site-alert.json`; `src/content/navigation/{primary,secondary,footer}.json`; `src/content/settings/site.json`; `src/lib/content.ts`; `src/components/{ListingAuto,ManualList}.astro`; `tests/content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/lib/content.ts
  export type CardCollection = 'events' | 'news' | 'publications' | 'pages';
  export async function listPublished(collection: CardCollection, opts?: { topics?: string[]; limit?: number; sort?: 'date-desc' | 'date-asc' | 'title' }): Promise<CollectionEntry<CardCollection>[]>;
  export async function activeAlerts(now?: Date): Promise<CollectionEntry<'alerts'>[]>;
  export function menuTree(rows: Array<{ label: string; url: string; parent?: string }>): Array<{ title: string; url: string; below: any[] }>;
  export function entryUrl(collection: CardCollection, id: string): string;   // pages → '/' + id, others → `/${collection}/${id}`
  ```
  `ListingAuto.astro` props `{ collection: CardCollection; topics?: string[]; limit?: number; sort?; title?: string; theme? }` → `List` organism with the right card per collection (events→`EventCard`, news→`PromoCard`, publications→`PublicationCard`, pages→`NavigationCard`). `ManualList.astro` props `{ collection; slugs: string[]; title?; theme? }`.

- [ ] **Step 1: Schemas**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const theme = z.enum(['light', 'dark']).default('light');
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/pages' }),
  schema: z.object({
    title: z.string(), summary: z.string().default(''), theme,
    bannerType: z.enum(['default', 'large']).default('default'), bannerImage: z.string().optional(),
    bannerTheme: z.enum(['light', 'dark']).default('dark'), showBreadcrumb: z.boolean().default(true),
    showLastUpdated: z.boolean().default(false), topics: z.array(z.string()).default([]),
    section: z.string().optional(), draft: z.boolean().default(false), order: z.number().default(0),
    updated: z.coerce.date().optional(),
  }),
});
const events = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/events' }),
  schema: z.object({
    title: z.string(), summary: z.string().default(''), startDate: z.coerce.date(), endDate: z.coerce.date().optional(),
    location: z.string().optional(), image: z.string().optional(), topics: z.array(z.string()).default([]),
    theme, registrationUrl: z.string().optional(), draft: z.boolean().default(false),
  }),
});
const news = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/news' }),
  schema: z.object({
    title: z.string(), summary: z.string().default(''), date: z.coerce.date(), updated: z.coerce.date().optional(),
    author: z.string().default('Your organisation'), image: z.string().optional(), topics: z.array(z.string()).default([]),
    featured: z.boolean().default(false), draft: z.boolean().default(false),
  }),
});
const publications = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/publications' }),
  schema: z.object({
    title: z.string(), summary: z.string().default(''), date: z.coerce.date(), image: z.string().optional(),
    topics: z.array(z.string()).default([]), fileUrl: z.string(), fileFormat: z.enum(['pdf', 'docx', 'xlsx', 'other']).default('pdf'),
    fileSize: z.string().optional(), draft: z.boolean().default(false),
  }),
});
const alerts = defineCollection({
  loader: glob({ pattern: '**/*.json', base: 'src/content/alerts' }),
  schema: z.object({
    title: z.string(), message: z.string(), type: z.enum(['information', 'warning', 'error', 'success']).default('information'),
    startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), dismissible: z.boolean().default(true), active: z.boolean().default(true),
  }),
});
const navigation = defineCollection({
  loader: glob({ pattern: '*.json', base: 'src/content/navigation' }),
  schema: z.object({ items: z.array(z.object({ label: z.string(), url: z.string(), parent: z.string().optional() })) }),
});
const settings = defineCollection({
  loader: glob({ pattern: '*.json', base: 'src/content/settings' }),
  schema: z.object({
    name: z.string(), tagline: z.string().default(''), logoLight: z.string(), logoDark: z.string(),
    footerText: z.string().default(''), acknowledgement: z.string().default(''),
    social: z.array(z.object({ platform: z.string(), url: z.string() })).default([]), theme,
  }),
});
export const collections = { pages, events, news, publications, alerts, navigation, settings };
```
(Navigation and settings hold small object arrays in JSON files, not MDX frontmatter; Studio shows them as JSON, which is acceptable for structural data and is the trade-off chosen in the spec.)

- [ ] **Step 2: Failing content tests**

```ts
// tests/content.test.ts
import { describe, it, expect } from 'vitest';
import { menuTree, entryUrl } from '../src/lib/content';
describe('menuTree', () => {
  it('nests children under parents by label', () => {
    const tree = menuTree([{ label: 'About', url: '/about-us' }, { label: 'Team', url: '/about-us/team', parent: 'About' }]);
    expect(tree).toHaveLength(1);
    expect(tree[0].below[0].title).toBe('Team');
  });
});
describe('entryUrl', () => {
  it('maps pages to root and others to their collection', () => {
    expect(entryUrl('pages', 'about-us')).toBe('/about-us');
    expect(entryUrl('events', 'open-day')).toBe('/events/open-day');
  });
});
```
Plus a build-level check appended to `tests/build.test.ts`: after build, `dist/events.html`, `dist/news.html`, `dist/publications.html` exist and `dist/news.html` does not contain the title of the draft news article. Run → FAIL.

- [ ] **Step 3: Implement `src/lib/content.ts`, `ListingAuto.astro`, `ManualList.astro`, and sample content** — 6 events (3 future, 3 past), 6 news (one `draft: true`, one `featured: true`), 4 publications, 1 alert, menus (primary: Home, For individuals, For businesses, For government, About us, News and events, Contact us; secondary: Subscribe, Search; footer: About us, Contact us, Privacy, Accessibility), `site.json` with name "Your organisation", tagline "Your organisation's tagline", logos from `public/civictheme/logos/logo_primary_light_desktop.png` (light) and `logo_primary_dark_desktop.png` (dark). Sample MDX bodies use CivicTheme demo text; images from `public/civictheme/backgrounds/` until Task 16 adds demo images.

`ListingAuto.astro`:
```astro
---
import List from '@civictheme/organisms/List.astro';
import EventCard from '@civictheme/molecules/EventCard.astro';
import PromoCard from '@civictheme/molecules/PromoCard.astro';
import PublicationCard from '@civictheme/molecules/PublicationCard.astro';
import NavigationCard from '@civictheme/molecules/NavigationCard.astro';
import Grid from '@civictheme/base/Grid.astro';
import { listPublished, entryUrl, type CardCollection } from '@/lib/content';
interface Props { collection: CardCollection; topics?: string[]; limit?: number; sort?: 'date-desc' | 'date-asc' | 'title'; title?: string; theme?: 'light' | 'dark'; columns?: 2 | 3 | 4 }
const { collection, topics, limit, sort = 'date-desc', title, theme = 'light', columns = 3 } = Astro.props;
const entries = await listPublished(collection, { topics, limit, sort });
const fmt = (d?: Date) => d?.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
---
<List title={title} theme={theme}>
  <Fragment slot="results">
    <Grid>
      {entries.map((e: any) => {
        const url = entryUrl(collection, e.id);
        const col = `col-xxs-12 col-m-6 col-l-${12 / columns}`;
        if (collection === 'events') return <div class={col}><EventCard theme={theme} title={e.data.title} summary={e.data.summary} image={e.data.image ? { url: e.data.image, alt: '' } : undefined} date={fmt(e.data.startDate)} dateIso={e.data.startDate.toISOString()} dateEnd={fmt(e.data.endDate)} dateEndIso={e.data.endDate?.toISOString()} location={e.data.location} link={{ url }} tags={e.data.topics.map((t: string) => ({ content: t }))} /></div>;
        if (collection === 'publications') return <div class={col}><PublicationCard theme={theme} title={e.data.title} summary={e.data.summary} image={e.data.image ? { url: e.data.image, alt: '' } : undefined} link={{ url }} file={{ url: e.data.fileUrl, ext: e.data.fileFormat, size: e.data.fileSize }} /></div>;
        if (collection === 'pages') return <div class={col}><NavigationCard theme={theme} title={e.data.title} summary={e.data.summary} link={{ url }} /></div>;
        return <div class={col}><PromoCard theme={theme} title={e.data.title} summary={e.data.summary} image={e.data.image ? { url: e.data.image, alt: '' } : undefined} date={fmt(e.data.date)} dateIso={e.data.date.toISOString()} link={{ url }} tags={e.data.topics.map((t: string) => ({ content: t }))} /></div>;
      })}
    </Grid>
  </Fragment>
</List>
```
(Prop names must match the ported card components from Tasks 8–9; adjust to their `Props`.)

- [ ] **Step 4:** `npx vitest run tests/content.test.ts` → PASS; `npm run build` OK. Commit `feat: content collections, sample content, ListingAuto and ManualList`.

---

### Task 15: Layouts, routes, OG images, 404, search, header/footer compositions

**Files:**
- Create: `src/layouts/{BaseLayout,PageLayout,DetailLayout}.astro`; `src/components/{SiteHeader,SiteFooter,SiteAlerts,PageBanner,MdxComponents}.astro|ts`; `src/pages/{[...slug].astro, events/index.astro, events/[slug].astro, news/index.astro, news/[slug].astro, publications/index.astro, publications/[slug].astro, search.astro, 404.astro, og/[...slug].png.ts}`; update `src/pages/index.astro` to render the `pages` entry with id `index` (home).

**Interfaces:**
- `BaseLayout` props `{ title; description?; image?; theme? }`: `<html lang="en">`, head (charset, viewport, title, description, canonical, OG tags pointing at `/og/<slug>.png`, Google Fonts preconnect), `<body class="ct-theme-<theme>">`, `SkipLink`, `SiteAlerts` (active alerts → `Alert`), `SiteHeader` (`Header` organism: `Logo` in `contentMiddle1`, `Navigation` primary in `contentMiddle3`, secondary `Navigation` + `Search` in `contentTop2/3`, `MobileNavigationTrigger`), `<main id="main-content">` slot, `SiteFooter` (`Footer` organism: logo, footer menu via `Navigation`, `SocialLinks`, acknowledgement, copyright), `BackToTop`, hoisted `<script src="@/civictheme/js/civictheme.js">`, `import '@/styles/global.scss'`.
- `PageLayout` props `{ entry: CollectionEntry<'pages'> }`: `PageBanner` (`Banner` organism with `Breadcrumb` from the folder path, `bannerType` → `class="ct-banner--large"`, `bannerImage` → `backgroundImage`, `bannerTheme`), optional `SideNavigation` when `section` set (built from `pages` in that section), `<slot />` for MDX content, last-updated `Paragraph` when `showLastUpdated`.
- `DetailLayout` props `{ collection; entry }`: `Banner` with title + date/location tags, `TagList` of topics, `<slot />`, `Attachment` for publications.
- `MdxComponents.ts`: `export const components = { Promo, Callout, NextStep, Accordion, Tabs, Campaign, Slider, Slide, ManualList, ListingAuto, BasicContent, Attachment, Figure, Table, Iframe, Map, VideoPlayer, Webform, Grid, Heading, Paragraph, Button, Link }` — passed to `<Content components={components} />` so MDX pages use bare tags without imports.
- `og/[...slug].png.ts`: copy from `/Users/stuart/apps/quant-templates/ssg-astro-studio/src/pages/og/[...slug].png.ts`, replace the `slug` import with `entryUrl`, enumerate all five MDX collections plus `home`, switch the font to Lexend 700 (same Google Fonts fetch pattern), and colours to CivicTheme brand1 `#00698f` on `#e6e9eb`.

- [ ] **Step 1:** write layouts, compositions and routes; `[...slug].astro` uses `getStaticPaths` over `pages` (skip drafts; id `index` → `/`), renders `<Content components={components} />` inside `PageLayout`. Listing pages use `ListingAuto` with `Pagination` (10 per page via `paginate()` if entries > 10, else none).
- [ ] **Step 2:** move `src/pages/components/behaviours.astro` onto `BaseLayout`.
- [ ] **Step 3:** extend `tests/build.test.ts`: `dist/404.html`, `dist/search.html`, `dist/og/home.png` exist; `dist/index.html` contains `class="ct-header`, `ct-footer`, `ct-banner`. Run `npm run build && npx vitest run tests/build.test.ts` → PASS. `npm run test:e2e` still green.
- [ ] **Step 4:** Commit `feat: layouts, site header/footer, routes, OG images, 404 and search`.

---

### Task 16: The ten CivicTheme demo pages + demo images

**Files:** `src/content/pages/{index,about-us,contact-us,individuals,businesses,government,community-engagement,news-and-events,subscribe,civictheme-60-second-series}.mdx`; `public/images/demo/*` (copied from `.upstream/uikit/packages/twig/assets/backgrounds` and the CivicTheme content module demo images at `/private/tmp/…/scratchpad/monorepo-drupal/web/modules/custom/civictheme_content/modules/civictheme_content_default/content/file/*.{jpg,png}` if still present, else from the uikit `assets`); `README.md` (content-model section).

**Source of truth:** the Drupal default content set (`civictheme_content_default/content/node/*.yml`, `paragraph` entities embedded under `field_c_n_components`). Extracted structure (title | alias | banner | paragraph sequence):

| Page | Alias | Banner | Paragraphs (in order) |
|---|---|---|---|
| Your organisation's tagline (home) | `/` | large | content, manual_list (promo_card ×N) |
| For individuals | `/individuals` | default | content |
| For businesses | `/businesses` | default | manual_list (navigation_card ×3) |
| For government | `/government` | default | automated_list, manual_list (subject_card ×4), callout |
| About us | `/about-us` | default | content, content |
| Contact us | `/contact-us` | default | content, webform |
| Community Engagement | `/community-engagement` | default | content |
| News and events | `/news-and-events` | default | automated_list |
| Subscribe | `/subscribe` | default | content, webform |
| CivicTheme in 60 seconds series | `/civictheme-60-second-series` | default | content |

- [ ] **Step 1:** for each page, read the node YAML (`grep -n "field_c_p_" <file>` shows the paragraph field values: `field_c_p_content` bodies, `field_c_p_title`, `field_c_p_summary`, `field_c_p_link`, `field_c_p_list_*`), and write the MDX with matching frontmatter (`bannerType`, `bannerTheme`, `showLastUpdated`, `topics`) and body: `content` → the HTML converted to Markdown/MDX; `manual_list` of cards → `<ManualList>` or explicit `<Grid>` of the card components; `automated_list` → `<ListingAuto collection="news" …/>` + `<ListingAuto collection="events" …/>`; `callout` → `<Callout>`; `webform` → a `<Webform>` with a static HTML form (name, email, message; `action="#"`) since there is no backend.
- [ ] **Step 2:** copy demo images, replace placeholder images in events/news/publications frontmatter with them.
- [ ] **Step 3:** `npm run build`; extend `tests/build.test.ts` to assert all ten HTML files exist (`dist/index.html`, `dist/about-us.html`, …) and that `dist/government.html` contains `ct-callout`. → PASS. Commit `feat: port the ten CivicTheme demo pages and demo images`.

---

### Task 17: Components reference section

**Files:** `src/pages/components/index.astro` + one page per family: `banners.astro, promo.astro, campaign.astro, callout.astro, next-step.astro, cards.astro, lists.astro, slider.astro, accordion.astro, tabs.astro, table.astro, forms.astro, navigation.astro, footer.astro, alerts.astro, base.astro` (+ existing `behaviours.astro`); `tests/build.test.ts` additions.

- [ ] **Step 1:** for each family page, render every documented variant using props from the upstream story data (`.upstream/uikit/packages/twig/components/<layer>/<name>/<name>.stories.data.js` where present; otherwise the `.stories.js` args) in both `light` and `dark` theme, each variant preceded by a `Heading` with the variant name and a `<pre class="ct-code">` showing the MDX/Astro tag with its props (so editors can copy it). `components/index.astro` links all family pages.
- [ ] **Step 2:** build test: every family page exists in `dist/components/` and `dist/components/cards.html` contains `ct-promo-card`, `ct-event-card`, `ct-publication-card`, `ct-navigation-card`, `ct-service-card`, `ct-subject-card`, `ct-snippet`, `ct-fast-fact-card`. → PASS.
- [ ] **Step 3:** Definition-of-done audit: `for f in src/civictheme/components/*/*.astro; do n=$(basename $f .astro); grep -rl "$n" src/pages/components >/dev/null || echo "NOT ON A COMPONENTS PAGE: $n"; done` → no output (Icon/Menu/etc. appear via the base page).
- [ ] **Step 4:** Commit `feat: components reference section with every variant in light and dark`.

---

### Task 18: Accessibility pass

**Files:** `tests/e2e/a11y.spec.ts`; component/page fixes as needed; `PORTING.md` rows for any upstream-inherited violation.

- [ ] **Step 1:**
```ts
// tests/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const pages = ['/', '/about-us', '/contact-us', '/individuals', '/businesses', '/government', '/community-engagement', '/news-and-events', '/subscribe', '/civictheme-60-second-series',
  '/components/', '/components/banners', '/components/cards', '/components/forms', '/components/navigation', '/components/lists', '/components/base'];
for (const path of pages) {
  test(`no serious/critical axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad, JSON.stringify(bad.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.help })), null, 2)).toEqual([]);
  });
}
```
- [ ] **Step 2:** `npm run build && npm run test:e2e`. Fix template-level issues (missing alt text in demo content, heading order in reference pages, duplicate ids from repeated variants — suffix ids per variant). A violation that comes from upstream markup is NOT fixed in the component (fidelity); it is recorded in `PORTING.md` with the axe rule id and the affected variant is rendered with the fix applied at the call site if possible.
- [ ] **Step 3:** Commit `test: axe accessibility pass over demo and reference pages`.

---

### Task 19: README, PORTING summary, screenshot placeholder, final checks

**Files:** `README.md`, `PORTING.md`, `quant/screenshot.png` (Playwright full-page capture of `/`, 1280×800).

- [ ] **Step 1:** README sections: Quick start; What's inside (components count, collections); Content model (table from Task 14 with field names); Writing pages in MDX (available tags = `MdxComponents.ts` keys, one example each for `Promo`, `Callout`, `ListingAuto`); Theming (`variables.base.scss` rule about full brand maps, `variables.components.scss`, `global.scss` overrides, light/dark per component); Updating CivicTheme (`npm run vendor -- <checkout>`, then `npm run test:parity` shows drift; `.astro` components are hand-maintained); Testing (`npm test`, `npm run test:e2e`); Deploying to QuantCDN (vars/secrets, same text as sibling README); Editing with Quant Studio; Licence (GPL-2.0-or-later, NOTICE).
- [ ] **Step 2:** screenshot: `npx playwright screenshot --viewport-size=1280,800 --full-page http://localhost:4321/ quant/screenshot.png` (with `npm run preview` running).
- [ ] **Step 3:** `npm run check && npm test && npm run build && npm run test:e2e` all green. Commit `docs: README, porting notes, screenshot`.

---

### Task 20: Studio gate (browser verification) and merge readiness

**Prerequisite:** local portal running (`http://localhost:8001`), quant-runtime `develop` ≥ 34591bf vendored into portal (already done 2026-09-07), builder container restarted.

- [ ] **Step 1:** Create a Studio project from this repository (Studio → create from GitHub or from template pointing at the local checkout; if Studio needs a GitHub repo, push `feat/template-build` to a scratch repo first and record its URL in the report).
- [ ] **Step 2:** Follow `/Users/stuart/.claude/skills/studio-publish-verify/SKILL.md`. Evidence to capture: (a) `/about-us` renders in the preview with CivicTheme styling (screenshot); (b) click-to-edit on `bannerType` shows an enum dropdown and switching to `large` re-renders; (c) editing `src/civictheme/variables.base.scss` brand1 to `#123456` recolours the preview without a full reload; (d) in-browser `StudioBuilder` build completes with zero errors; (e) full publish to a stage project succeeds and `curl` of the published stylesheet contains `.ct-button` and `--ct-color-light-brand1`.
- [ ] **Step 3:** Record evidence in `docs/superpowers/verification/2026-09-XX-studio-gate.md` (screenshots under the same folder). Any runtime bug found goes to quant-runtime as a follow-up issue, not fixed here.
- [ ] **Step 4:** Commit `docs: Studio gate evidence`. Then hand off with superpowers:finishing-a-development-branch (merge `feat/template-build` → `main`). Publishing steps for Stuart (NOT run): create `quantcdn-templates/ssg-astro-studio-civictheme`, push `main`, register in the portal template seed.

---

## Self-review notes

- **Spec coverage.** §1 layout/licence → T1, T2; §2 port + harness → T3–T12, T4 converter; §3 styles/theming → T2; §4 content model → T14; §5 demo site → T14–T17; §6 Studio/deploy → T1 (workflows/meta), T20 (gate), T19 (README publish steps); §7 testing → T2/T14/T15/T16/T17 (build tests), T3–T12 (parity), T13 (behaviours), T18 (a11y), T20 (Studio gate). Risks: `PORTING.md` maintained from T3 onward.
- **Placeholders.** Port tasks 6–12 give component lists, upstream file locations, prop contracts and the exact loop (R2/R3) rather than 91 full component bodies; the parity harness is the executable definition of done, which is the plan's deliberate substitute for inlining ~9,000 lines of upstream-derived markup. T16 lists the extracted page structures; T17 names the story-data source for variants.
- **Type consistency.** `parityCase(meta, key, Component, props, slots)` (T3) is what R3/R4 shorthand refers to; `renderNormalised`, `normaliseHtml`, `upstreamSnapshot` names match. `listPublished`, `entryUrl`, `menuTree`, `activeAlerts` (T14) are consumed by T15 with the same signatures. `icons`/`IconSymbol` (T2) consumed by `Icon.astro` (T5). Alias names in T1 match R1.
