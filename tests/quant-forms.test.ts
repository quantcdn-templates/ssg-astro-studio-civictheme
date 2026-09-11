import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { focusFormResult } from '../src/lib/quant-form-result';

/**
 * The Quant Forms manifest (`forms/forms.json`) against the demo forms it
 * configures. Studio syncs each entry to the CDN on publish
 * (`FormSyncService`); the CDN then accepts a POST to `route`, rejects it
 * when a `mandatory_fields` value is empty or a `honeypot_fields` value is
 * filled, and writes the matching message into `#quant-form-result`.
 */
const root = join(__dirname, '..');
type Entry = { route: string; enabled: boolean; config: Record<string, unknown> };
const manifest = JSON.parse(readFileSync(join(root, 'forms/forms.json'), 'utf8')) as Entry[];
const pageSource = (route: string) => readFileSync(join(root, `src/content/pages${route}.mdx`), 'utf8');

/** The CDN's own rewrite (quant `docker/fastly/src/filters.js`, `formSubmissionFilter`). */
const cdnInject = (html: string, message: string) =>
  html.replace(
    /id\s*=\s*(?:"quant-form-result"|'quant-form-result'|quant-form-result)\s*>/gi,
    `id="quant-form-result"><div class='quant-form-success'>${message}</div>`
  );

describe('forms/forms.json', () => {
  it('configures the contact and subscribe forms', () => {
    expect(manifest.map((entry) => entry.route)).toEqual(['/contact-us', '/subscribe']);
  });

  for (const entry of manifest) {
    describe(entry.route, () => {
      const source = pageSource(entry.route);
      const config = entry.config;

      it('matches a form that POSTs to its own page', () => {
        expect(entry.enabled).toBe(true);
        expect(config.target_url).toBe(entry.route);
        expect(source).toContain(`<form action="${entry.route}" method="post"`);
      });

      it('names only fields the form has, and the honeypot field exists', () => {
        const fields = [...(config.mandatory_fields as string[]), ...(config.honeypot_fields as string[])];
        for (const field of fields) expect(source).toContain(`name="${field}"`);
        expect(config.honeypot_fields).toEqual(['website']);
      });

      it('keeps every message within the API limit of 256 characters', () => {
        for (const key of ['success_message', 'error_message_mandatory', 'error_message_generic']) {
          const message = config[key] as string;
          expect(message).toMatch(/^<div class="ct-message ct-theme-light ct-message--(success|error)">/);
          expect(message.length).toBeLessThanOrEqual(256);
        }
      });

      it('commits no notification targets', () => {
        expect(config).not.toHaveProperty('notifications');
      });

      it('ends the result container with its id, so the CDN rewrite matches', () => {
        expect(source).toMatch(/<div[^>]*\sid="quant-form-result"><\/div>/);
        expect(cdnInject(source, 'Sent')).toContain(
          `id="quant-form-result"><div class='quant-form-success'>Sent</div></div>`
        );
      });
    });
  }
});

describe('focusFormResult', () => {
  const page = (inner: string) =>
    parseHTML(`<!doctype html><html><body><div tabindex="-1" id="quant-form-result">${inner}</div></body></html>`)
      .document as unknown as Document;

  it('does nothing while the result is empty', () => {
    expect(focusFormResult(page(''))).toBe(false);
  });

  it('focuses a result the CDN filled in', () => {
    const doc = page(`<div class='quant-form-success'>Thank you.</div>`);
    const result = doc.getElementById('quant-form-result')!;
    let focused = false;
    result.focus = () => {
      focused = true;
    };
    expect(focusFormResult(doc)).toBe(true);
    expect(focused).toBe(true);
  });
});
