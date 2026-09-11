import { describe, it, expect, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import {
  clampLimit,
  isConfigured,
  isSearchable,
  parseResults,
  plainText,
  readQuery,
  requestBody,
  safeUrl,
  searchEndpoint,
  statusText,
} from '../src/lib/quant-search';
import { FOCUS_DELAY_MS, fetchState, initQuantSearch, renderResults } from '../src/lib/quant-search-dom';

const ORIGIN = 'https://site.test';
const at = (search: string) => ({ search, origin: ORIGIN });

/** A response in the shape Quant's search-page widget reads (`results[].url/title/snippet/metadata.summary/score`). */
const fixture = {
  results: [
    {
      url: '/news/new-library-hours',
      title: 'New library hours',
      snippet: 'The <mark>library</mark> opens earlier.',
      metadata: { summary: 'Longer opening hours from March.' },
      score: 0.91,
    },
    {
      url: 'javascript:alert(1)',
      title: '<img src=x onerror=alert(1)>Bad & <b>bold</b>',
      snippet: '<script>alert(1)</script>Snippet text',
      score: 0.4,
    },
    { url: 'https://example.com/elsewhere', title: '', snippet: '' },
  ],
};

describe('query handling', () => {
  it('reads, trims and collapses q', () => {
    expect(readQuery('?q=%20%20library%20%20hours%20')).toBe('library hours');
    expect(readQuery('?other=1')).toBe('');
    expect(readQuery('')).toBe('');
  });

  it('caps a long query at 200 characters', () => {
    expect(readQuery(`?q=${'a'.repeat(300)}`)).toHaveLength(200);
  });

  it('needs three or more characters, as the Quant widget does', () => {
    expect(isSearchable('')).toBe(false);
    expect(isSearchable('ab')).toBe(false);
    expect(isSearchable('abc')).toBe(true);
  });

  it('clamps the results limit to 1…100 with a default of 10', () => {
    expect(clampLimit('25')).toBe(25);
    expect(clampLimit(500)).toBe(100);
    expect(clampLimit(0)).toBe(10);
    expect(clampLimit('nope')).toBe(10);
    expect(clampLimit(undefined)).toBe(10);
  });

  it('is configured only with a site ID and search enabled', () => {
    expect(isConfigured({ siteId: 'abc', enabled: true })).toBe(true);
    expect(isConfigured({ siteId: '', enabled: true })).toBe(false);
    expect(isConfigured({ siteId: '  ', enabled: true })).toBe(false);
    expect(isConfigured({ siteId: 'abc', enabled: false })).toBe(false);
  });

  it('builds the public endpoint and the JSON body the widget sends', () => {
    expect(searchEndpoint('https://ai-search.quantcdn.io/', 'site 1')).toBe(
      'https://ai-search.quantcdn.io/v1/public/sites/site%201/search'
    );
    expect(searchEndpoint('', 'abc')).toBe('https://ai-search.quantcdn.io/v1/public/sites/abc/search');
    expect(JSON.parse(requestBody('library', 10))).toEqual({ query: 'library', limit: 10 });
  });
});

describe('response handling and escaping', () => {
  it('maps a response fixture to display results', () => {
    const results = parseResults(fixture, ORIGIN);
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({
      url: '/news/new-library-hours',
      title: 'New library hours',
      summary: 'Longer opening hours from March.',
    });
  });

  it('falls back to the snippet, then to an untitled page', () => {
    const [, second, third] = parseResults(fixture, ORIGIN);
    expect(second!.summary).toBe('alert(1) Snippet text');
    expect(second!.url).toBe('');
    expect(third).toEqual({ url: 'https://example.com/elsewhere', title: 'Untitled page', summary: '' });
  });

  it('links only http(s) URLs', () => {
    expect(safeUrl('javascript:alert(1)', ORIGIN)).toBe('');
    expect(safeUrl(' JavaScript:alert(1)', ORIGIN)).toBe('');
    expect(safeUrl('data:text/html,x', ORIGIN)).toBe('');
    expect(safeUrl('mailto:a@example.com', ORIGIN)).toBe('');
    expect(safeUrl(42, ORIGIN)).toBe('');
    expect(safeUrl('', ORIGIN)).toBe('');
  });

  it('rejects relative input that resolves to another host', () => {
    expect(safeUrl('//evil.example', ORIGIN)).toBe('');
    expect(safeUrl('/\\evil.example/x', ORIGIN)).toBe('');
    expect(safeUrl('/\t/evil.example/x', ORIGIN)).toBe('');
    expect(safeUrl('\\\\evil.example/x', ORIGIN)).toBe('');
  });

  it('keeps same-site paths and absolute http(s) URLs on any host', () => {
    expect(safeUrl('/about-us', ORIGIN)).toBe('/about-us');
    expect(safeUrl('/news?page=2#top', ORIGIN)).toBe('/news?page=2#top');
    expect(safeUrl('news/item', ORIGIN)).toBe('/news/item');
    expect(safeUrl('https://site.test/events', ORIGIN)).toBe('https://site.test/events');
    expect(safeUrl('HTTPS://example.com', ORIGIN)).toBe('https://example.com/');
    expect(safeUrl('http://other.example/x', ORIGIN)).toBe('http://other.example/x');
  });

  it('strips tags from API strings', () => {
    expect(plainText('<img src=x onerror=alert(1)>Bad & <b>bold</b>')).toBe('Bad & bold');
    expect(plainText(null)).toBe('');
  });

  it('treats a malformed body as no results', () => {
    expect(parseResults(null, ORIGIN)).toEqual([]);
    expect(parseResults({ results: 'nope' }, ORIGIN)).toEqual([]);
    expect(parseResults({ results: [null, 3] }, ORIGIN)).toEqual([]);
  });

  it('writes the status text for every state', () => {
    expect(statusText({ kind: 'idle' })).toBe('');
    expect(statusText({ kind: 'too-short' })).toBe('Enter at least 3 characters to search.');
    expect(statusText({ kind: 'loading', query: 'x' })).toBe('Searching…');
    expect(statusText({ kind: 'results', query: 'li', results: parseResults(fixture, ORIGIN).slice(0, 1) })).toBe(
      'Showing 1 result for “li”'
    );
    expect(statusText({ kind: 'results', query: 'li', results: parseResults(fixture, ORIGIN) })).toBe(
      'Showing 3 results for “li”'
    );
    expect(statusText({ kind: 'empty', query: '<b>x</b>' })).toBe('No results for “<b>x</b>”');
    expect(statusText({ kind: 'error', query: 'x' })).toBe('Search failed.');
  });
});

/** The page markup the script drives, reduced to the hooks it uses. */
const pageHtml = (attrs: string) => `<!doctype html><html><body>
  <div data-quant-search ${attrs}>
    <form><input name="q" /></form>
    <div data-search-ui hidden><p role="status" data-search-status></p><div data-search-error hidden></div></div>
    <div data-search-unconfigured>Not set up</div>
    <div data-search-results hidden><h2 tabindex="-1" data-search-heading>Search results</h2><ul data-search-rows></ul></div>
    <template data-search-template><li class="col-xxs-12"><div class="ct-snippet"><div class="ct-snippet__title"><a class="ct-snippet__title-link" href="/">Result title</a></div><div class="ct-paragraph ct-snippet__summary">Result summary</div></div></li></template>
  </div></body></html>`;

function mount(attrs: string) {
  const { document } = parseHTML(pageHtml(attrs));
  return document.querySelector('[data-quant-search]') as unknown as HTMLElement;
}

const okResponse = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

describe('rendering', () => {
  it('fills cloned Snippets with textContent only, one <li> per result', () => {
    const root = mount('data-site-id="abc"');
    const rows = root.querySelector('[data-search-rows]') as HTMLElement;
    const template = root.querySelector('template') as HTMLTemplateElement;
    renderResults(rows, template, parseResults(fixture, ORIGIN));

    expect(rows.querySelectorAll(':scope > li')).toHaveLength(3);
    const links = rows.querySelectorAll('.ct-snippet__title-link');
    expect(links).toHaveLength(2);
    expect(links[0]!.getAttribute('href')).toBe('/news/new-library-hours');
    expect(links[1]!.getAttribute('href')).toBe('https://example.com/elsewhere');
    expect(rows.querySelector('img, script, b, mark')).toBeNull();
    // A rejected URL (javascript:) renders the title as text, with no link.
    const second = rows.querySelectorAll('.ct-snippet__title')[1]!;
    expect(second.textContent).toBe('Bad & bold');
    expect(second.querySelector('a')).toBeNull();
    // A result with no summary drops the summary paragraph.
    expect(rows.querySelectorAll('.ct-snippet__summary')).toHaveLength(2);
  });
});

describe('initQuantSearch', () => {
  it('makes no request and shows the Callout when no site ID is set', async () => {
    const root = mount('data-site-id="" data-enabled="true"');
    const fetchImpl = vi.fn();
    expect(await initQuantSearch(root, fetchImpl, at('?q=library'))).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect((root.querySelector('[data-search-unconfigured]') as HTMLElement).hidden).toBe(false);
    expect((root.querySelector('[data-search-ui]') as HTMLElement).hidden).toBe(true);
  });

  it('makes no request when search is disabled in settings', async () => {
    const root = mount('data-site-id="abc" data-enabled="false"');
    const fetchImpl = vi.fn();
    expect(await initQuantSearch(root, fetchImpl, at('?q=library'))).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('makes no request for a two-character query', async () => {
    const root = mount('data-site-id="abc"');
    const fetchImpl = vi.fn();
    const state = await initQuantSearch(root, fetchImpl, at('?q=ab'));
    expect(state).toEqual({ kind: 'too-short' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(root.querySelector('[data-search-status]')!.textContent).toBe('Enter at least 3 characters to search.');
  });

  it('POSTs the query with the configured limit and renders the results', async () => {
    vi.useFakeTimers();
    const root = mount('data-site-id="abc" data-api-origin="https://search.test" data-limit="5"');
    const heading = root.querySelector('[data-search-heading]') as HTMLElement;
    const focus = vi.fn();
    heading.focus = focus;
    const fetchImpl = vi.fn(() => okResponse(fixture));
    const state = await initQuantSearch(root, fetchImpl, at('?q=library'));

    expect(fetchImpl).toHaveBeenCalledWith('https://search.test/v1/public/sites/abc/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'library', limit: 5 }),
    });
    expect(state?.kind).toBe('results');
    expect((root.querySelector('input') as HTMLInputElement).value).toBe('library');
    expect((root.querySelector('[data-search-results]') as HTMLElement).hidden).toBe(false);
    expect(root.querySelectorAll('[data-search-rows] .ct-snippet')).toHaveLength(3);
    expect(root.querySelector('[data-search-status]')!.textContent).toBe('Showing 3 results for “library”');

    // The count is announced first; focus follows after FOCUS_DELAY_MS.
    expect(focus).not.toHaveBeenCalled();
    vi.advanceTimersByTime(FOCUS_DELAY_MS);
    expect(focus).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('shows the empty state for no results', async () => {
    const root = mount('data-site-id="abc"');
    const state = await initQuantSearch(root, () => okResponse({ results: [] }), at('?q=zzz'));
    expect(state).toEqual({ kind: 'empty', query: 'zzz' });
    expect((root.querySelector('[data-search-results]') as HTMLElement).hidden).toBe(true);
    expect(root.querySelector('[data-search-status]')!.textContent).toBe('No results for “zzz”');
  });

  it('shows the error state for an HTTP error or a network failure', async () => {
    const config = { siteId: 'abc', apiOrigin: '', limit: 10, enabled: true };
    const notOk = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    expect(await fetchState(config, 'x', notOk, ORIGIN)).toEqual({ kind: 'error', query: 'x' });
    expect(await fetchState(config, 'x', () => Promise.reject(new Error('offline')), ORIGIN)).toEqual({
      kind: 'error',
      query: 'x',
    });

    const root = mount('data-site-id="abc"');
    await initQuantSearch(root, notOk, at('?q=library'));
    expect((root.querySelector('[data-search-error]') as HTMLElement).hidden).toBe(false);
  });
});
