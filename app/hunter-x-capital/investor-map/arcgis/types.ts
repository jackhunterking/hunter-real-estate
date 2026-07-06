// Shared ArcGIS SDK typings for the investor map. The SDK is loaded from Esri's
// CDN (AMD), so these are intentionally loose structural types.

export type ArcGisModule = new (options?: Record<string, unknown>) => Record<string, any>;

export type ArcGisRequire = (
  modules: string[],
  callback: (...loadedModules: ArcGisModule[]) => void,
  errback?: (error: unknown) => void,
) => void;

export type ArcGisModules = {
  Map: ArcGisModule;
  SceneView: ArcGisModule;
  SceneLayer: ArcGisModule;
  GraphicsLayer: ArcGisModule;
  Graphic: ArcGisModule;
  Point: ArcGisModule;
  SimpleMarkerSymbol: ArcGisModule;
  TextSymbol: ArcGisModule;
};

export type MapTheme = "dark" | "light";

declare global {
  interface Window {
    require?: ArcGisRequire;
  }
}
