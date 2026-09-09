/**
 * Story parity: renders every ported Astro component with the exact args the
 * upstream Storybook story used, and compares the markup with the HTML the
 * upstream story actually rendered.
 *
 * Oracle: `tests/story-parity/fixtures/` (see `fixtures/SOURCE.md`), captured
 * once from the pinned upstream Storybook by
 * `scripts/capture-upstream-stories.mjs`.
 *
 * This is a SECOND oracle, complementing `tests/parity/` (upstream Jest
 * snapshots). The snapshot suite proves fidelity for the prop combinations
 * upstream's unit tests use; the stories carry the complete documented
 * argument sets for every variant.
 *
 * Every story either matches, or has an entry in `accepted-differences.json`
 * giving a reason and the `PORTING.md` row that documents it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { normaliseHtml, renderComponent } from '../parity/harness';
import { argsToProps } from './args-to-props';
import accepted from './accepted-differences.json';

const FIXTURES = join(process.cwd(), 'tests/story-parity/fixtures');

interface Fixture {
  storyId: string;
  title: string;
  name: string;
  exportName: string;
  component: string;
  importPath: string;
  theme: string | null;
  layout: string | null;
  background: string | null;
  argsOverride: string | null;
  args: Record<string, unknown>;
}

interface AcceptedDifference {
  story: string;
  reason: string;
  portingRow: string;
  /** Set when no Astro component exists for the story at all. */
  noComponent?: boolean;
  /**
   * Pins the difference down to EXACTLY what the reason describes: the
   * pattern is erased from BOTH sides, and the remainder must then match
   * character for character. Without it, the entry only asserts "still
   * differs somehow", so every difference that can be expressed this way
   * carries one. Patterns are ANCHORED to the element or attribute the
   * reason names, never a bare token.
   */
  mask?: { pattern: string; flags?: string; replacement?: string };
  /**
   * How many times the mask is expected to fire on each side. Required
   * alongside `mask`: a mask is a global replace, so without a count a
   * second, undocumented occurrence of the same shape somewhere else in the
   * markup would be silently erased too.
   */
  replacements?: { actual: number; expected: number };
}

function countMatches(html: string, mask: NonNullable<AcceptedDifference['mask']>): number {
  return (html.match(new RegExp(mask.pattern, mask.flags ?? 'g')) ?? []).length;
}

function applyMask(html: string, mask: AcceptedDifference['mask']): string {
  if (!mask) return html;
  return html.replace(new RegExp(mask.pattern, mask.flags ?? 'g'), mask.replacement ?? '');
}

const acceptedByStory = new Map<string, AcceptedDifference>(
  (accepted as AcceptedDifference[]).map((entry) => [entry.story, entry])
);

/** Every `.astro` under `src/civictheme/components`, keyed by module path. */
const components = import.meta.glob('../../src/civictheme/components/**/*.astro');

function listFixtures(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFixtures(join(dir, entry.name)) : [join(dir, entry.name)]
  );
}

function pascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * THE ONE Storybook-artefact pre-processing point.
 *
 * Storybook adds no wrapper element and no attributes of its own inside
 * `#storybook-root` (verified against the first captured story — see the
 * stage-1 report), so the only artefact in a captured fixture is the
 * indentation whitespace the Twig template itself emits. `normaliseHtml`
 * already collapses that. Nothing else is stripped: in particular
 * `data-component-name` and `data-*` behaviour hooks come from the
 * CivicTheme Twig templates and MUST be reproduced by the port.
 */
function normaliseStoryHtml(html: string): string {
  return normaliseHtml(html);
}

