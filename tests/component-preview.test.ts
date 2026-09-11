/**
 * The layout Studio's component editor wraps one component in
 * (quant.studio.json `_preview.layout`): the theme surface only.
 */
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ComponentPreview from '../src/layouts/ComponentPreview.astro';

async function render(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ComponentPreview, { props, slots: { default: '<p class="probe">Card</p>' } });
}

describe('ComponentPreview layout', () => {
  it('wraps the component on a light stage by default', async () => {
    const html = await render({});
    expect(html).toMatch(/class="ct-component-preview ct-theme-light[^"]*"/);
    expect(html).toContain('<p class="probe">Card</p>');
  });

  it('uses the dark stage for theme="dark"', async () => {
    const html = await render({ theme: 'dark' });
    expect(html).toMatch(/class="ct-component-preview ct-theme-dark[^"]*"/);
    expect(html).toContain('data-theme="dark"');
  });

  it('falls back to light for an unknown theme', async () => {
    expect(await render({ theme: 'sepia' })).toContain('ct-theme-light');
  });
});
