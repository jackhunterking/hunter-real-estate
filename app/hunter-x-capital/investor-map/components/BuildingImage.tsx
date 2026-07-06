import { useEffect, useState } from "react";
import { type EquitonProperty } from "../equitonMapData";
import { esriSatelliteUrl } from "../imagery";

/**
 * Shows a real aerial view of the building from Esri World Imagery, falling back
 * to the listing photo if the imagery can't load.
 */
export function BuildingImage({ property }: { property: EquitonProperty }) {
  const satellite = esriSatelliteUrl(property.latitude, property.longitude);
  const [src, setSrc] = useState(satellite);

  useEffect(() => {
    setSrc(esriSatelliteUrl(property.latitude, property.longitude));
  }, [property.latitude, property.longitude]);

  return (
    <img
      src={src}
      alt={`Aerial view of ${property.name}`}
      loading="lazy"
      onError={() => {
        if (src !== property.imageUrl) setSrc(property.imageUrl);
      }}
    />
  );
}
