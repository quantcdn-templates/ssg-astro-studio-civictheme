import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import FlexCenter from '../src/civictheme/components/00-base/FlexCenter.astro';

/**
 * F3: a section's "Read more"/"View more" button is centred under its grid
 * with this writer-rendered wrapper, using CivicTheme's own
 * `.ct-flex-justify-content-center` flex utility class -- never a
 * restyled Button.
 */
async function render(slotHtml: string, props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(FlexCenter, {
    props,
    slots: { default: slotHtml },
  });
}

describe('FlexCenter', () => {
  it('wraps its slotted content in the flex-centre utility class', async () => {
    const html = await render('<button class="ct-button">Read more</button>');
    expect(html).toMatch(/class="ct-flex-justify-content-center"/);
    expect(html).toContain('<button class="ct-button">Read more</button>');
  });

  it('appends an extra class rather than replacing the utility class', async () => {
    const html = await render('<span>x</span>', { class: 'extra' });
    expect(html).toMatch(/class="ct-flex-justify-content-center extra"/);
  });

  it('falls back to its content prop when the default slot is empty', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(FlexCenter, {
      props: { content: '<a href="/">Read more</a>' },
    });
    expect(html).toContain('<a href="/">Read more</a>');
  });

  it('prefers a real slotted child over its content prop', async () => {
    const html = await render('<span>slotted</span>', { content: '<a href="/">Read more</a>' });
    expect(html).toContain('<span>slotted</span>');
    expect(html).not.toContain('Read more');
  });
});
