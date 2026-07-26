/**
 * Recovers a page whose stylesheets 404'd after a deploy.
 *
 * Next fingerprints CSS by content, so any deploy that changes a style
 * publishes new filenames and retires the old ones. A browser still holding the
 * previous HTML — a restored Safari tab, a back/forward-cache entry, a
 * home-screen shortcut — asks for filenames that no longer exist, gets 404s,
 * and paints unstyled. The document is sent `no-store`, so a fresh fetch always
 * fixes it; the page simply never asks for one on its own.
 *
 * This ships as an inline script rather than a React component for a reason
 * that only shows up under test: when a route's CSS fails, webpack's chunk load
 * for the layout that imported it fails too ("Loading chunk N failed"), so the
 * layout's JS never executes. Anything React-mounted would be dead in exactly
 * the situation it exists for. Written into the HTML by the server, this runs
 * whether or not a single chunk loads.
 *
 * A 404'd sheet still appears in `document.styleSheets`, just with no rules —
 * so emptiness, not absence, is what marks a link as failed.
 *
 * `sessionStorage` caps it at one attempt per tab, so a genuinely broken deploy
 * degrades to an unstyled page rather than a reload loop.
 */
export const STYLESHEET_RECOVERY = `(function(){
  try {
    var KEY = 'em-css-recovered';
    function check() {
      var links = document.querySelectorAll('link[rel="stylesheet"][href]');
      if (!links.length) return;
      var ok = {};
      var sheets = document.styleSheets;
      for (var i = 0; i < sheets.length; i++) {
        var s = sheets[i];
        if (!s.href) continue;
        try { if (s.cssRules && s.cssRules.length > 0) ok[s.href] = 1; }
        catch (e) { ok[s.href] = 1; }
      }
      var broken = 0;
      for (var j = 0; j < links.length; j++) {
        if (!ok[links[j].href]) broken++;
      }
      if (!broken) return;
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, '1');
      location.reload();
    }
    if (document.readyState === 'complete') setTimeout(check, 1200);
    else window.addEventListener('load', function () { setTimeout(check, 1200); });
  } catch (e) {
    /* Storage or DOM unavailable: leave the page exactly as it is. */
  }
})();`;
