/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Quant AI Search site ID. Quant Studio injects it per environment; never commit it. */
  readonly PUBLIC_QUANT_SEARCH_SITE_ID?: string;
  /** Quant AI Search API origin. Defaults to `https://ai-search.quantcdn.io`. */
  readonly PUBLIC_QUANT_SEARCH_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
