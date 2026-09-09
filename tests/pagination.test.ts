import { describe, it, expect } from 'vitest';
import type { PaginateFunction } from 'astro';
import { PAGE_SIZE, listingPaths, paginationItems } from '../src/lib/pagination';

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

  it('keeps page one on the bare collection path and numbers the rest', () => {
    const paths = listingPaths(fakePaginate, entries) as unknown as Array<{ params: { page?: string } }>;
    expect(paths[0]!.params.page).toBeUndefined();
    expect(paths[1]!.params.page).toBe('2');
  });

  it('produces a single page when the collection fits on one', () => {
    const paths = listingPaths(fakePaginate, entries.slice(0, 6)) as unknown as unknown[];
    expect(paths).toHaveLength(1);
  });
});

describe('paginationItems', () => {
  it('links page one to the base path and later pages to numbered paths', () => {
    const items = paginationItems({ currentPage: 1, lastPage: 2 }, '/events');
    expect(Object.keys(items.pages)).toEqual(['1', '2']);
    expect(items.pages['1']).toEqual({ href: '/events' });
    expect(items.pages['2']).toEqual({ href: '/events/2' });
  });

  it('clamps previous on the first page and next on the last page', () => {
    const first = paginationItems({ currentPage: 1, lastPage: 2 }, '/news');
    expect(first.previous).toEqual({ href: '/news' });
    expect(first.next).toEqual({ href: '/news/2' });

    const last = paginationItems({ currentPage: 2, lastPage: 2 }, '/news');
    expect(last.previous).toEqual({ href: '/news' });
    expect(last.next).toEqual({ href: '/news/2' });
  });

  it('always supplies first and last targets — Pagination disables, never omits, them', () => {
    const items = paginationItems({ currentPage: 1, lastPage: 3 }, '/publications');
    expect(items.first).toEqual({ href: '/publications' });
    expect(items.last).toEqual({ href: '/publications/3' });
  });
});
