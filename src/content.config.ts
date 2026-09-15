import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const theme = z.enum(['light', 'dark']).default('light');
/**
 * A link that is either site-relative (`/x`, `#x`, `./x`) or an absolute
 * `http(s):`/`mailto:` URL. `z.string().url()` alone would reject the
 * relative paths this demo content uses, so the scheme allow-list is
 * applied only to values that carry one.
 */
const linkUrl = z.string().refine((value) => /^(\/|#|\.{1,2}\/)/.test(value) || /^(https?|mailto):/i.test(value), {
  message: 'must be a relative path or an http(s)/mailto URL',
});
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/pages' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    theme,
    bannerType: z.enum(['default', 'large']).default('default'),
    bannerImage: z.string().optional(),
    bannerTheme: z.enum(['light', 'dark']).default('dark'),
    showBreadcrumb: z.boolean().default(true),
    showLastUpdated: z.boolean().default(false),
    /**
     * Show CivicTheme's automatic table of contents (built from the body's
     * H2 headings) above the body, like Drupal's `field_c_n_show_toc`.
     */
    showToc: z.boolean().default(false),
    tocTitle: z.string().default('On this page'),
    topics: z.array(z.string()).default([]),
    section: z.string().optional(),
    draft: z.boolean().default(false),
    order: z.number().default(0),
    updated: z.coerce.date().optional(),
  }),
});
const events = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/events' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.string().optional(),
    image: z.string().optional(),
    topics: z.array(z.string()).default([]),
    theme,
    registrationUrl: linkUrl.optional(),
    draft: z.boolean().default(false),
  }),
});
const news = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/news' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('Your organisation'),
    image: z.string().optional(),
    topics: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});
const publications = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/publications' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    date: z.coerce.date(),
    image: z.string().optional(),
    topics: z.array(z.string()).default([]),
    fileUrl: linkUrl,
    fileFormat: z.enum(['pdf', 'docx', 'xlsx', 'other']).default('pdf'),
    fileSize: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
const alerts = defineCollection({
  loader: glob({ pattern: '**/*.json', base: 'src/content/alerts' }),
  schema: z.object({
    title: z.string(),
    message: z.string(),
    type: z.enum(['information', 'warning', 'error', 'success']).default('information'),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    dismissible: z.boolean().default(true),
    active: z.boolean().default(true),
  }),
});
const navigation = defineCollection({
  loader: glob({ pattern: '*.json', base: 'src/content/navigation' }),
  schema: z.object({ items: z.array(z.object({ label: z.string(), url: z.string(), parent: z.string().optional() })) }),
});
const settings = defineCollection({
  loader: glob({ pattern: '*.json', base: 'src/content/settings' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string().default(''),
    logoLight: z.string(),
    logoDark: z.string(),
    /** Site icon path; defaults to `/favicon.svg`. */
    favicon: z.string().optional(),
    footerText: z.string().default(''),
    acknowledgement: z.string().default(''),
    social: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
    theme,
    /** The native `/search` page (see `src/pages/search.astro`). */
    search: z
      .object({
        enabled: z.boolean().default(true),
        resultsLimit: z.number().int().min(1).max(100).default(10),
        placeholder: z.string().optional(),
      })
      .default({ enabled: true, resultsLimit: 10 }),
  }),
});
export const collections = { pages, events, news, publications, alerts, navigation, settings };
