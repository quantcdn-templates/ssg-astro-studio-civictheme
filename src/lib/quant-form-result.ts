/**
 * Quant Forms result message.
 *
 * A form with `method="post"` posts to its own page. On Quant, the CDN
 * answers that POST with the same page and writes the outcome into the
 * element with `id="quant-form-result"` (as a `.quant-form-success` or
 * `.quant-form-error` child holding the message from `forms/forms.json`).
 * The reply is a new page load, so an `aria-live` region would not announce
 * it: this moves focus to the message instead, which also scrolls it into
 * view.
 *
 * The CDN matches the literal text `id="quant-form-result">`, so `id` must be
 * the element's LAST attribute (see `src/content/pages/contact-us.mdx`).
 */
export const FORM_RESULT_ID = 'quant-form-result';

/** Focuses a filled-in form result. Returns whether it did. */
export function focusFormResult(doc: Document): boolean {
  const result = doc.getElementById(FORM_RESULT_ID);
  if (!result || result.childElementCount === 0) return false;
  result.focus();
  return true;
}
