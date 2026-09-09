import { getCollection, type CollectionEntry } from 'astro:content';

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

/** Public URL for a collection entry: pages live at the site root, everything else under its collection path. */
export function entryUrl(collection: CardCollection, id: string): string {
  return collection === 'pages' ? `/${id}` : `/${collection}/${id}`;
}
