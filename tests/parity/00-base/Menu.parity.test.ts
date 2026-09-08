import { describe } from 'vitest';
import Menu from '@civictheme/base/Menu.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

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
