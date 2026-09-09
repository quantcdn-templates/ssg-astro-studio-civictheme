import { describe, it, expect } from 'vitest';
import MobileNavigationClose from '@civictheme/organisms/MobileNavigationClose.astro';
import { renderNormalised } from '../harness';

// MobileNavigationClose has no upstream `.test.js` / `__snapshots__` of its
// own — it is only exercised indirectly, inside mobile-navigation.test.js's
// snapshots (see MobileNavigation.parity.test.ts) — smoke test per the task
// brief's rule for components with no upstream test, matching TextIcon's
// precedent.
describe('MobileNavigationClose (smoke — no own upstream test.js)', () => {
  it('renders a button with the default "Close" text and dismiss-all hook', async () => {
    const html = await renderNormalised(MobileNavigationClose, {});
    expect(html).toContain('ct-mobile-navigation-close');
    expect(html).toContain('ct-mobile-navigation-close__button');
    expect(html).toContain('data-flyout-close-all-trigger');
    expect(html).toContain('Close');
  });

  it('renders custom text and theme', async () => {
    const html = await renderNormalised(MobileNavigationClose, { theme: 'dark', text: 'Dismiss' });
    expect(html).toContain('ct-theme-dark');
    expect(html).toContain('Dismiss');
  });
});
