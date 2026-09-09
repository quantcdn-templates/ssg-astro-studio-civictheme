/**
 * Loads the captured upstream Storybook story fixtures for the
 * `/components/*` reference pages (Task 17).
 *
 * Loading strategy: `import.meta.glob('/src/data/component-demos/**\/*.json')`
 * reads a COPY of the fixtures that lives under `src/`, not the fixtures
 * themselves (`tests/story-parity/fixtures/args/**\/*.json`). The Quant
 * Studio runtime mounts the project file tree by extension allowlist but
 * must not depend on `tests/`, so a build-time page can't glob `tests/`
 * directly (this is the fix for the concern raised in the Task 17 report —
 * the original version of this file globbed `tests/` and that was flagged
 * as a Studio-compilability risk).
 *
 * `scripts/sync-component-demos.mjs` (run via `npm run demos:sync`, and as
 * part of `npm run vendor`) copies `tests/story-parity/fixtures/args/**` to
 * `src/data/component-demos/**` verbatim, same `<layer>/<name>/<Story>.json`
 * layout. `tests/component-demos.test.ts` asserts the two trees are in sync
 * (same file set, same content) so a forgotten re-sync after re-capturing
 * upstream stories fails CI instead of silently serving stale demo data.
 *
 * The snake_case→camelCase prop mapping (shared-reference R2) is copied
 * from `tests/story-parity/args-to-props.ts` rather than imported from it,
 * for the same reason as the fixtures themselves: this file must not
 * depend on anything under `tests/`. Keep the two copies in sync by hand if
 * shared-reference R2's mapping rules change.
 *
 * Demo asset paths: several fixture args carry upstream-Storybook-relative
 * image/video URLs (`./demo/images/demo1.jpg`, `./demo/videos/demo.mp4`),
 * which `scripts/vendor-civictheme.mjs` vendors into `public/civictheme/demo/`
 * (only the files these fixtures actually reference — see that script's
 * step 6). `rewriteDemoPaths` walks every prop value recursively and
 * rewrites a string starting with `./demo/` (or `demo/`) to
 * `/civictheme/demo/`, so the rendered component's `<img>`/`<video>` `src`
 * resolves against this site instead of 404ing.
 */

/** Shared-reference R2: snake_case Twig arg key → camelCase Astro prop key. */
function camelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

/**
 * Parses a Twig `attributes` value that a story passes as a RAW ATTRIBUTE
 * STRING (e.g. `id="field_id_822--error-message"`, the shape a Drupal
 * `Attribute` object prints as) into the prop object shared-reference R2
 * asks for: `attributes` → rest props spread onto the element.
 *
 * Limitation: only DOUBLE-quoted values and bare attributes are recognised.
 * Every captured story uses double quotes (Drupal's `Attribute` always
 * prints them).
 */
function parseAttributeString(value: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const match of value.matchAll(/([a-zA-Z_:][-\w:.]*)\s*=\s*"([^"]*)"|([a-zA-Z_:][-\w:.]*)/g)) {
    if (match[1] !== undefined) props[match[1]] = match[2];
    else if (match[3] !== undefined) props[match[3]] = '';
  }
  return props;
}

/**
 * Rewrites every Storybook-relative demo asset reference in a string to its
 * vendored site path — `./demo/images/demo1.jpg` → `/civictheme/demo/images/demo1.jpg`.
 * Applied to the WHOLE string, not just when the string is itself a bare
 * path: several props (e.g. `Slider`'s `slides`) are large pre-rendered HTML
 * blobs with an asset URL embedded mid-string (`src="./demo/images/…"`).
 */
function rewriteDemoPath(value: string): string {
  return value.replace(/\.?\/?demo\/(images|videos)\//g, '/civictheme/demo/$1/');
}

/**
 * Maps a story's snake_case Twig args onto Astro props, per shared-reference
 * R2, applied RECURSIVELY (a nested object such as `message` or a `control`
 * item is itself a set of Twig props for a child component, so it obeys the
 * same rules), and rewrites `./demo/*` asset paths to their vendored
 * `/civictheme/demo/*` site path:
 * - `modifier_class` → `class`
 * - `attributes` → rest props merged into the SAME object (a `null` value
 *   contributes nothing; a raw attribute string is parsed by
 *   `parseAttributeString`)
 * - every other key → camelCase
 * - `theme` keeps its story value; the components default it to `'light'`
 *
 * A `*_attributes` arg whose value is `null` is dropped rather than passed
 * as `undefined`: these are Twig `create_attribute()` placeholders, and
 * every captured story leaves them empty.
 */
export function argsToProps(args: Record<string, unknown>): Record<string, unknown> {
  const convert = (value: unknown): unknown => {
    if (typeof value === 'string') return rewriteDemoPath(value);
    if (Array.isArray(value)) return value.map(convert);
    if (value && typeof value === 'object') return argsToProps(value as Record<string, unknown>);
    return value;
  };

  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (key === 'attributes') {
      if (typeof value === 'string') Object.assign(props, parseAttributeString(value));
      else if (value && typeof value === 'object') Object.assign(props, convert(value));
      continue;
    }
    if (value === null && key.endsWith('attributes')) continue;
    props[key === 'modifier_class' ? 'class' : camelCase(key)] = convert(value);
  }
  return props;
}

/** One captured Storybook story, as written by `scripts/capture-upstream-stories.mjs`. */
export interface StoryFixture {
  /** Fixture file path relative to `component-demos/`, without extension — e.g. `03-organisms/banner/Banner`. */
  key: string;
  storyId: string;
  title: string;
  name: string;
  exportName: string;
  /** `<layer>/<name>` — e.g. `03-organisms/banner`. */
  component: string;
  theme: string | null;
  args: Record<string, unknown>;
}

const rawModules = import.meta.glob<{ default: Omit<StoryFixture, 'key'> }>('/src/data/component-demos/**/*.json', {
  eager: true,
});

const ALL_FIXTURES: StoryFixture[] = Object.entries(rawModules)
  .map(([path, mod]) => {
    const key = path.replace('/src/data/component-demos/', '').replace(/\.json$/, '');
    return { ...mod.default, key };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

if (ALL_FIXTURES.length === 0) {
  throw new Error(
    'component-demos: no story fixtures found under src/data/component-demos — run `npm run demos:sync`'
  );
}

/** Every captured story for one component (`<layer>/<name>`), in fixture-file order. */
export function storiesFor(component: string): StoryFixture[] {
  return ALL_FIXTURES.filter((fixture) => fixture.component === component);
}

/** The story's args, mapped to camelCase Astro props (shared-reference R2), with demo asset paths rewritten. */
export function propsFor(fixture: StoryFixture): Record<string, unknown> {
  return argsToProps(fixture.args);
}

/** `03-organisms/promo-card` → `PromoCard` — the Astro/MDX tag name for a component path. */
export function componentTagName(component: string): string {
  const name = component.split('/')[1] ?? component;
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
