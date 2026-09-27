/**
 * Shared-reference R2 mapping: a Storybook story's snake_case Twig args →
 * Astro props. Used by the story-parity suite (and by the report script).
 */
function camelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

/**
 * Parses a Twig `attributes` value that a story passes as a RAW ATTRIBUTE
 * STRING (e.g. `id="field_id_822--error-message"`, the shape a Drupal
 * `Attribute` object prints as) into the prop object shared-reference R2
 * asks for: `attributes` → rest props spread onto the element.
 *
 * Limitation: only DOUBLE-quoted values and bare attributes are recognised.
 * A single-quoted value (`id='x'`) would be read as the bare attributes
 * `id`, `'x'`. Every captured story uses double quotes (Drupal's `Attribute`
 * always prints them); widen this if that stops being true.
 */
function parseAttributeString(value: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const match of value.matchAll(/([a-zA-Z_:][-\w:.]*)\s*=\s*"([^"]*)"|([a-zA-Z_:][-\w:.]*)/g)) {
    if (match[1] !== undefined) props[match[1]] = match[2];
    else if (match[3] !== undefined) props[match[3]] = '';
  }
  return props;
}

/**
 * Maps a story's snake_case Twig args onto Astro props, per shared-reference
 * R2, applied RECURSIVELY (a nested object such as `message` or a `control`
 * item is itself a set of Twig props for a child component, so it obeys the
 * same rules):
 * - `modifier_class` → `class`
 * - `attributes` → rest props merged into the SAME object (a `null` value
 *   contributes nothing; a raw attribute string is parsed by
 *   `parseAttributeString`)
 * - every other key → camelCase
 * - `theme` keeps its story value; the components default it to `'light'`
 *
 * A `*_attributes` arg whose value is `null` is dropped rather than passed
 * as `undefined`: these are Twig `create_attribute()` placeholders, and
 * every captured story leaves them empty.
 */
export function argsToProps(args: Record<string, unknown>): Record<string, unknown> {
  const convert = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(convert);
    if (value && typeof value === 'object') return argsToProps(value as Record<string, unknown>);
    return value;
  };

  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (key === 'attributes') {
      if (typeof value === 'string') Object.assign(props, parseAttributeString(value));
      else if (value && typeof value === 'object') Object.assign(props, convert(value));
      continue;
    }
    if (value === null && key.endsWith('attributes')) continue;
    props[key === 'modifier_class' ? 'class' : camelCase(key)] = convert(value);
  }
  return props;
}
