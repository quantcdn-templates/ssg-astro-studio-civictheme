/**
 * Client side of the native `/search` page (see `src/pages/search.astro`).
 *
 * Reads its configuration from the `[data-quant-search]` root's data
 * attributes, which the page fills at build time from
 * `import.meta.env.PUBLIC_QUANT_SEARCH_SITE_ID` and the site settings. The
 * client never reads `import.meta.env` itself: Quant Studio's browser
 * runtime bundles hoisted scripts as a plain IIFE, where `import.meta.env`
 * does not exist.
 *
 * Results are cloned from a `<template>` that the real `Snippet.astro`
 * renders at build time, and every API value is written with `textContent`
 * or as an `href` that `safeUrl` has checked — never as HTML.
 */
import {
  clampLimit,
  isConfigured,
  isSearchable,
  parseResults,
  readQuery,
  requestBody,
  searchEndpoint,
  stateFromResults,
  statusText,
  type SearchConfig,
  type SearchResult,
  type SearchState,
} from './quant-search';

export interface SearchElements {
  input: HTMLInputElement | null;
  status: HTMLElement | null;
  unconfigured: HTMLElement | null;
  ui: HTMLElement | null;
  results: HTMLElement | null;
  heading: HTMLElement | null;
  rows: HTMLElement | null;
  error: HTMLElement | null;
  template: HTMLTemplateElement | null;
}

type FetchLike = (input: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;

/** The page configuration carried on the root element's data attributes. */
export function readConfig(root: HTMLElement): SearchConfig {
  const data = root.dataset;
  return {
    siteId: data.siteId ?? '',
    apiOrigin: data.apiOrigin ?? '',
    limit: clampLimit(data.limit),
    enabled: data.enabled !== 'false',
  };
}

/** Every element the script drives, looked up once. */
export function collectElements(root: HTMLElement): SearchElements {
  const find = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector);
  return {
    input: find<HTMLInputElement>('input[name="q"]'),
    status: find('[data-search-status]'),
    unconfigured: find('[data-search-unconfigured]'),
    ui: find('[data-search-ui]'),
    results: find('[data-search-results]'),
    heading: find('[data-search-heading]'),
    rows: find('[data-search-rows]'),
    error: find('[data-search-error]'),
    template: find<HTMLTemplateElement>('template[data-search-template]'),
  };
}

/** Writes one result into a cloned Snippet. */
export function fillSnippet(node: Element, result: SearchResult): void {
  const link = node.querySelector('.ct-snippet__title-link');
  if (link) {
    link.textContent = result.title;
    link.setAttribute('href', result.url);
  }
  const summary = node.querySelector('.ct-snippet__summary');
  if (summary && result.summary) summary.textContent = result.summary;
  else summary?.remove();
}

/** Replaces the rows with one Snippet per result. */
export function renderResults(rows: HTMLElement, template: HTMLTemplateElement, results: SearchResult[]): void {
  const doc = rows.ownerDocument;
  const nodes = results.map((result) => {
    const node = doc.importNode(template.content, true).firstElementChild;
    if (node) fillSnippet(node, result);
    return node;
  });
  rows.replaceChildren(...nodes.filter((node): node is Element => node !== null));
}

function setHidden(element: HTMLElement | null, hidden: boolean): void {
  if (element) element.hidden = hidden;
}

/** Shows the "not set up" Callout instead of the results UI. */
export function showUnconfigured(els: SearchElements): void {
  setHidden(els.unconfigured, false);
  setHidden(els.ui, true);
}

/** Puts one state on the page: status text, results list and error message. */
export function applyState(els: SearchElements, state: SearchState): void {
  if (els.status) els.status.textContent = statusText(state);
  const hasResults = state.kind === 'results';
  if (hasResults && els.rows && els.template) renderResults(els.rows, els.template, state.results);
  setHidden(els.results, !hasResults);
  setHidden(els.error, state.kind !== 'error');
}

/** Sends one query and maps the outcome to a state. Network and HTTP errors become the error state. */
export async function fetchState(config: SearchConfig, query: string, fetchImpl: FetchLike): Promise<SearchState> {
  try {
    const response = await fetchImpl(searchEndpoint(config.apiOrigin, config.siteId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody(query, config.limit),
    });
    if (!response.ok) return { kind: 'error', query };
    return stateFromResults(query, parseResults(await response.json()));
  } catch {
    return { kind: 'error', query };
  }
}

function initialState(query: string): SearchState | null {
  if (query === '') return { kind: 'idle' };
  if (!isSearchable(query)) return { kind: 'too-short' };
  return null;
}

/**
 * Runs the page: shows the Callout when search is off, otherwise searches for
 * `?q=` and moves focus to the results heading once results render.
 */
export async function initQuantSearch(
  root: HTMLElement,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
  search: string = window.location.search
): Promise<SearchState | null> {
  const els = collectElements(root);
  const config = readConfig(root);
  if (!isConfigured(config)) {
    showUnconfigured(els);
    return null;
  }
  setHidden(els.unconfigured, true);
  setHidden(els.ui, false);

  const query = readQuery(search);
  if (els.input) els.input.value = query;
  const early = initialState(query);
  if (early) {
    applyState(els, early);
    return early;
  }

  applyState(els, { kind: 'loading', query });
  const state = await fetchState(config, query, fetchImpl);
  applyState(els, state);
  if (state.kind === 'results') els.heading?.focus();
  return state;
}
