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

/**
 * Shim: dismiss support for server-rendered alerts.
 *
 * `behaviours/alert.js` attaches its dismiss listeners only from `insert()`,
 * which runs after a successful fetch from `data-alert-endpoint`. A static
 * site renders its alerts at build time and has no endpoint, so that code
 * path never runs and the close button would do nothing. The listener is
 * therefore added here, in the shim file, rather than by editing the
 * vendored behaviour.
 *
 * Behaviour mirrors `CivicThemeAlert.prototype.dismiss`/`setCookieValue`
 * exactly: remove the `[data-component-name="ct-alert"]` element from its
 * `[data-component-name="ct-alerts"]` container, then record the alert id
 * against a hash of its HTML-stripped markup in the `ct-alert-hide` cookie
 * (upstream persists in a cookie, not in localStorage). On the next page
 * load the same cookie is read back and matching alerts are removed, which
 * is the static equivalent of `filter()`'s `hasCookieValue` skip.
 */
const CT_ALERT_COOKIE = 'ct-alert-hide';

const ctAlertRemoveHtml = (string) =>
  string
    .replace(/(\r\n|\n|\r)/g, '')
    .replace(/\s/g, '')
    .replace(/(&nbsp;|<([^>]+)>)/gi, '')
    .trim();

const ctAlertHashString = (string) => {
  let hash = 0;
  if (string.length === 0) return hash;
  for (let i = 0; i < string.length; i++) {
    hash = (hash << 5) - hash + string.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

const ctAlertGetCookie = () => {
  const values = document.cookie.split(';').filter((item) => item.trim().startsWith(`${CT_ALERT_COOKIE}=`));
  if (values.length !== 1) return {};
  try {
    return JSON.parse(values[0].trim().replace(`${CT_ALERT_COOKIE}=`, '')) || {};
  } catch (e) {
    return {};
  }
};

const ctAlertSetCookie = (value) => {
  document.cookie = `${CT_ALERT_COOKIE}=${JSON.stringify(value)}; SameSite=Strict; Path=/`;
};

document.querySelectorAll('[data-component-name="ct-alerts"]').forEach((container) => {
  // Re-apply previous dismissals to the build-time markup.
  const cookie = ctAlertGetCookie();
  container.querySelectorAll('[data-component-name="ct-alert"]').forEach((alert) => {
    const id = alert.getAttribute('data-alert-id');
    if (id && id in cookie && cookie[id] === ctAlertHashString(ctAlertRemoveHtml(alert.outerHTML))) {
      alert.remove();
    }
  });

  container.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-alert-dismiss-trigger]');
    if (!trigger) return;
    event.stopPropagation();
    const alert = trigger.closest('[data-component-name="ct-alert"]');
    if (!alert || !container.contains(alert)) return;
    const id = alert.getAttribute('data-alert-id');
    const markup = alert.outerHTML;
    alert.parentNode.removeChild(alert);
    if (id) {
      const current = ctAlertGetCookie();
      current[id] = ctAlertHashString(ctAlertRemoveHtml(markup));
      ctAlertSetCookie(current);
    }
  });
});
