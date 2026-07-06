// Keyless real aerial imagery of a building by coordinate, using the same
// Esri World Imagery service the 3D scene already relies on. Returns a static
// JPEG from the MapServer `export` operation (no API key required).

const MERCATOR_R = 20037508.342789244;

function toWebMercator(latitude: number, longitude: number) {
  const x = (longitude * MERCATOR_R) / 180;
  const y = (Math.log(Math.tan(((90 + latitude) * Math.PI) / 360)) / (Math.PI / 180)) * (MERCATOR_R / 180);
  return { x, y };
}

/**
 * Static Esri World Imagery tile centred on a building.
 * @param spanMeters  ground width covered by the image (smaller = closer).
 */
export function esriSatelliteUrl(
  latitude: number,
  longitude: number,
  spanMeters = 260,
  width = 800,
  height = 450,
) {
  const { x, y } = toWebMercator(latitude, longitude);
  const halfWidth = spanMeters / 2;
  const halfHeight = (halfWidth * height) / width;
  const params = new URLSearchParams({
    bbox: `${x - halfWidth},${y - halfHeight},${x + halfWidth},${y + halfHeight}`,
    bboxSR: "3857",
    imageSR: "3857",
    size: `${width},${height}`,
    format: "jpg",
    transparent: "false",
    f: "image",
  });
  return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?${params.toString()}`;
}
