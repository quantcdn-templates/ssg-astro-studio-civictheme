import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type CardCollection = 'events' | 'news' | 'publications' | 'pages';

export interface MenuRow {
  label: string;
  url: string;
  parent?: string;
}

export interface MenuNode {
  title: string;
  url: string;
  below: MenuNode[];
  inActiveTrail?: boolean;
}

/** Sort options for `listPublished`. */
export type ListSort = 'date-desc' | 'date-asc' | 'title';

/** The date field each card collection uses for chronological sort. */
function primaryDate(entry: CollectionEntry<CardCollection>): Date {
  const data = entry.data as Record<string, unknown>;
  return (data.startDate as Date) ?? (data.date as Date) ?? (data.updated as Date) ?? new Date(0);
}

function matchesTopics(entry: CollectionEntry<CardCollection>, topics?: string[]): boolean {
  if (!topics || topics.length === 0) return true;
  const entryTopics = (entry.data as { topics?: string[] }).topics ?? [];
  return entryTopics.some((topic) => topics.includes(topic));
}

function compareEntries(
  a: CollectionEntry<CardCollection>,
  b: CollectionEntry<CardCollection>,
  sort: ListSort
): number {
  if (sort === 'title') return a.data.title.localeCompare(b.data.title);
  const direction = sort === 'date-asc' ? 1 : -1;
  return (primaryDate(a).valueOf() - primaryDate(b).valueOf()) * direction;
}

/** Published (non-draft), optionally topic-filtered and sorted, entries of one card collection. */
export async function listPublished(
  collection: CardCollection,
  opts?: { topics?: string[]; limit?: number; sort?: ListSort }
): Promise<CollectionEntry<CardCollection>[]> {
  const sort = opts?.sort ?? 'date-desc';
  const entries = await getCollection(collection, ({ data }) => !data.draft);
  const filtered = entries.filter((entry) => matchesTopics(entry, opts?.topics));
  const sorted = filtered.sort((a, b) => compareEntries(a, b, sort));
  return typeof opts?.limit === 'number' ? sorted.slice(0, opts.limit) : sorted;
}

/** Alerts that are active and within their optional start/end window at `now`. */
export async function activeAlerts(now: Date = new Date()): Promise<CollectionEntry<'alerts'>[]> {
  const alerts = await getCollection('alerts');
  return alerts.filter((alert) => {
    if (!alert.data.active) return false;
    if (alert.data.startDate && now < alert.data.startDate) return false;
    if (alert.data.endDate && now > alert.data.endDate) return false;
    return true;
  });
}

/** Nests flat `{ label, url, parent }` rows into a tree keyed by parent label. */
export function menuTree(rows: MenuRow[]): MenuNode[] {
  const topLevel: MenuNode[] = [];
  const byLabel = new Map<string, MenuNode>();

  for (const row of rows) {
    if (row.parent) continue;
    const node: MenuNode = { title: row.label, url: row.url, below: [] };
    byLabel.set(row.label, node);
    topLevel.push(node);
  }

  for (const row of rows) {
    if (!row.parent) continue;
    const parent = byLabel.get(row.parent);
    if (!parent) continue;
    parent.below.push({ title: row.label, url: row.url, below: [] });
  }

  return topLevel;
}

/**
 * Public URL for a collection entry: pages live at the site root, everything
 * else under its collection path. The `pages` entry with id `index` is the
 * home page and maps to `/`.
 */
export function entryUrl(collection: CardCollection, id: string): string {
  if (collection !== 'pages') return `/${collection}/${id}`;
  return id === 'index' ? '/' : `/${id}`;
}

/** The single `settings/site.json` entry's data. */
export async function siteSettings(): Promise<CollectionEntry<'settings'>['data']> {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('src/content/settings/site.json is missing');
  return entry.data;
}

/** One named menu (`primary`, `secondary`, `footer`) as a nested tree. */
export async function menu(name: string): Promise<MenuNode[]> {
  const entry = await getEntry('navigation', name);
  return entry ? menuTree(entry.data.items) : [];
}

/** Marks the item (and its ancestors) whose `url` matches `pathname` as in the active trail. */
export function withActiveTrail(items: MenuNode[], pathname: string): MenuNode[] {
  const normalise = (url: string) => (url.length > 1 ? url.replace(/\/$/, '') : url);
  const current = normalise(pathname);
  return items.map((item) => {
    const below = withActiveTrail(item.below, pathname);
    const active = normalise(item.url) === current || below.some((child) => child.inActiveTrail);
    return { ...item, below, inActiveTrail: active };
  });
}

/** Humanises a URL path segment into a title (`for-businesses` → `For businesses`). */
export function humanise(segment: string): string {
  const words = segment.replace(/[-_]/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Breadcrumb links for a `pages` entry, derived from its folder path.
 *
 * Each ancestor segment resolves to the title of the `pages` entry with that
 * id when one exists, and to the humanised segment otherwise. The trail always
 * starts at Home and ends with the current page (rendered as the active,
 * non-linked crumb by `Breadcrumb`).
 */
export async function breadcrumbForPage(
  entry: CollectionEntry<'pages'>
): Promise<Array<{ text: string; url: string }>> {
  const pages = await getCollection('pages');
  const titleById = new Map(pages.map((page) => [page.id, page.data.title]));
  const links = [{ text: 'Home', url: '/' }];
  const segments = entry.id.split('/');
  for (let i = 0; i < segments.length - 1; i += 1) {
    const id = segments.slice(0, i + 1).join('/');
    links.push({ text: titleById.get(id) ?? humanise(segments[i]!), url: `/${id}` });
  }
  links.push({ text: entry.data.title, url: entryUrl('pages', entry.id) });
  return links;
}

/** Side-navigation items: every published page sharing `section`, ordered by `order` then title. */
export async function sectionNav(section: string, currentUrl: string): Promise<MenuNode[]> {
  const pages = await getCollection('pages', ({ data }) => !data.draft && data.section === section);
  return pages
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title))
    .map((page) => {
      const url = entryUrl('pages', page.id);
      return { title: page.data.title, url, below: [], inActiveTrail: url === currentUrl };
    });
}
