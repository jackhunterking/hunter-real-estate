import { type EquitonProperty, type InvestmentMode, equitonProperties } from "../equitonMapData";
import { getTierAccent } from "../tiers";
import type { ArcGisModules } from "./types";

export type GraphicsState = {
  selectedId: string;
  mode: InvestmentMode;
  hoveredId: string | null;
  isolate: boolean;
};

type RGBA = [number, number, number, number];

const HOVER_COLOR: RGBA = [31, 239, 161, 0.98];
const DISTRIBUTION_COLOR: RGBA = [159, 232, 178, 0.95];
const APPRECIATION_COLOR: RGBA = [159, 177, 199, 0.95];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const int = parseInt(
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value,
    16,
  );
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function accentFor(property: EquitonProperty, state: GraphicsState): RGBA {
  const selected = property.id === state.selectedId;
  const hovered = property.id === state.hoveredId;

  if (hovered) return HOVER_COLOR;
  if (selected && state.mode === "distribution") return DISTRIBUTION_COLOR;
  if (selected && state.mode === "appreciation") return APPRECIATION_COLOR;

  const [r, g, b] = hexToRgb(getTierAccent(property));
  const dimmed = state.isolate && !selected;
  const alpha = dimmed ? 0.16 : selected ? 0.98 : 0.72;
  return [r, g, b, alpha];
}

/**
 * Builds one marker + label graphic per property a single time, then mutates
 * their symbols in place on every state change. This replaces the previous
 * approach of `graphicsLayer.removeAll()` + full rebuild on each hover, which
 * was the biggest source of lag.
 */
export function buildPropertyGraphics(modules: ArcGisModules, graphicsLayer: Record<string, any>) {
  const { Graphic, Point, SimpleMarkerSymbol, TextSymbol } = modules;
  const markers = new Map<string, Record<string, any>>();
  const labels = new Map<string, Record<string, any>>();

  const graphics: Record<string, any>[] = [];

  equitonProperties.forEach((property) => {
    const point = new Point({
      latitude: property.latitude,
      longitude: property.longitude,
      spatialReference: { wkid: 4326 },
    });
    const attributes = { propertyId: property.id, name: property.name, address: property.address };

    const marker = new Graphic({
      geometry: point,
      elevationInfo: { mode: "relative-to-scene", offset: 1 },
      attributes,
      symbol: new SimpleMarkerSymbol({ style: "circle", color: [235, 199, 107, 0.72], size: 10 }),
    });
    const label = new Graphic({
      geometry: point,
      elevationInfo: { mode: "relative-to-scene", offset: 3.5 },
      attributes,
      symbol: new TextSymbol({ text: property.name }),
    });

    markers.set(property.id, marker);
    labels.set(property.id, label);
    graphics.push(marker, label);
  });

  graphicsLayer.addMany(graphics);

  function update(state: GraphicsState) {
    equitonProperties.forEach((property) => {
      const selected = property.id === state.selectedId;
      const hovered = property.id === state.hoveredId;
      const emphasized = selected || hovered;
      const accent = accentFor(property, state);
      const marker = markers.get(property.id);
      const label = labels.get(property.id);
      if (!marker || !label) return;

      marker.elevationInfo = { mode: "relative-to-scene", offset: emphasized ? 1.8 : 1 };
      marker.symbol = new SimpleMarkerSymbol({
        style: "circle",
        color: accent,
        size: hovered ? 18 : selected ? 15 : 10,
        outline: {
          color: hovered ? [31, 239, 161, 1] : [5, 8, 14, 0.95],
          width: hovered ? 3.5 : selected ? 2.5 : 1.5,
        },
      });

      const labelAlpha = state.isolate && !selected && !hovered ? 0.2 : selected ? 1 : 0.82;
      label.elevationInfo = { mode: "relative-to-scene", offset: emphasized ? 5 : 3.5 };
      label.symbol = new TextSymbol({
        text: property.name,
        color: hovered ? [230, 255, 245, 1] : [255, 255, 255, labelAlpha],
        haloColor: [5, 8, 14, 0.92],
        haloSize: hovered ? 1.6 : 1,
        horizontalAlignment: "center",
        verticalAlignment: "bottom",
        yoffset: emphasized ? 9 : 6,
        font: {
          family: "Avenir Next, Arial, sans-serif",
          size: hovered ? 13 : selected ? 12 : 10,
          weight: "bold",
        },
      });
    });
  }

  return { update };
}

export type PropertyGraphicsController = ReturnType<typeof buildPropertyGraphics>;