const fixtures = listFixtures(join(FIXTURES, 'args'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => {
    const data = JSON.parse(readFileSync(file, 'utf8')) as Fixture;
    const fixtureName = relative(join(FIXTURES, 'args'), file).replace(/\.json$/, '');
    return { data, fixtureName, htmlFile: join(FIXTURES, 'html', `${fixtureName}.html`) };
  })
  .sort((a, b) => a.fixtureName.localeCompare(b.fixtureName));

if (fixtures.length === 0) throw new Error(`No story fixtures found under ${FIXTURES}/args`);

const byComponent = new Map<string, typeof fixtures>();
for (const fixture of fixtures) {
  const list = byComponent.get(fixture.data.component) ?? [];
  list.push(fixture);
  byComponent.set(fixture.data.component, list);
}

for (const [component, group] of byComponent) {
  const [layer, name] = component.split('/');
  const modulePath = `../../src/civictheme/components/${layer}/${pascalCase(name)}.astro`;
  const loader = components[modulePath];

  describe(component, () => {
    for (const { data, fixtureName, htmlFile } of group) {
      const difference = acceptedByStory.get(fixtureName);

      const title = `${data.exportName}${fixtureName.endsWith('--dark') ? '--dark' : ''} (${data.storyId})`;

      if (!loader) {
        if (!difference?.noComponent) {
          it(title, () => {
            throw new Error(`No Astro component at ${modulePath} and no accepted difference for ${fixtureName}`);
          });
          continue;
        }
        it.skip(`${title} — SKIPPED: ${difference.reason}`, () => {});
        continue;
      }

      it(title, async () => {
        const Component = ((await loader()) as { default: unknown }).default;
        const expected = normaliseStoryHtml(readFileSync(htmlFile, 'utf8'));
        const actual = normaliseHtml(await renderComponent(Component, argsToProps(data.args)));

        if (difference) {
          expect(actual, `${fixtureName} now matches upstream — remove its accepted-differences.json entry`).not.toBe(
            expected
          );
          if (difference.mask) {
            expect(countMatches(actual, difference.mask), `${fixtureName}: unexpected mask hits in the render`).toBe(
              difference.replacements?.actual
            );
            expect(countMatches(expected, difference.mask), `${fixtureName}: unexpected mask hits in the fixture`).toBe(
              difference.replacements?.expected
            );
            expect(
              applyMask(actual, difference.mask),
              `${fixtureName} differs by more than its documented accepted difference`
            ).toBe(applyMask(expected, difference.mask));
          }
          return;
        }
        expect(actual).toBe(expected);
      });
    }
  });
}

describe('story-parity fixtures', () => {
  it('has the full captured set', () => {
    // Pinned so a partial or failed re-capture cannot quietly shrink the
    // oracle. The number comes from `fixtures/SOURCE.md`, which the capture
    // script writes.
    const source = readFileSync(join(FIXTURES, 'SOURCE.md'), 'utf8');
    const declared = /- Total fixtures: (\d+)/.exec(source);
    expect(declared, 'SOURCE.md does not state a fixture total').not.toBeNull();
    expect(fixtures.length).toBe(Number(declared![1]));
  });

  it('pairs every args fixture with an HTML capture', () => {
    for (const fixture of fixtures) {
      expect(existsSync(fixture.htmlFile), `missing HTML fixture for ${fixture.fixtureName}`).toBe(true);
    }
  });
});

describe('accepted-differences.json', () => {
  const porting = readFileSync(join(process.cwd(), 'PORTING.md'), 'utf8');

  it('every entry names a real fixture and cites a PORTING.md row that exists', () => {
    const names = new Set(fixtures.map((fixture) => fixture.fixtureName));
    for (const entry of accepted as AcceptedDifference[]) {
      expect(names.has(entry.story), `unknown story ${entry.story}`).toBe(true);
      expect(entry.reason.length, `no reason for ${entry.story}`).toBeGreaterThan(0);
      expect(porting.includes(entry.portingRow), `PORTING.md has no row \`${entry.portingRow}\` (${entry.story})`).toBe(
        true
      );
    }
  });

  it('every mask states how many times it may fire', () => {
    for (const entry of accepted as AcceptedDifference[]) {
      if (!entry.mask) continue;
      expect(entry.replacements, `${entry.story} has a mask but no replacement counts`).toBeDefined();
    }
  });
});
