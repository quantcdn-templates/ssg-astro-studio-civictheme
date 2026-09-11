/**
 * Pure helpers for the native `/search` page on Quant AI Search.
 *
 * The request and response shapes match Quant's own search-page widget
 * (`https://ai-search.quantcdn.io/v1/search-page.js`):
 *
 *   POST {origin}/v1/public/sites/{siteId}/search
 *   Content-Type: application/json
 *   { "query": "…", "limit": 10 }
 *
 * The response is `{ results: [{ url, title, snippet, metadata: { summary }, score }] }`.
 * No API key is sent: Studio provisions every search site with public access.
 *
 * Nothing here touches the DOM, so the module runs unchanged under vitest,
 * `astro build` and Quant Studio's browser runtime.
 */

/** Queries shorter than this make no request (Quant's own widget uses 3). */
export const MIN_QUERY_LENGTH = 3;

/** Longest query sent to the API; longer input is cut to this length. */
export const MAX_QUERY_LENGTH = 200;

/** Results per request when the site settings do not say otherwise. */
export const DEFAULT_RESULTS_LIMIT = 10;

/** The API's own ceiling for `limit` (the widget documents max 100). */
export const MAX_RESULTS_LIMIT = 100;

/** Production Quant AI Search origin (the portal's `services.quant_ai.embed_url`). */
export const DEFAULT_API_ORIGIN = 'https://ai-search.quantcdn.io';

export interface SearchConfig {
  siteId: string;
  apiOrigin: string;
  limit: number;
  enabled: boolean;
}

export interface SearchResult {
  /** A checked link target, or `''` when the API URL was rejected (render the title as text). */
  url: string;
  title: string;
  summary: string;
}

export type SearchState =
  | { kind: 'idle' }
  | { kind: 'too-short' }
  | { kind: 'loading'; query: string }
  | { kind: 'results'; query: string; results: SearchResult[] }
  | { kind: 'empty'; query: string }
  | { kind: 'error'; query: string };

/** The `q` parameter from a `location.search` string, trimmed, whitespace collapsed and length-capped. */
export function readQuery(search: string): string {
  const raw = new URLSearchParams(search).get('q') ?? '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH);
}

/** Whether a query is long enough to send. */
export function isSearchable(query: string): boolean {
  return query.length >= MIN_QUERY_LENGTH;
}

/** A results limit clamped to 1…100, falling back to the default for anything non-numeric. */
export function clampLimit(value: unknown): number {
  const limit = Math.trunc(Number(value));
  if (!Number.isFinite(limit) || limit < 1) return DEFAULT_RESULTS_LIMIT;
  return Math.min(limit, MAX_RESULTS_LIMIT);
}

/** Search is on only when it is enabled in settings AND the build received a site ID. */
export function isConfigured(config: Pick<SearchConfig, 'siteId' | 'enabled'>): boolean {
  return config.enabled && config.siteId.trim() !== '';
}

/** The public search endpoint for one site. */
export function searchEndpoint(apiOrigin: string, siteId: string): string {
  const origin = (apiOrigin || DEFAULT_API_ORIGIN).replace(/\/+$/, '');
  return `${origin}/v1/public/sites/${encodeURIComponent(siteId.trim())}/search`;
}

/** The JSON request body the widget sends (no `filter`: this page has no facets). */
export function requestBody(query: string, limit: number): string {
  return JSON.stringify({ query, limit: clampLimit(limit) });
}

const ABSOLUTE_HTTP = /^https?:\/\//i;

function parseUrl(value: string, origin: string): URL | null {
  try {
    return new URL(value, origin);
  } catch {
    return null;
  }
}

function isAllowed(url: URL, absolute: boolean, origin: string): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return absolute || url.origin === parseUrl(origin, origin)?.origin;
}

/**
 * A link target for an API URL, or `''` to render no link.
 *
 * The value is parsed against `origin` (the page's `location.origin`). Only
 * `http:`/`https:` results are linked. An absolute `http(s)://` URL may point
 * at any host; anything else must resolve on this site, so a path the URL
 * parser turns into another host (`//evil.example`, `/\evil.example/x`, a
 * tab inside the slashes) is rejected, as are `javascript:` and `data:`.
 * Same-site results come back as a path; absolute ones as a full URL.
 */
export function safeUrl(value: unknown, origin: string): string {
  if (typeof value !== 'string' || value.trim() === '') return '';
  const raw = value.trim();
  const absolute = ABSOLUTE_HTTP.test(raw);
  const url = parseUrl(raw, origin);
  if (!url || !isAllowed(url, absolute, origin)) return '';
  return absolute ? url.href : `${url.pathname}${url.search}${url.hash}`;
}

/** Plain text from an API string: tags removed and whitespace collapsed. The DOM still sets it as `textContent`. */
export function plainText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summaryOf(item: Record<string, unknown>): string {
  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  return plainText(metadata.summary) || plainText(item.snippet);
}

function toResult(item: unknown, origin: string): SearchResult | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  return {
    url: safeUrl(record.url, origin),
    title: plainText(record.title) || 'Untitled page',
    summary: summaryOf(record),
  };
}

/**
 * Normalises a search API response into display-ready results; a malformed
 * body yields `[]`. `origin` is the page's `location.origin` (see `safeUrl`).
 */
export function parseResults(body: unknown, origin: string): SearchResult[] {
  const results = (body as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) return [];
  return results.map((item) => toResult(item, origin)).filter((result): result is SearchResult => result !== null);
}

/** The state that follows a completed response. */
export function stateFromResults(query: string, results: SearchResult[]): SearchState {
  return results.length > 0 ? { kind: 'results', query, results } : { kind: 'empty', query };
}

const STATUS_TEXT: Record<SearchState['kind'], (state: SearchState) => string> = {
  idle: () => '',
  'too-short': () => `Enter at least ${MIN_QUERY_LENGTH} characters to search.`,
  loading: () => 'Searching…',
  results: (state) => {
    const { query, results } = state as Extract<SearchState, { kind: 'results' }>;
    const noun = results.length === 1 ? 'result' : 'results';
    return `Showing ${results.length} ${noun} for “${query}”`;
  },
  empty: (state) => `No results for “${(state as Extract<SearchState, { kind: 'empty' }>).query}”`,
  error: () => 'Search failed.',
};

/** The text for the page's `aria-live` status region. */
export function statusText(state: SearchState): string {
  return STATUS_TEXT[state.kind](state);
}
