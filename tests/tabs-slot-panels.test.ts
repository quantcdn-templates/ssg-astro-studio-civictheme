import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Tabs from '../src/civictheme/components/02-molecules/Tabs.astro';

/**
 * A migrated page maps a source tab widget to Tabs, and each panel holds real
 * components (a Grid of cards). Those arrive as named slots, one per panel id,
 * because a panel's `content` string is rendered as HTML and cannot hold them.
 */
const panels = [
  { id: 'tab-privacy', title: 'Privacy', isSelected: true },
  { id: 'tab-foi', title: 'Freedom of information', content: '<p class="string-panel">FOI</p>' },
];

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(Tabs, {
    props: { panels },
    slots: { 'tab-privacy': '<div class="slot-panel">Privacy cards</div>' },
  });
}

describe('Tabs panels', () => {
  it('renders a panel from its named slot', async () => {
    const html = await render();
    expect(html).toMatch(/id="tab-privacy"[^>]*role="tabpanel"[\s\S]*?class="slot-panel"/);
  });

  it('still renders a panel from its content string', async () => {
    const html = await render();
    expect(html).toMatch(/id="tab-foi"[^>]*role="tabpanel"[\s\S]*?class="string-panel"/);
  });
});
