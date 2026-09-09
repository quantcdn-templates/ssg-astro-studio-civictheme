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
 * next/last links at the ends of the range; it derives the disabled state
 * from `current` and `totalPages`, not from whether an `href` is present.
 * Page hrefs are built from `base` through `pageHref`, so they match the
 * route's own `/<collection>/page/N` URLs.
 *
 * `previous`/`next` omit `href` when they are the disabled end of the
 * range (page one has no previous; the last page has no next), instead of
 * clamping to the current page. Upstream `link.twig` renders `href` even
 * on a disabled link when one is passed in — `Link.astro` stays faithful
 * to that (markup-fidelity rule) — so the fix belongs here, at the
 * application call site that builds the `items` object, not in the
 * vendored component. Omitting `href` keeps every `.ct-link--disabled`
 * element genuinely inert: no `href` means no destination and no
 * keyboard focus, which is what the WCAG 1.4.3 "inactive control"
 * contrast exemption requires (see `tests/e2e/a11y.spec.ts`'s
 * `.ct-link--disabled` guard). `first`/`last` are unaffected — they stay
 * always-present per the addendum, only `previous`/`next` change.
 */
export function paginationItems(page: Pick<Page, 'currentPage' | 'lastPage'>, base: string): PaginationItems {
  const href = (pageNumber: number) => pageHref(base, pageNumber);
  const pages: Record<string, { href?: string }> = {};
  for (let pageNumber = 1; pageNumber <= page.lastPage; pageNumber += 1) {
    pages[String(pageNumber)] = { href: href(pageNumber) };
  }
  const isFirst = page.currentPage <= 1;
  const isLast = page.currentPage >= page.lastPage;
  return {
    first: { href: href(1) },
    previous: isFirst ? {} : { href: href(page.currentPage - 1) },
    pages,
    next: isLast ? {} : { href: href(page.currentPage + 1) },
    last: { href: href(page.lastPage) },
  };
}
