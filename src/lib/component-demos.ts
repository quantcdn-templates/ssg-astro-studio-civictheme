/**
 * Loads the captured upstream Storybook story fixtures
 * (`tests/story-parity/fixtures/args/**\/*.json`, shared-reference R2/the
 * story-parity oracle — see `tests/story-parity/story-parity.test.ts`) for
 * the `/components/*` reference pages (Task 17).
 *
 * Loading strategy: `import.meta.glob` reads the fixtures directly from
 * `tests/story-parity/fixtures/args/` at BUILD time (Vite resolves the glob
 * against the project root, not just `src/`, and this repo's own
 * `story-parity.test.ts` already globs `.astro` components the same way in
 * reverse). No copy step is used — Task 17's file allowlist permits only
 * `src/pages/components/**`, `src/components/ComponentDemo*.astro`,
 * `src/lib/component-demos.ts` and `astro.config.mjs`, so writing a mirrored
 * `src/data/component-demos/` tree (the brief's fallback if Studio's runtime
 * cannot glob outside `src/`) is out of scope for this task; see the task-17
 * report's Concerns section.
 *
 * The snake_case→camelCase prop mapping is NOT duplicated here: it is
 * imported from `tests/story-parity/args-to-props.ts`, which already
 * exports it for this exact purpose (shared-reference R2, applied
 * recursively).
 */
import { argsToProps } from '../../tests/story-parity/args-to-props';

/** One captured Storybook story, as written by `scripts/capture-upstream-stories.mjs`. */
export interface StoryFixture {
  /** Fixture file path relative to `fixtures/args/`, without extension — e.g. `03-organisms/banner/Banner`. */
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

const rawModules = import.meta.glob<{ default: Omit<StoryFixture, 'key'> }>(
  '/tests/story-parity/fixtures/args/**/*.json',
  { eager: true }
);

const ALL_FIXTURES: StoryFixture[] = Object.entries(rawModules)
  .map(([path, mod]) => {
    const key = path.replace('/tests/story-parity/fixtures/args/', '').replace(/\.json$/, '');
    return { ...mod.default, key };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

if (ALL_FIXTURES.length === 0) {
  throw new Error('component-demos: no story fixtures found under tests/story-parity/fixtures/args');
}

/** Every captured story for one component (`<layer>/<name>`), in fixture-file order. */
export function storiesFor(component: string): StoryFixture[] {
  return ALL_FIXTURES.filter((fixture) => fixture.component === component);
}

/** The story's args, mapped to camelCase Astro props (shared-reference R2). */
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
