import { describe, it, expect } from 'vitest';
import { generateSkeleton } from '../scripts/twig-to-astro.mjs';

const twig = `{#
/**
 * @file
 * CivicTheme Tag component.
 *
 * Props:
 * - theme: [string] Theme variation (light or dark).
 * - type: [string] Tag type (primary, secondary, tertiary).
 * - content: [string] Tag content.
 * - is_new_window: [boolean] Open in new window.
 * - icon: [string,null] Icon name.
 * - tags: [array] Items:
 *   Each item contains:
 *   - text: [string] Text.
 * - modifier_class: [string] Additional CSS classes.
 * - attributes: [Drupal\\Core\\Template\\Attribute] Additional HTML attributes.
 */
#}
{% include '@base/icon/icon.twig' with { symbol: icon } only %}
<span class="ct-tag">{{ content }}</span>`;

describe('generateSkeleton', () => {
  const out = generateSkeleton(twig, '01-atoms/tag');
  it('builds a camelCase Props interface with types', () => {
    expect(out).toContain('interface Props');
    expect(out).toContain("theme?: 'light' | 'dark';");
    expect(out).toContain('isNewWindow?: boolean;');
    expect(out).toContain('icon?: string | null;');
    expect(out).toContain('tags?: Array<{ text?: string }>;');
    expect(out).toContain('class?: string;');
    expect(out).toContain('[key: string]: unknown;');
    expect(out).not.toContain('modifier_class');
    expect(out).not.toContain('attributes?:');
  });
  it('imports included components via aliases', () => {
    expect(out).toContain("import Icon from '@civictheme/base/Icon.astro';");
  });
  it('destructures props with defaults and rest', () => {
    expect(out).toMatch(/const \{ theme = 'light', .*class: className = '', \.\.\.rest \} = Astro\.props;/);
  });
  it('embeds the twig body for translation', () => {
    expect(out).toContain('<!-- TWIG:');
    expect(out).toContain('<span class="ct-tag">');
  });
});
