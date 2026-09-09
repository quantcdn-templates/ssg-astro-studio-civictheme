import { describe, it, expect } from 'vitest';
import type { PaginateFunction } from 'astro';
import { PAGE_SIZE, listingPaths, pageHref, paginationItems } from '../src/lib/pagination';

// A type alias, not an interface: an interface has no implicit index
// signature, so it would not satisfy `listingPaths`'s
// `Record<string, unknown>` constraint.
type Entry = { id: string };

/** Twelve synthetic entries: enough to exercise a partial last page. */
const entries: Entry[] = Array.from({ length: 12 }, (_, i) => ({ id: `entry-${i + 1}` }));

/**
 * Minimal stand-in for Astro's `paginate()`, implementing only the part of the
 * contract `listingPaths` relies on: slice `data` into `pageSize` chunks and
 * report `currentPage`/`lastPage`. Astro itself is not run in unit tests.
 */
const fakePaginate = ((data: Entry[], args: { pageSize: number }) => {
  const lastPage = Math.max(1, Math.ceil(data.length / args.pageSize));
  return Array.from({ length: lastPage }, (_, i) => ({
    params: { page: i === 0 ? undefined : String(i + 1) },
    props: {
      page: {
        data: data.slice(i * args.pageSize, (i + 1) * args.pageSize),
        currentPage: i + 1,
        lastPage,
        size: args.pageSize,
        total: data.length,
      },
    },
  }));
}) as unknown as PaginateFunction;

describe('PAGE_SIZE', () => {
  it('is ten entries per page, as the design specifies', () => {
    expect(PAGE_SIZE).toBe(10);
  });
});

describe('listingPaths', () => {
  it('splits twelve entries into two pages of ten and two', () => {
    const paths = listingPaths(fakePaginate, entries) as unknown as Array<{
      params: { page?: string };
      props: { page: { data: Entry[]; currentPage: number; lastPage: number } };
    }>;

    expect(paths).toHaveLength(2);
    expect(paths.map((p) => p.props.page.data.length)).toEqual([10, 2]);
    expect(paths.map((p) => p.props.page.currentPage)).toEqual([1, 2]);
    expect(paths.every((p) => p.props.page.lastPage === 2)).toBe(true);
  });

  it('keeps page one on the bare collection path and puts the rest under page/', () => {
    const paths = listingPaths(fakePaginate, entries) as unknown as Array<{ params: { page?: string } }>;
    expect(paths[0]!.params.page).toBeUndefined();
    expect(paths[1]!.params.page).toBe('page/2');
  });

  it('never emits a bare numeric rest parameter, which would collide with [slug]', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ id: `entry-${i + 1}` }));
    const paths = listingPaths(fakePaginate, many) as unknown as Array<{ params: { page?: string } }>;
    expect(paths).toHaveLength(3);
    expect(paths.map((p) => p.params.page)).toEqual([undefined, 'page/2', 'page/3']);
    for (const path of paths.slice(1)) {
      expect(path.params.page).not.toMatch(/^\d+$/);
    }
  });

  it('produces a single page when the collection fits on one', () => {
    const paths = listingPaths(fakePaginate, entries.slice(0, 6)) as unknown as unknown[];
    expect(paths).toHaveLength(1);
  });
});

describe('pageHref', () => {
  it('keeps page one bare and puts later pages under page/', () => {
    expect(pageHref('/events', 1)).toBe('/events');
    expect(pageHref('/events', 2)).toBe('/events/page/2');
    expect(pageHref('/events', 7)).toBe('/events/page/7');
  });
});

describe('paginationItems', () => {
  it('links page one to the base path and later pages under page/', () => {
    const items = paginationItems({ currentPage: 1, lastPage: 2 }, '/events');
    expect(Object.keys(items.pages)).toEqual(['1', '2']);
    expect(items.pages['1']).toEqual({ href: '/events' });
    expect(items.pages['2']).toEqual({ href: '/events/page/2' });
  });

  it('links next on the first page and previous on the last page normally', () => {
    const first = paginationItems({ currentPage: 1, lastPage: 2 }, '/news');
    expect(first.next).toEqual({ href: '/news/page/2' });

    const last = paginationItems({ currentPage: 2, lastPage: 2 }, '/news');
    expect(last.previous).toEqual({ href: '/news' });
  });

  it('omits href on the disabled end of the range instead of clamping to the current page', () => {
    // Page one: previous is disabled, so it must carry no href — Pagination
    // derives isDisabled from current/lastPage, not from href presence, but
    // a disabled link with an href fails the a11y guard (tests/e2e/a11y.spec.ts).
    const first = paginationItems({ currentPage: 1, lastPage: 3 }, '/news');
    expect(first.previous).toEqual({});
    expect(first.previous?.href).toBeUndefined();

    // Last page: next is disabled, so it must carry no href.
    const last = paginationItems({ currentPage: 3, lastPage: 3 }, '/news');
    expect(last.next).toEqual({});
    expect(last.next?.href).toBeUndefined();

    // A single-page listing is disabled on both ends simultaneously.
    const only = paginationItems({ currentPage: 1, lastPage: 1 }, '/news');
    expect(only.previous).toEqual({});
    expect(only.next).toEqual({});
  });

  it('always supplies first and last targets — Pagination disables, never omits, them', () => {
    const items = paginationItems({ currentPage: 1, lastPage: 3 }, '/publications');
    expect(items.first).toEqual({ href: '/publications' });
    expect(items.last).toEqual({ href: '/publications/page/3' });
  });

  it('never produces a bare numeric segment under the collection path', () => {
    const items = paginationItems({ currentPage: 2, lastPage: 4 }, '/events');
    expect(items.previous?.href).toBeDefined();
    expect(items.next?.href).toBeDefined();
    const hrefs = [items.first, items.previous, items.next, items.last]
      .map((target) => target?.href)
      .concat(Object.values(items.pages).map((target) => target.href));
    for (const href of hrefs) {
      expect(href).not.toMatch(/^\/events\/\d+$/);
    }
  });
});
