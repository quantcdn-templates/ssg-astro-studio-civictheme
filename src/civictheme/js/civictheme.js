// Loads the vendored CivicTheme behaviours. Vendored files under ./behaviours/ are
// never edited; a shim, if one is ever required, would live only in this file.
//
// Init contract: every vendored behaviour self-initialises at module-evaluation time —
// each runs `document.querySelectorAll('[data-x]').forEach(...)` directly at the top
// level of its module, once (this matches upstream verbatim; none of them listen for
// `DOMContentLoaded`). That means this module must be loaded as a deferred module
// script, after the DOM it queries already exists — which is exactly how Astro loads a
// hoisted `<script>` containing an `import` (it's emitted as `<script type="module">`,
// and module scripts are deferred by the platform).
//
// This template deliberately does NOT enable Astro's `<ClientRouter>` (view
// transitions): every navigation is a full page load, so the behaviours above simply
// re-run naturally on each page — there is no swapped-in DOM needing a manual re-init.
// Adding `<ClientRouter>` would require a real re-init hook, but the vendored
// constructors (`CivicThemeCollapsible`, `CivicThemeTabs`, etc.) are module-private —
// never exported — so nothing outside `./behaviours/*.js` can re-invoke them; and
// `tabs.js`/`skip-to-target.js` have no double-init guard, so re-running the top-level
// `querySelectorAll` init a second time (e.g. via a page swap) would attach duplicate
// event listeners. Wiring view transitions safely would need an upstream change to
// export initialisers (and add the missing guards) at the next vendoring pass — see
// PORTING.md.
import './behaviours/index.js';
