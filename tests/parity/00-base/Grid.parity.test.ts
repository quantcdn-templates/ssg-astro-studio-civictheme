import { describe, it, expect } from 'vitest';
import Grid from '@civictheme/base/Grid.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '00-base', name: 'grid' };

const keys: string[] = [];
function grid(key: string, props: Record<string, unknown>) {
  keys.push(key);
  parityCase(meta, key, Grid, props);
}

const attrsModifier = { 'data-test': 'true', class: 'custom-modifier' };

describe('Grid', () => {
  // "Grid renders correctly %s" (dataProviderGrid)
  grid(`Grid renders correctly { items: [Array], use_container: true, description: 'with container' } 1`, {
    items: ['1'],
    useContainer: true,
  });

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: false,\n  description: 'without container'\n} 1`,
    { items: ['1'], useContainer: false }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  description: 'multiple items with container'\n} 1`,
    { items: ['1', '2'], useContainer: true }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  is_fluid: true,\n  description: 'multiple items with fluid container'\n} 1`,
    { items: ['1', '2'], useContainer: true, isFluid: true }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: false,\n  description: 'multiple items without container'\n} 1`,
    { items: ['1', '2'], useContainer: false }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  template_column_count: 3,\n  description: 'column count with container'\n} 1`,
    { items: ['1', '2', '3'], useContainer: true, templateColumnCount: 3 }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  template_column_count: 3,\n  is_fluid: true,\n  description: 'column count with fluid container'\n} 1`,
    { items: ['1', '2', '3'], useContainer: true, templateColumnCount: 3, isFluid: true }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: false,\n  template_column_count: 3,\n  description: 'column count without container'\n} 1`,
    { items: ['1', '2', '3'], useContainer: false, templateColumnCount: 3 }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  row_element: 'section',\n  column_element: 'span',\n  description: 'custom elements with container'\n} 1`,
    { items: ['1', '2'], useContainer: true, rowElement: 'section', columnElement: 'span' }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: false,\n  row_element: 'section',\n  column_element: 'span',\n  description: 'custom elements without container'\n} 1`,
    { items: ['1', '2'], useContainer: false, rowElement: 'section', columnElement: 'span' }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  row_class: 'custom-row',\n  column_class: 'custom-col',\n  description: 'custom classes with container'\n} 1`,
    { items: ['1'], useContainer: true, rowClass: 'custom-row', columnClass: 'custom-col' }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: false,\n  row_class: 'custom-row',\n  column_class: 'custom-col',\n  description: 'custom classes without container'\n} 1`,
    { items: ['1'], useContainer: false, rowClass: 'custom-row', columnClass: 'custom-col' }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  fill_width: true,\n  description: 'fill width with container'\n} 1`,
    { items: ['1', '2'], useContainer: true, fillWidth: true }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: false,\n  fill_width: true,\n  description: 'fill width without container'\n} 1`,
    { items: ['1', '2'], useContainer: false, fillWidth: true }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: true,\n  attributes: [DrupalAttribute [Map]],\n  modifier_class: 'custom-modifier',\n  description: 'attributes and modifier class with container'\n} 1`,
    { items: ['1'], useContainer: true, 'data-test': 'true', class: 'custom-modifier' }
  );

  grid(
    `Grid renders correctly {\n  items: [Array],\n  use_container: false,\n  attributes: [DrupalAttribute [Map]],\n  modifier_class: 'custom-modifier',\n  description: 'attributes and modifier class without container'\n} 1`,
    { items: ['1'], useContainer: false, 'data-test': 'true', class: 'custom-modifier' }
  );

  // "Grid Container renders %s"
  grid(`Grid Container renders { use_container: true, is_fluid: false } 1`, {
    items: ['1'],
    useContainer: true,
    isFluid: false,
  });
  grid(`Grid Container renders { use_container: true, is_fluid: true } 1`, {
    items: ['1'],
    useContainer: true,
    isFluid: true,
  });
  grid(`Grid Container renders { use_container: false, is_fluid: false } 1`, {
    items: ['1'],
    useContainer: false,
    isFluid: false,
  });
  grid(`Grid Container renders { use_container: false, is_fluid: true } 1`, {
    items: ['1'],
    useContainer: false,
    isFluid: true,
  });

  // "Grid Row Fill Width renders %s"
  grid(`Grid Row Fill Width renders { fill_width: true } 1`, {
    items: ['1'],
    useContainer: true,
    fillWidth: true,
  });
  grid(`Grid Row Fill Width renders { fill_width: false } 1`, {
    items: ['1'],
    useContainer: true,
    fillWidth: false,
  });

  // "Grid Attributes and Modifier Class renders %s"
  grid(
    `Grid Attributes and Modifier Class renders {\n  attributes: [DrupalAttribute [Map]],\n  modifier_class: 'custom-modifier',\n  use_container: true\n} 1`,
    { items: ['1'], useContainer: true, ...attrsModifier }
  );
  grid(
    `Grid Attributes and Modifier Class renders {\n  attributes: [DrupalAttribute [Map]],\n  modifier_class: 'custom-modifier',\n  use_container: false\n} 1`,
    { items: ['1'], useContainer: false, ...attrsModifier }
  );

  // "Grid Custom Elements renders %s"
  grid(`Grid Custom Elements renders { row_element: 'section', column_element: 'span' } 1`, {
    items: ['1'],
    useContainer: true,
    rowElement: 'section',
    columnElement: 'span',
  });
  grid(`Grid Custom Elements renders { row_element: 'div', column_element: 'div' } 1`, {
    items: ['1'],
    useContainer: true,
    rowElement: 'div',
    columnElement: 'div',
  });

  // "Grid Custom Classes renders %s"
  grid(
    `Grid Custom Classes renders {\n  template_column_count: null,\n  row_class: null,\n  column_class: null,\n  fill_width: false,\n  expectedRowClass: 'row',\n  expectedColumnClass: 'col'\n} 1`,
    { items: ['1'], useContainer: true, templateColumnCount: null, rowClass: null, columnClass: null, fillWidth: false }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: null,\n  row_class: null,\n  column_class: null,\n  fill_width: true,\n  expectedRowClass: 'row row--fill-width',\n  expectedColumnClass: 'col'\n} 1`,
    { items: ['1'], useContainer: true, templateColumnCount: null, rowClass: null, columnClass: null, fillWidth: true }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 0,\n  row_class: null,\n  column_class: null,\n  fill_width: false,\n  expectedRowClass: 'row',\n  expectedColumnClass: 'col'\n} 1`,
    { items: ['1'], useContainer: true, templateColumnCount: 0, rowClass: null, columnClass: null, fillWidth: false }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 0,\n  row_class: null,\n  column_class: null,\n  fill_width: true,\n  expectedRowClass: 'row row--fill-width',\n  expectedColumnClass: 'col'\n} 1`,
    { items: ['1'], useContainer: true, templateColumnCount: 0, rowClass: null, columnClass: null, fillWidth: true }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 0,\n  row_class: 'custom-row',\n  column_class: 'custom-col',\n  fill_width: false,\n  expectedRowClass: 'row custom-row',\n  expectedColumnClass: 'col custom-col'\n} 1`,
    {
      items: ['1'],
      useContainer: true,
      templateColumnCount: 0,
      rowClass: 'custom-row',
      columnClass: 'custom-col',
      fillWidth: false,
    }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 0,\n  row_class: 'custom-row',\n  column_class: 'custom-col',\n  fill_width: true,\n  expectedRowClass: 'row row--fill-width custom-row',\n  expectedColumnClass: 'col custom-col'\n} 1`,
    {
      items: ['1'],
      useContainer: true,
      templateColumnCount: 0,
      rowClass: 'custom-row',
      columnClass: 'custom-col',
      fillWidth: true,
    }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 12,\n  row_class: null,\n  column_class: null,\n  fill_width: false,\n  expectedRowClass: 'row',\n  expectedColumnClass: 'col-xxs-12 col-m-1'\n} 1`,
    { items: ['1'], useContainer: true, templateColumnCount: 12, rowClass: null, columnClass: null, fillWidth: false }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 12,\n  row_class: null,\n  column_class: null,\n  fill_width: true,\n  expectedRowClass: 'row row--fill-width',\n  expectedColumnClass: 'col-xxs-12 col-m-1'\n} 1`,
    { items: ['1'], useContainer: true, templateColumnCount: 12, rowClass: null, columnClass: null, fillWidth: true }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 12,\n  row_class: 'custom-row',\n  column_class: null,\n  fill_width: false,\n  expectedRowClass: 'row custom-row',\n  expectedColumnClass: 'col-xxs-12 col-m-1'\n} 1`,
    {
      items: ['1'],
      useContainer: true,
      templateColumnCount: 12,
      rowClass: 'custom-row',
      columnClass: null,
      fillWidth: false,
    }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 12,\n  row_class: 'custom-row',\n  column_class: null,\n  fill_width: true,\n  expectedRowClass: 'row row--fill-width custom-row',\n  expectedColumnClass: 'col-xxs-12 col-m-1'\n} 1`,
    {
      items: ['1'],
      useContainer: true,
      templateColumnCount: 12,
      rowClass: 'custom-row',
      columnClass: null,
      fillWidth: true,
    }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 12,\n  row_class: 'custom-row',\n  column_class: 'custom-col',\n  fill_width: false,\n  expectedRowClass: 'row custom-row',\n  expectedColumnClass: 'col-xxs-12 col-m-1 custom-col'\n} 1`,
    {
      items: ['1'],
      useContainer: true,
      templateColumnCount: 12,
      rowClass: 'custom-row',
      columnClass: 'custom-col',
      fillWidth: false,
    }
  );
  grid(
    `Grid Custom Classes renders {\n  template_column_count: 12,\n  row_class: 'custom-row',\n  column_class: 'custom-col',\n  fill_width: true,\n  expectedRowClass: 'row row--fill-width custom-row',\n  expectedColumnClass: 'col-xxs-12 col-m-1 custom-col'\n} 1`,
    {
      items: ['1'],
      useContainer: true,
      templateColumnCount: 12,
      rowClass: 'custom-row',
      columnClass: 'custom-col',
      fillWidth: true,
    }
  );

  // "Grid Template Columns (no auto breakpoint) renders %s"
  for (const count of [1, 2, 3, 4, 6, 12]) {
    grid(`Grid Template Columns (no auto breakpoint) renders { template_column_count: ${count} } 1`, {
      items: ['1'],
      columnElement: 'div',
      autoBreakpoint: false,
      templateColumnCount: count,
    });
  }

  // "Grid Template Columns with Auto Breakpoint renders %s"
  for (const count of [1, 2, 3, 4, 6, 12]) {
    grid(`Grid Template Columns with Auto Breakpoint renders { template_column_count: ${count} } 1`, {
      items: ['1'],
      columnElement: 'div',
      autoBreakpoint: true,
      templateColumnCount: count,
    });
  }

  expectAllKeysCovered(meta, keys);

  // Task 14b: the default slot takes precedence over `items`, letting a
  // caller compose real Astro components as columns instead of
  // pre-rendering each to an HTML string. Passing the equivalent
  // already-wrapped column markup via the slot must render identically to
  // the single-item `items` render (which Grid wraps in the same column
  // div/class itself).
  describe('slot vs string-prop parity', () => {
    it('a single item renders identically via the default slot (pre-wrapped) and via items', async () => {
      const viaProp = await renderNormalised(Grid, { items: ['<p>A</p>'] });
      const viaSlot = await renderNormalised(Grid, {}, { default: '<div class="col"><p>A</p></div>' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a single item renders identically via the default slot without a container', async () => {
      const viaProp = await renderNormalised(Grid, { items: ['<p>A</p>'], useContainer: false });
      const viaSlot = await renderNormalised(
        Grid,
        { useContainer: false },
        { default: '<div class="col"><p>A</p></div>' }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('a slot alone (no items) still renders the row/container wrapper', async () => {
      const html = await renderNormalised(Grid, {}, { default: '<div class="col">Live child</div>' });
      expect(html).toContain('row');
      expect(html).toContain('Live child');
    });
  });
});
