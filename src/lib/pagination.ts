import type { PaginateFunction, Page } from 'astro';

/** Entries per listing page, as the design specifies. */
export const PAGE_SIZE = 10;

/**
 * `getStaticPaths` result for a paginated listing route.
 *
 * Wraps Astro's own `paginate()` so all three listing routes share one page
 * size. With a rest parameter (`[...page].astro`) the first page keeps the
 * bare collection path (`/events`) and later pages append their number
 * (`/events/2`).
 */
export function listingPaths<T extends Record<string, unknown>>(
  paginate: PaginateFunction,
  entries: T[]
): ReturnType<PaginateFunction> {
  return paginate(entries, { pageSize: PAGE_SIZE });
}

interface LinkTarget {
  text?: string;
  href?: string;
}

export interface PaginationItems {
  first?: LinkTarget;
  previous?: LinkTarget;
  pages: Record<string, { href?: string }>;
  next?: LinkTarget;
  last?: LinkTarget;
}

/**
 * The CivicTheme `Pagination` molecule's `items` object for one Astro page.
 *
 * `Pagination` disables — rather than omits — the first/previous and
 * next/last links at the ends of the range, so every target is always
 * present; it derives the disabled state from `current` and `totalPages`.
 * Page hrefs are built from `base` so they match the route's own URLs.
 */
export function paginationItems(page: Pick<Page, 'currentPage' | 'lastPage'>, base: string): PaginationItems {
  const href = (pageNumber: number) => (pageNumber === 1 ? base : `${base}/${pageNumber}`);
  const pages: Record<string, { href?: string }> = {};
  for (let pageNumber = 1; pageNumber <= page.lastPage; pageNumber += 1) {
    pages[String(pageNumber)] = { href: href(pageNumber) };
  }
  return {
    first: { href: href(1) },
    previous: { href: href(Math.max(1, page.currentPage - 1)) },
    pages,
    next: { href: href(Math.min(page.lastPage, page.currentPage + 1)) },
    last: { href: href(page.lastPage) },
  };
}
