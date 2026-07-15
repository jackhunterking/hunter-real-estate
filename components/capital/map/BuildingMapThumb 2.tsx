import { MapPin } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const TILE = 256;
const ZOOM = 15;
// Same CARTO basemap the portfolio Leaflet map uses — keyless, no billing.
const tileUrl = (z: number, x: number, y: number) =>
  `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;

/**
 * Keyless static map thumbnail centered on a building's coordinates, built from
 * CARTO map tiles. A 3×3 tile mosaic is positioned so the address sits at the
 * frame center (guaranteeing full coverage without seams), with a pin overlay.
 * Clicking the image opens the real location in Google Maps.
 */
export function BuildingMapThumb({
  latitude,
  longitude,
  label,
  className,
}: {
  latitude: number;
  longitude: number;
  label: string;
  className?: string;
}) {
  const { t } = useLang();
  const n = 2 ** ZOOM;
  const latRad = (latitude * Math.PI) / 180;
  const xTile = ((longitude + 180) / 360) * n;
  const yTile =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const xInt = Math.floor(xTile);
  const yInt = Math.floor(yTile);
  // Pixel of the address within the 3×3 mosaic (center tile is dx=0, dy=0).
  // Rounded to whole pixels so server and client render an identical transform
  // string (avoids a float-precision hydration mismatch).
  const mosaicX = Math.round(TILE + (xTile - xInt) * TILE);
  const mosaicY = Math.round(TILE + (yTile - yInt) * TILE);

  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = ((((xInt + dx) % n) + n) % n);
      const ty = Math.min(Math.max(yInt + dy, 0), n - 1);
      tiles.push({ key: `${dx},${dy}`, tx, ty, left: (dx + 1) * TILE, top: (dy + 1) * TILE });
    }
  }

  return (
    <a
      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
      target="_blank"
      rel="noreferrer"
      title={t.capitalApp.portfolio.openInMaps}
      aria-label={`${label} — ${t.capitalApp.portfolio.openInMaps}`}
      className={cn(
        "relative block aspect-[16/9] overflow-hidden bg-muted",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(${-mosaicX}px, ${-mosaicY}px)` }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tileUrl(ZOOM, tile.tx, tile.ty)}
            alt=""
            width={TILE}
            height={TILE}
            loading="lazy"
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
      </div>
      <MapPin
        aria-hidden
        className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-full text-[#1e3378] drop-shadow-sm"
        fill="#1e3378"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    </a>
  );
}
