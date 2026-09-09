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
 * step 6). `rewriteDemoPath` rewrites a `./demo/*` reference anywhere in a
 * string to `/civictheme/demo/*`, so the rendered component's
 * `<img>`/`<video>` `src` resolves against this site instead of 404ing.
 *
 * Per-instance id uniqueness (post-review fix): several stories' pre-rendered
 * HTML-string props (a "wrapper-only" story per `SOURCE.md` — e.g. `Header`'s
 * `content_middle3`, which embeds a full `MobileNavigationTrigger` +
 * `MobileNavigation` pair) and several plain scalar props (`Textarea`'s
 * `id: 'textarea-id'`, reused verbatim across its light/dark stories and
 * even across sibling components) carry ids/`href="#…"` fragments that are
 * NOT unique per rendered demo instance. Two problems follow:
 * - `MobileNavigationTrigger` hardcodes `data-flyout-target=".ct-mobile-navigation"`
 *   (a CLASS selector) and `flyout.js` binds only the FIRST element on the
 *   page matching a given target, so every embedded trigger after the first
 *   (the real site header's, and every other Header-family story after it)
 *   opens the same one panel — the others are dead.
 * - Two demo instances sharing a literal `id` is invalid HTML and breaks any
 *   same-page `for`/`aria-controls`/`href="#…"` reference between them.
 *
 * `propsFor` fixes both, driven by `suffix = "<exportName>-<theme>"` (unique
 * per fixture): `isolateFlyoutTarget` rewrites an embedded
 * `data-flyout-target=".ct-mobile-navigation"` to a per-instance `#id`
 * selector and gives the matching panel `<div class="ct-mobile-navigation…">`
 * that same id; `suffixIdsInHtml` appends the suffix to every
 * `id`/`for`/`aria-controls`/`aria-labelledby`/`aria-describedby`/
 * `data-tabs-tab`/`data-tabs-panel` attribute value and `href="#…"` fragment
 * found anywhere in a string prop (recursively — covers both a pre-rendered
 * HTML blob and a plain scalar value); `suffixIdLikeProp` does the same for
 * a STRUCTURED prop keyed literally `id`/`for`/`ariaControls`/
 * `ariaLabelledby`/`ariaDescribedby`/`href`/`url`. Every reference sharing
 * the same original value still shares the same suffixed value, so
 * same-blob id/label relationships stay intact.
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
 * Fixes a `ct-theme-*` class mismatch inside a pre-rendered HTML-string prop
 * (a11y pass, Task 18): the upstream `TableOfContentsAutomatic--dark` story
 * hardcodes its `content` blob's wrapper as `class="ct-basic-content
 * ct-theme-light …"` even though the story itself is `theme: dark` —
 * verbatim upstream fixture data, not something this port introduced (see
 * PORTING.md). That mismatch puts CivicTheme's light-theme text colours on
 * this project's dark demo-stage background, which fails axe's
 * `color-contrast` check. Every captured fixture only ever nests ONE
 * embedded `ct-theme-*` block matching the OUTER story's own theme, so a
 * plain token swap on the whole string is safe.
 */
function syncEmbeddedTheme(value: string, theme: string): string {
  if (theme === 'dark') return value.replace(/\bct-theme-light\b/g, 'ct-theme-dark');
  if (theme === 'light') return value.replace(/\bct-theme-dark\b/g, 'ct-theme-light');
  return value;
}

/**
 * Strips `href="…"` from any `<a>` carrying `ct-link--disabled` inside a
 * pre-rendered HTML-string prop (a11y pass, Task 18 follow-up): upstream's
 * captured `List` stories embed a raw `pagination` HTML blob (`List.astro`'s
 * `pagination` prop, `set:html`) whose disabled Prev link still carries
 * `href="http://example.com"` — `pagination.twig` always prints
 * `items.previous.href` regardless of `is_disabled` (see PORTING.md), and
 * this story's own fixture supplies one even on page 1. A disabled link
 * that is still a working link is not "inactive" for the WCAG 1.4.3
 * exemption `tests/e2e/a11y.spec.ts` relies on for `.ct-link--disabled`, so
 * this is fixed here rather than left for that exemption to (wrongly)
 * cover it. Only touches `<a>` tags that already carry the disabled class —
 * every other link's `href` is untouched.
 */
function stripDisabledLinkHref(value: string): string {
  if (!value.includes('ct-link--disabled')) return value;
  return value.replace(/(<a\b[^>]*\bct-link--disabled\b[^>]*?)\s+href="[^"]*"/g, '$1');
}

/**
 * Rewrites an embedded `MobileNavigationTrigger`'s hardcoded
 * `data-flyout-target=".ct-mobile-navigation"` (a class selector matching
 * ANY `.ct-mobile-navigation` panel on the page — see this file's header
 * comment) to a per-instance id selector, and gives the matching embedded
 * `MobileNavigation` panel that same id, so each demo instance's trigger
 * only ever opens its own panel.
 */
function isolateFlyoutTarget(html: string, suffix: string): string {
  if (!html.includes('data-flyout-target=".ct-mobile-navigation"')) return html;
  const id = `components-mobile-nav-${suffix}`;
  return html
    .replace(/data-flyout-target="\.ct-mobile-navigation"/g, `data-flyout-target="#${id}"`)
    .replace(/<div class="ct-mobile-navigation(?=["\s])/g, `<div id="${id}" class="ct-mobile-navigation`);
}

