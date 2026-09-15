/**
 * Mobile cell labels for Markdown tables in the page body.
 *
 * On narrow screens, the CivicTheme table styles stack the body cells and show
 * each column name from `data-title` (`td::before { content: attr(data-title) }`).
 * The vendored `behaviours/table.js` adds `data-title` only to
 * `.ct-basic-content table, .ct-table`. PageLayout and DetailLayout render the
 * body in `.page-content` (see the page body block in `src/styles/global.scss`),
 * so table.js does not label a Markdown table there.
 *
 * This adds the labels in the same way as table.js: the text of the first
 * `thead` row, by column index, and never over an existing `data-title`.
 * table.js labels `.ct-table` tables, so this skips them.
 */
export const PAGE_CONTENT_TABLE_SELECTOR = '.page-content table:not(.ct-table)';

function labelRow(row: Element, titles: string[]): void {
  row.querySelectorAll('th, td').forEach((cell, index) => {
    if (index < titles.length && !cell.hasAttribute('data-title')) {
      cell.setAttribute('data-title', titles[index]);
    }
  });
}

/** Adds `data-title` labels to the body cells of one table. Returns the number of body rows. */
export function labelTable(table: Element): number {
  const headRow = table.querySelector('thead tr');
  const bodyRows = table.querySelectorAll('tbody tr');
  if (!headRow || bodyRows.length === 0) return 0;
  const titles = Array.from(headRow.querySelectorAll('th, td'), (cell) => cell.textContent ?? '');
  bodyRows.forEach((row) => labelRow(row, titles));
  return bodyRows.length;
}

/** Labels every Markdown table in the page body. Returns the number of tables. */
export function labelPageContentTables(root: ParentNode): number {
  const tables = root.querySelectorAll(PAGE_CONTENT_TABLE_SELECTOR);
  tables.forEach((table) => labelTable(table));
  return tables.length;
}
