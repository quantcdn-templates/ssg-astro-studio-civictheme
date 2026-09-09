import type { PaginateFunction, Page } from 'astro';

/** Entries per listing page, as the design specifies. */
export const PAGE_SIZE = 10;

/** URL path of one page of a listing, relative to the listing's base path. */
export function pageHref(base: string, pageNumber: number): string {
  return pageNumber === 1 ? base : `${base}/page/${pageNumber}`;
}

/**
 * `getStaticPaths` result for a paginated listing route.
 *
 * Wraps Astro's own `paginate()` so all three listing routes share one page
 * size, then rewrites the rest parameter so pager pages sit under a `page/`
 * segment: page 1 keeps the bare collection path (`/events`) and later pages
 * become `/events/page/2`, `/events/page/3`, …
 *
 * The `page/` segment is what keeps the pager out of the sibling
 * `[slug].astro` route's namespace. Without it, `/events/2` would be both the
 * second pager page and the detail page of an entry whose id is `2`.
 */
export function listingPaths<T extends Record<string, unknown>>(
  paginate: PaginateFunction,
  entries: T[]
): ReturnType<PaginateFunction> {
  const paths = paginate(entries, { pageSize: PAGE_SIZE });
  return paths.map((path, index) =>
    index === 0 ? path : { ...path, params: { ...path.params, page: `page/${index + 1}` } }
  );
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
 * Page hrefs are built from `base` through `pageHref`, so they match the
 * route's own `/<collection>/page/N` URLs.
 */
export function paginationItems(page: Pick<Page, 'currentPage' | 'lastPage'>, base: string): PaginationItems {
  const href = (pageNumber: number) => pageHref(base, pageNumber);
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
