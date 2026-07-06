import type { ArcGisModules, ArcGisRequire, MapTheme } from "./types";

const ARC_GIS_VERSION = "4.31";
const ARC_GIS_SCRIPT_URL = `https://js.arcgis.com/${ARC_GIS_VERSION}/`;
const ARC_GIS_DARK_CSS_URL = `https://js.arcgis.com/${ARC_GIS_VERSION}/esri/themes/dark/main.css`;
const ARC_GIS_LIGHT_CSS_URL = `https://js.arcgis.com/${ARC_GIS_VERSION}/esri/themes/light/main.css`;
const ARC_GIS_SCRIPT_ID = "arcgis-maps-sdk-script";
const ARC_GIS_DARK_CSS_ID = "arcgis-maps-sdk-css-dark";
const ARC_GIS_LIGHT_CSS_ID = "arcgis-maps-sdk-css-light";

export const ARC_GIS_BUILDINGS_URL =
  "https://basemaps3d.arcgis.com/arcgis/rest/services/Open3D_Buildings_v1/SceneServer";

const MODULE_NAMES = [
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/TextSymbol",
];

let arcGisLoader: Promise<ArcGisModules> | null = null;

function ensureThemeLink(id: string, href: string, disabled: boolean) {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
  link.disabled = disabled;
}

/** Load both ArcGIS theme stylesheets once; only the active theme is enabled. */
function loadArcGisCss(theme: MapTheme) {
  ensureThemeLink(ARC_GIS_DARK_CSS_ID, ARC_GIS_DARK_CSS_URL, theme !== "dark");
  ensureThemeLink(ARC_GIS_LIGHT_CSS_ID, ARC_GIS_LIGHT_CSS_URL, theme !== "light");
}

/** Toggle the enabled ArcGIS theme stylesheet without reloading the SDK. */
export function setArcGisTheme(theme: MapTheme) {
  const dark = document.getElementById(ARC_GIS_DARK_CSS_ID) as HTMLLinkElement | null;
  const light = document.getElementById(ARC_GIS_LIGHT_CSS_ID) as HTMLLinkElement | null;
  if (dark) dark.disabled = theme !== "dark";
  if (light) light.disabled = theme !== "light";
}

export function loadArcGisModules(theme: MapTheme = "dark") {
  if (arcGisLoader) return arcGisLoader;

  arcGisLoader = new Promise<ArcGisModules>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("ArcGIS can only load in the browser."));
      return;
    }

    loadArcGisCss(theme);

    const loadModules = () => {
      const arcGisRequire = (window as Window & { require?: ArcGisRequire }).require;
      if (typeof arcGisRequire !== "function") {
        reject(new Error("ArcGIS module loader is unavailable."));
        return;
      }

      arcGisRequire(
        MODULE_NAMES,
        (Map, SceneView, SceneLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, TextSymbol) => {
          resolve({
            Map,
            SceneView,
            SceneLayer,
            GraphicsLayer,
            Graphic,
            Point,
            SimpleMarkerSymbol,
            TextSymbol,
          });
        },
        reject,
      );
    };

    const existingRequire = (window as Window & { require?: ArcGisRequire }).require;
    if (typeof existingRequire === "function") {
      loadModules();
      return;
    }

    const existingScript = document.getElementById(ARC_GIS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", loadModules, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = ARC_GIS_SCRIPT_ID;
    script.src = ARC_GIS_SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", loadModules, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.body.appendChild(script);
  });

  return arcGisLoader;
}
