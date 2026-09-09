// Loads the vendored CivicTheme behaviours once and re-runs their initialisers after
// Astro client-side navigation. Vendored files under ./behaviours/ are never edited;
// any shim required to make a behaviour init-safe lives only in this file.
//
// Init-contract findings (see PORTING.md for the full record):
// - None of the vendored behaviours listen for `DOMContentLoaded` — each self-initialises
//   by running `document.querySelectorAll('[data-x]').forEach(...)` directly at the top
//   level of its module, once, when the module is evaluated (this matches the upstream
//   source verbatim — .upstream/uikit's collapsible.js and mobile-navigation's flyout.js
//   have no `DOMContentLoaded` listener either). Because `./behaviours/index.js` is a
//   singleton ES module, that top-level init runs exactly once no matter how many times
//   it is imported, so the `astro:page-load` → `DOMContentLoaded` re-dispatch below does
//   not currently re-run anything (no listener exists to catch it). It is kept only as
//   forward-compatible scaffolding for when Task 15 (BaseLayout, possibly View
//   Transitions) needs a real re-init hook; it is a documented no-op today, not a bug.
// - Double-init guards (safe to invoke `new CivicTheme*(el)` twice on the same element):
//   collapsible.js (`data-collapsible==='true'`), flyout.js (`data-flyout==='true'`),
//   scrollspy.js (`data-scrollspy==='true'`), table-of-contents.js
//   (`data-table-of-contents-initialised`) — all guarded.
//   tabs.js and skip-to-target.js have NO such guard: re-invoking their constructors on
//   an already-initialised element re-attaches duplicate event listeners. Both used on
//   this page (Tabs; BackToTop's skip-to-target button). No shim is added here because
//   there is currently no mechanism that re-invokes them (see previous point) — flagged
//   here and in PORTING.md so Task 15 adds an idempotency guard before wiring a real
//   client-side re-init.
// - No behaviour references `Drupal`, `drupalSettings` or `once()` — no Drupal-global
//   shim is required.
import './behaviours/index.js';

function reinit() {
  // Behaviours attach on DOMContentLoaded; after an Astro page swap fire it again on the
  // new document. See the note above: this is currently inert (no vendored behaviour
  // listens for this event) and is kept as forward-compatible scaffolding.
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: false }));
}
document.addEventListener('astro:page-load', reinit);
