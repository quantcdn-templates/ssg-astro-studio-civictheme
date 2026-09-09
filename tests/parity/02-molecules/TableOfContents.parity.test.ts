import { describe, it, expect } from 'vitest';
import TableOfContents from '@civictheme/molecules/TableOfContents.astro';
import { renderNormalised } from '../harness';

// TableOfContents has no upstream `.test.js` / `__snapshots__` in
// .upstream/uikit/packages/twig/components/02-molecules/table-of-contents
// (only .scss/.stories.* files exist there) — smoke test per the task
// brief's rule for components with no upstream test, matching
// InlineFilter's precedent.
describe('TableOfContents (smoke — no upstream test.js)', () => {
  it('renders nothing when neither links nor scopeSelector are given', async () => {
    const html = await renderNormalised(TableOfContents, {});
    expect(html).toBe('');
  });

  it('renders a static link list when links is given', async () => {
    const html = await renderNormalised(TableOfContents, {
      title: 'On this page',
      links: [
        { title: 'Link 1', url: '/link-1' },
        { title: 'Link 2', url: '/link-2' },
      ],
      position: 'before',
    });
    expect(html).toContain('ct-table-of-contents');
    expect(html).toContain('ct-table-of-contents--position-before');
    expect(html).toContain('ct-table-of-contents__title');
    expect(html).toContain('On this page');
    const links = [...html.matchAll(/<a class="ct-table-of-contents__link" href="([^"]*)">([^<]*)<\/a>/g)];
    expect(links).toHaveLength(2);
    expect(links[0][1]).toBe('/link-1');
    expect(links[0][2]).toBe('Link 1');
    expect(links[1][1]).toBe('/link-2');
    expect(links[1][2]).toBe('Link 2');
  });

  it('supports theme, class, and rest-spread attributes on the static branch', async () => {
    const html = await renderNormalised(TableOfContents, {
      theme: 'dark',
      class: 'custom-class',
      'data-test': 'true',
      links: [{ title: 'Link 1', url: '/link-1' }],
    });
    expect(html).toContain('ct-theme-dark');
    expect(html).toContain('custom-class');
    expect(html).toContain('data-test="true"');
  });

  it('renders the behaviour-hook markup when scopeSelector is given (no links)', async () => {
    const html = await renderNormalised(TableOfContents, {
      theme: 'dark',
      title: 'On this page',
      anchorSelector: 'h2',
      scopeSelector: '.ct-basic-content',
      position: 'before',
      content: '<h2>Heading</h2><p>Body</p>',
    });
    expect(html).toContain('data-table-of-contents-theme="dark"');
    expect(html).toContain('data-table-of-contents-title="On this page"');
    expect(html).toContain('data-table-of-contents-anchor-selector="h2"');
    expect(html).toContain('data-table-of-contents-anchor-scope-selector=".ct-basic-content"');
    expect(html).toContain('data-table-of-contents-position="before"');
    expect(html).toContain('<h2>Heading</h2><p>Body</p>');
    expect(html).not.toContain('ct-table-of-contents__title');
  });

  it('prints all five data-table-of-contents-* attributes (empty) even with no optional props', async () => {
    const html = await renderNormalised(TableOfContents, { scopeSelector: '.ct-basic-content' });
    // An empty-string attribute value serialises bare (no `=""`), which is
    // the HTML-equivalent form (an attribute with no `=value` parses to an
    // empty-string value) — what matters for fidelity is that the attribute
    // is present at all, since `table-of-contents.js` selects on
    // `[data-table-of-contents-position]` existing, not on its value.
    expect(html).toContain('data-table-of-contents-theme="light"');
    expect(html).toMatch(/\sdata-table-of-contents-title(\s|=|>)/);
    expect(html).toMatch(/\sdata-table-of-contents-anchor-selector(\s|=|>)/);
    expect(html).toContain('data-table-of-contents-anchor-scope-selector=".ct-basic-content"');
    expect(html).toMatch(/\sdata-table-of-contents-position(\s|=|>)/);
  });
});
