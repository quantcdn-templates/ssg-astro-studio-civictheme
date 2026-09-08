import { describe } from 'vitest';
import Layout from '@civictheme/base/Layout.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '00-base', name: 'layout' };

const DEFAULT_KEY = 'Layout Component renders with default values 1';
const TOP_LEFT_KEY = 'Layout Component renders with sidebar top left 1';
const TOP_RIGHT_KEY = 'Layout Component renders with sidebar top right 1';
const BOTTOM_LEFT_KEY = 'Layout Component renders with sidebar bottom left 1';
const BOTTOM_RIGHT_KEY = 'Layout Component renders with sidebar bottom right 1';
const ALL_KEY = 'Layout Component renders with all sidebars and content sections 1';
const HIDDEN_KEY = 'Layout Component hides sidebars when specified 1';
const HIDDEN_CONTAINED_KEY = 'Layout Component hides sidebars when specified - contained 1';
const ONLY_MAIN_CONTAINED_KEY = 'Layout Component only main - contained 1';
const ONLY_MAIN_NOT_CONTAINED_KEY = 'Layout Component only main - not contained 1';
const CUSTOM_KEY = 'Layout Component renders with custom attributes and classes 1';

describe('Layout', () => {
  parityCase(meta, DEFAULT_KEY, Layout, {}, { default: 'Main content' });

  parityCase(meta, TOP_LEFT_KEY, Layout, {}, { default: 'Main content', sidebarTopLeft: 'Top left sidebar' });

  parityCase(meta, TOP_RIGHT_KEY, Layout, {}, { default: 'Main content', sidebarTopRight: 'Top right sidebar' });

  parityCase(meta, BOTTOM_LEFT_KEY, Layout, {}, { default: 'Main content', sidebarBottomLeft: 'Bottom left sidebar' });

  parityCase(
    meta,
    BOTTOM_RIGHT_KEY,
    Layout,
    {},
    { default: 'Main content', sidebarBottomRight: 'Bottom right sidebar' }
  );

  parityCase(
    meta,
    ALL_KEY,
    Layout,
    {},
    {
      contentTop: 'Top content',
      default: 'Main content',
      contentBottom: 'Bottom content',
      sidebarTopLeft: 'Top left sidebar',
      sidebarTopRight: 'Top right sidebar',
      sidebarBottomLeft: 'Bottom left sidebar',
      sidebarBottomRight: 'Bottom right sidebar',
    }
  );

  parityCase(
    meta,
    HIDDEN_KEY,
    Layout,
    { hideSidebarLeft: true, hideSidebarRight: true },
    {
      default: 'Main content',
      sidebarTopLeft: 'Top left sidebar',
      sidebarTopRight: 'Top right sidebar',
      sidebarBottomLeft: 'Bottom left sidebar',
      sidebarBottomRight: 'Bottom right sidebar',
    }
  );

  parityCase(
    meta,
    HIDDEN_CONTAINED_KEY,
    Layout,
    { hideSidebarLeft: true, hideSidebarRight: true, isContained: true },
    {
      default: 'Main content',
      sidebarTopLeft: 'Top left sidebar',
      sidebarTopRight: 'Top right sidebar',
      sidebarBottomLeft: 'Bottom left sidebar',
      sidebarBottomRight: 'Bottom right sidebar',
    }
  );

  parityCase(meta, ONLY_MAIN_CONTAINED_KEY, Layout, { isContained: true }, { default: 'Main content' });

  parityCase(meta, ONLY_MAIN_NOT_CONTAINED_KEY, Layout, { isContained: false }, { default: 'Main content' });

  parityCase(meta, CUSTOM_KEY, Layout, { 'data-test': 'true', class: 'custom-modifier' }, { default: 'Main content' });

  expectAllKeysCovered(meta, [
    DEFAULT_KEY,
    TOP_LEFT_KEY,
    TOP_RIGHT_KEY,
    BOTTOM_LEFT_KEY,
    BOTTOM_RIGHT_KEY,
    ALL_KEY,
    HIDDEN_KEY,
    HIDDEN_CONTAINED_KEY,
    ONLY_MAIN_CONTAINED_KEY,
    ONLY_MAIN_NOT_CONTAINED_KEY,
    CUSTOM_KEY,
  ]);
});
