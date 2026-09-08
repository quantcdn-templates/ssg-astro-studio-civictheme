import { describe, it, expect } from 'vitest';
import Menu from '@civictheme/base/Menu.astro';
import Icon from '@civictheme/base/Icon.astro';
import { parityCase, expectAllKeysCovered, renderNormalised, normaliseHtml } from '../harness';

const meta = { layer: '00-base', name: 'menu' };

const DEFAULT_KEY = 'Menu Component renders with default values 1';
const SUBMENU_KEY = 'Menu Component renders with default values - submenu 1';
const THEME_KEY = 'Menu Component renders with theme and custom classes 1';
const COLLAPSIBLE_KEY = 'Menu Component renders collapsible menu 1';
const ATTRS_KEY = 'Menu Component renders menu items with correct attributes 1';
const EXTRA_ATTRS_KEY = 'Menu Component renders menu items with additional attributes 1';

describe('Menu', () => {
  parityCase(meta, DEFAULT_KEY, Menu, {
    items: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
    ],
  });

  parityCase(meta, SUBMENU_KEY, Menu, {
    items: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
      {
        title: 'Services',
        url: '/services',
        below: [
          { title: 'Consulting', url: '/services/consulting' },
          { title: 'Development', url: '/services/development' },
        ],
      },
    ],
  });

  parityCase(meta, THEME_KEY, Menu, {
    items: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
      {
        title: 'Services',
        url: '/services',
        below: [
          { title: 'Consulting', url: '/services/consulting' },
          { title: 'Development', url: '/services/development' },
        ],
      },
    ],
    theme: 'dark',
    class: 'custom-modifier',
  });

  parityCase(meta, COLLAPSIBLE_KEY, Menu, {
    items: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
      {
        title: 'Services',
        url: '/services',
        inActiveTrail: true,
        isExpanded: true,
        below: [
          { title: 'Consulting', url: '/services/consulting' },
          { title: 'Development', url: '/services/development' },
        ],
      },
    ],
    isCollapsible: true,
  });

  parityCase(meta, ATTRS_KEY, Menu, {
    items: [
      { title: 'Home', url: '/', attributes: { 'data-test': 'home' } },
      { title: 'About', url: '/about', attributes: { 'data-test': 'about' } },
      {
        title: 'Services',
        url: '/services',
        attributes: { 'data-test': 'services' },
        below: [
          { title: 'Consulting', url: '/services/consulting', attributes: { 'data-test': 'consulting' } },
          { title: 'Development', url: '/services/development', attributes: { 'data-test': 'development' } },
        ],
      },
    ],
  });

  parityCase(meta, EXTRA_ATTRS_KEY, Menu, {
    items: [
      {
        title: 'Home',
        url: '/',
        attributes: { 'data-test': 'home', 'data-extra': 'extra-home' },
      },
      {
        title: 'About',
        url: '/about',
        attributes: { 'data-test': 'about', 'data-extra': 'extra-about' },
      },
      {
        title: 'Services',
        url: '/services',
        attributes: { 'data-test': 'services', 'data-extra': 'extra-services' },
        below: [
          {
            title: 'Consulting',
            url: '/services/consulting',
            attributes: { 'data-test': 'consulting', 'data-extra': 'extra-consulting' },
          },
          {
            title: 'Development',
            url: '/services/development',
            attributes: { 'data-test': 'development', 'data-extra': 'extra-development' },
          },
        ],
      },
    ],
  });

  expectAllKeysCovered(meta, [DEFAULT_KEY, SUBMENU_KEY, THEME_KEY, COLLAPSIBLE_KEY, ATTRS_KEY, EXTRA_ATTRS_KEY]);
});

// Fidelity gaps flagged in review — no upstream snapshot exercises these
// paths, so expected markup is derived by hand from `link.twig` +
// `text-icon.twig` (isExternal/isNewWindow test) or asserted structurally.
describe('Menu (fidelity gaps, no upstream snapshot)', () => {
  it('wires isExternal/isNewWindow through the inlined link and TextIcon, matching link.twig + text-icon.twig', async () => {
    // Derived by hand from link.twig (ct-link--external class, target="_blank")
    // and text-icon.twig (isExternal with the default 'after' placement forces
    // show_full_text=false, so the last word is grouped with the external
    // icon; isNewWindow appends the visually-hidden span after everything).
    const iconHtml = await renderNormalised(Icon, { symbol: 'upper-right-arrow' });
    const actual = await renderNormalised(Menu, {
      items: [{ title: 'Example Site', url: 'https://example.com', isExternal: true, isNewWindow: true }],
    });
    const expected = normaliseHtml(
      '<ul class="ct-menu ct-menu--level-0 ct-theme-light" data-component-name="ct-menu">' +
        '<li class="ct-menu__item ct-menu__item--level-0">' +
        '<a class="ct-link ct-theme-light ct-link--external ct-menu__item__link" ' +
        'href="https://example.com" title="Example Site" target="_blank">' +
        '<span class="ct-text-icon__text">Example </span>' +
        `<span class="ct-text-icon__group"><span class="ct-text-icon__text">Site</span> ${iconHtml}</span>` +
        '<span class="ct-visually-hidden">(Opens in a new tab/window)</span>' +
        '</a></li></ul>'
    );
    expect(actual).toBe(expected);
  });

  it('renders identical internal <li> structure (link, trigger, submenu) at level 0 and when nested', async () => {
    const childWithGrandchild = {
      title: 'Consulting',
      url: '/services/consulting',
      below: [{ title: 'Detail', url: '/services/consulting/detail' }],
    };
    const level0 = await renderNormalised(Menu, { items: [childWithGrandchild], isCollapsible: true });
    const nested = await renderNormalised(Menu, {
      items: [childWithGrandchild],
      isCollapsible: true,
      menuLevel: 1,
    });

    const extractLi = (html: string) => html.match(/<li[^>]*>.*<\/li>/)?.[0] ?? '';
    const stripLevels = (li: string) => li.replace(/level-\d+/g, 'level-N');

    expect(extractLi(level0)).not.toBe('');
    expect(stripLevels(extractLi(level0))).toBe(stripLevels(extractLi(nested)));
  });

  it('adds the same before-submenu separator whitespace at every nesting depth (regression for the level-0-vs-nested drift)', async () => {
    const html = await renderNormalised(Menu, {
      items: [
        {
          title: 'Services',
          url: '/services',
          below: [
            {
              title: 'Consulting',
              url: '/services/consulting',
              below: [{ title: 'Detail', url: '/services/consulting/detail' }],
            },
          ],
        },
      ],
      isCollapsible: true,
    });
    const separators = [...html.matchAll(/(.)<div [^>]*class="ct-menu__sub-menu__wrapper/g)].map((m) => m[1]);
    expect(separators.length).toBe(2);
    expect(separators.every((c) => c === ' ')).toBe(true);
  });

  it('treats below: [] as no children (no has-children class, no collapsible attrs, no submenu)', async () => {
    const html = await renderNormalised(Menu, {
      items: [{ title: 'Empty', url: '/empty', below: [] }],
      isCollapsible: true,
    });
    expect(html).not.toContain('ct-menu__item--has-children');
    expect(html).not.toContain('data-collapsible');
    expect(html).not.toContain('ct-menu__sub-menu__wrapper');
  });
});
