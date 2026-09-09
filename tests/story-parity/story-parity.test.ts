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
   * carries one.
   */
  mask?: { pattern: string; flags?: string; replacement?: string };
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

      it(`${data.exportName}${fixtureName.endsWith('--dark') ? '--dark' : ''} (${data.storyId})`, async () => {
        if (!loader) {
          if (!difference?.noComponent) {
            throw new Error(`No Astro component at ${modulePath} and no accepted difference for ${fixtureName}`);
          }
          return;
        }

        const Component = ((await loader()) as { default: unknown }).default;
        const expected = normaliseStoryHtml(readFileSync(htmlFile, 'utf8'));
        const actual = normaliseHtml(await renderComponent(Component, argsToProps(data.args)));

        if (difference) {
          expect(actual, `${fixtureName} now matches upstream — remove its accepted-differences.json entry`).not.toBe(
            expected
          );
          if (difference.mask) {
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

describe('accepted-differences.json', () => {
  it('every entry names a real fixture and cites a PORTING.md row', () => {
    const names = new Set(fixtures.map((fixture) => fixture.fixtureName));
    for (const entry of accepted as AcceptedDifference[]) {
      expect(names.has(entry.story), `unknown story ${entry.story}`).toBe(true);
      expect(entry.reason.length, `no reason for ${entry.story}`).toBeGreaterThan(0);
      expect(entry.portingRow.length, `no PORTING.md row for ${entry.story}`).toBeGreaterThan(0);
    }
  });

  it('fixtures and HTML captures line up', () => {
    for (const fixture of fixtures) {
      expect(existsSync(fixture.htmlFile), `missing HTML fixture for ${fixture.fixtureName}`).toBe(true);
    }
  });
});
