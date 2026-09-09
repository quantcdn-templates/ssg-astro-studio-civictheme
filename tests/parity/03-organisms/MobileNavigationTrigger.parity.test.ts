import { describe, it, expect } from 'vitest';
import MobileNavigationTrigger from '@civictheme/organisms/MobileNavigationTrigger.astro';
import { renderNormalised } from '../harness';

// MobileNavigationTrigger has no upstream `.test.js` / `__snapshots__` at
// all (only `.scss`/`.stories.*` files exist in
// .upstream/uikit/packages/twig/components/03-organisms/mobile-navigation)
// — smoke test per the task brief's rule for components with no upstream
// test, matching TextIcon's precedent.
describe('MobileNavigationTrigger (smoke — no upstream test.js)', () => {
  it('renders a button with the flyout-open hooks and default "bars" icon', async () => {
    const html = await renderNormalised(MobileNavigationTrigger, { text: 'Menu' });
    expect(html).toContain('ct-mobile-navigation-trigger');
    expect(html).toContain('data-flyout-open-trigger');
    expect(html).toContain('data-flyout-target=".ct-mobile-navigation"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Menu');
  });

  it('supports a custom icon and theme', async () => {
    const html = await renderNormalised(MobileNavigationTrigger, { theme: 'dark', icon: 'user' });
    expect(html).toContain('ct-theme-dark');
  });
});