/**
 * Whether a camelCase Astro prop key is an id-like reference, suffixed by
 * `suffixIdLikeProp` — `id`, `for`, `ariaControls`/`ariaLabelledby`/
 * `ariaDescribedby`, and any key ending `…Id` (`headingId`,
 * `itemsPerPageId` — Twig's own `*_id` convention, e.g. `Pagination`'s
 * `heading_id`/`items_per_page_id`).
 */
function isIdLikeKey(key: string): boolean {
  return key === 'id' || key === 'for' || key.endsWith('Id') || /^aria(Controls|Labelledby|Describedby)$/.test(key);
}

const ID_LIKE_HTML_ATTR =
  /\b(id|for|aria-controls|aria-labelledby|aria-describedby|data-tabs-tab|data-tabs-panel)="([^"]+)"/g;
const HREF_FRAGMENT = /href="#([^"]+)"/g;

/** One or more whitespace-separated id tokens, each suffixed (an `aria-labelledby` can reference several ids). */
function suffixIdTokens(value: string, suffix: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `${token}-${suffix}`)
    .join(' ');
}

/**
 * Appends `suffix` to every id-like attribute value and `href="#…"`
 * fragment found anywhere in a string — covers a pre-rendered HTML blob
 * (e.g. `Header`'s `content_middle3`) as well as a plain scalar value that
 * happens to look like a bare id (`suffixIdTokens` on a value with no
 * whitespace is a no-op change other than the suffix, so this is also safe
 * to run unconditionally on every string).
 */
function suffixIdsInHtml(html: string, suffix: string): string {
  return html
    .replace(ID_LIKE_HTML_ATTR, (_match, attr: string, value: string) => `${attr}="${suffixIdTokens(value, suffix)}"`)
    .replace(HREF_FRAGMENT, (_match, value: string) => `href="#${suffixIdTokens(value, suffix)}"`);
}

/** Suffixes a STRUCTURED prop's value when its key is an id-like reference (`id`, `for`, `ariaControls`, a `#…` `href`/`url`). */
function suffixIdLikeProp(key: string, value: string, suffix: string): string {
  if (isIdLikeKey(key)) return suffixIdTokens(value, suffix);
  if ((key === 'href' || key === 'url') && value.startsWith('#') && value.length > 1) {
    return `#${suffixIdTokens(value.slice(1), suffix)}`;
  }
  return value;
}

/**
 * Maps a story's snake_case Twig args onto Astro props, per shared-reference
 * R2, applied RECURSIVELY (a nested object such as `message` or a `control`
 * item is itself a set of Twig props for a child component, so it obeys the
 * same rules), rewrites `./demo/*` asset paths to their vendored
 * `/civictheme/demo/*` site path, isolates any embedded mobile-navigation
 * flyout target, and suffixes every id-like value with `suffix` so two demo
 * instances on the same page never collide:
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
export function argsToProps(
  args: Record<string, unknown>,
  suffix: string,
  theme: string = 'light'
): Record<string, unknown> {
  const convert = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return suffixIdsInHtml(
        stripDisabledLinkHref(syncEmbeddedTheme(isolateFlyoutTarget(rewriteDemoPath(value), suffix), theme)),
        suffix
      );
    }
    if (Array.isArray(value)) return value.map(convert);
    if (value && typeof value === 'object') return argsToProps(value as Record<string, unknown>, suffix, theme);
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
    const finalKey = key === 'modifier_class' ? 'class' : camelCase(key);
    const converted = convert(value);
    props[finalKey] = typeof converted === 'string' ? suffixIdLikeProp(finalKey, converted, suffix) : converted;
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
  throw new Error('component-demos: no story fixtures found under src/data/component-demos — run `npm run demos:sync`');
}

/** Every captured story for one component (`<layer>/<name>`), in fixture-file order. */
export function storiesFor(component: string): StoryFixture[] {
  return ALL_FIXTURES.filter((fixture) => fixture.component === component);
}

/**
 * The story's args, mapped to camelCase Astro props (shared-reference R2),
 * with demo asset paths rewritten and every id-like value suffixed by this
 * fixture's `<exportName>-<theme>` so it never collides with another demo
 * instance on the same page (see this file's header comment).
 */
export function propsFor(fixture: StoryFixture): Record<string, unknown> {
  return argsToProps(fixture.args, `${fixture.exportName}-${fixture.theme ?? 'light'}`, fixture.theme ?? 'light');
}

/** `03-organisms/promo-card` → `PromoCard` — the Astro/MDX tag name for a component path. */
export function componentTagName(component: string): string {
  const name = component.split('/')[1] ?? component;
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
