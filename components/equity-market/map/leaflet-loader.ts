// Loads Leaflet from CDN once (no npm dependency, no bundle weight) and resolves
// the global `L`. Lightweight 2D replacement for the removed ArcGIS 3D map.

const LEAFLET_VERSION = "1.9.4";
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const CSS_ID = "leaflet-css";
const JS_ID = "leaflet-js";

// Leaflet.markercluster — groups overlapping/same-city building pins into a
// counted cluster so a portfolio of 30 buildings never renders as "8 dots".
const MC_VERSION = "1.5.3";
const MC_CSS_URL = `https://unpkg.com/leaflet.markercluster@${MC_VERSION}/dist/MarkerCluster.css`;
const MC_CSS_DEFAULT_URL = `https://unpkg.com/leaflet.markercluster@${MC_VERSION}/dist/MarkerCluster.Default.css`;
const MC_JS_URL = `https://unpkg.com/leaflet.markercluster@${MC_VERSION}/dist/leaflet.markercluster.js`;
const MC_CSS_ID = "leaflet-markercluster-css";
const MC_CSS_DEFAULT_ID = "leaflet-markercluster-css-default";
const MC_JS_ID = "leaflet-markercluster-js";

let loader: Promise<Record<string, any>> | null = null;
let clusterLoader: Promise<Record<string, any>> | null = null;

export function loadLeaflet(): Promise<Record<string, any>> {
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Leaflet can only load in the browser."));
      return;
    }
    const w = window as Window & { L?: Record<string, any> };
    if (w.L) {
      resolve(w.L);
      return;
    }

    if (!document.getElementById(CSS_ID)) {
      const link = document.createElement("link");
      link.id = CSS_ID;
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);
    }

    const done = () => (w.L ? resolve(w.L) : reject(new Error("Leaflet failed to initialise.")));
    const existing = document.getElementById(JS_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = JS_ID;
    script.src = JS_URL;
    script.async = true;
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.body.appendChild(script);
  });

  return loader;
}

function ensureStylesheet(id: string, href: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Resolves Leaflet with the markercluster plugin attached (`L.markerClusterGroup`).
 * Loads Leaflet first, then the plugin's CSS + JS from the same CDN. Cached like
 * `loadLeaflet` so repeated maps share one load.
 */
export function loadLeafletCluster(): Promise<Record<string, any>> {
  if (clusterLoader) return clusterLoader;

  clusterLoader = loadLeaflet().then(
    (L) =>
      new Promise<Record<string, any>>((resolve, reject) => {
        if (typeof L.markerClusterGroup === "function") {
          resolve(L);
          return;
        }
        ensureStylesheet(MC_CSS_ID, MC_CSS_URL);
        ensureStylesheet(MC_CSS_DEFAULT_ID, MC_CSS_DEFAULT_URL);

        const done = () =>
          typeof L.markerClusterGroup === "function"
            ? resolve(L)
            : reject(new Error("Leaflet.markercluster failed to initialise."));
        const existing = document.getElementById(MC_JS_ID) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", done, { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.id = MC_JS_ID;
        script.src = MC_JS_URL;
        script.async = true;
        script.addEventListener("load", done, { once: true });
        script.addEventListener("error", reject, { once: true });
        document.body.appendChild(script);
      }),
  );

  return clusterLoader;
}
