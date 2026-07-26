"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { tx } from "@/lib/i18n/localize";
import {
  BUILDING_PLACEHOLDER_GRADIENT,
  initialsFrom,
  isRendering,
  localizeRendering,
  type MapProperty,
} from "@/lib/equity-market/present";
import { cn } from "@/lib/utils";
import { loadLeafletCluster } from "./leaflet-loader";

type Status = "loading" | "ready" | "error";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
const TILE_ATTR = "© OpenStreetMap contributors © CARTO";
const PIN_RED = "#e23b2e"; // familiar Google-map marker red
const PIN_NAVY = "#1e3378"; // navy — the selected building
// Detail zoom for a selected building: close enough that the surrounding streets
// and blocks read, so "where exactly is this" is answerable on the map itself
// (zoomToShowLayer alone stops as soon as the pin un-clusters — a city-wide view).
const DETAIL_ZOOM = 16;

/**
 * Outbound Google Maps link for a building. We send the exact coordinates, NOT
 * the address text: handing Google an address makes it re-geocode and auto-aim
 * its Street View preview from the nearest panorama toward the point it picked.
 * When that panorama sits right in front of the building, the auto-heading is
 * unstable and flips to the far side of the road — showing the house across the
 * street instead of the building (the same "pano on top of the address" problem
 * scripts/street-view-overrides.json corrects for our own card images). Our
 * stored point sits clearly off the road on the building's side, so a coordinate
 * query drops the pin on the building and aims the preview at it; Google still
 * reverse-geocodes the address for the panel label. Address text is only a
 * fallback for the (unexpected) case of a building with no coordinates.
 */
function googleMapsUrl(p: MapProperty) {
  if (p.latitude || p.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
  }
  const query = p.address?.trim() || [p.name, p.city, p.province].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// "Opens elsewhere" glyph (lucide ExternalLink) for the popup's Google Maps
// affordance — icon only, no words. Constant markup with no interpolated data,
// so assigning it via innerHTML on the DOM-built popup can't inject anything.
const EXTERNAL_LINK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M15 3h6v6"/><path d="M10 14 21 3"/>'
  + '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/>'
  + '</svg>';

/**
 * Google-style teardrop pin as an inline SVG. `fill` colors the drop; the white
 * ring + inner dot are the classic marker read. Sized per state so the selected
 * building sits proud of the red field.
 */
function pinSvg(fill: string, w: number, h: number) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
    + `<path d="M13 1C6.4 1 1 6.4 1 13c0 8.4 10.2 22.6 11.2 23.9a1 1 0 0 0 1.6 0C14.8 35.6 25 21.4 25 13 25 6.4 19.6 1 13 1Z" fill="${fill}" stroke="#ffffff" stroke-width="1.6"/>`
    + `<circle cx="13" cy="13" r="4.4" fill="#ffffff"/>`
    + `</svg>`;
}

function pinIcon(L: Record<string, any>, selected: boolean) {
  const w = selected ? 34 : 27;
  const h = selected ? 50 : 39;
  return L.divIcon({
    html: `<div class="legacy-pin${selected ? " is-selected" : ""}">${pinSvg(selected ? PIN_NAVY : PIN_RED, w, h)}</div>`,
    className: "legacy-pin-wrap",
    iconSize: [w, h],
    iconAnchor: [w / 2, h], // tip sits on the coordinate
    popupAnchor: [0, -h + 6],
    tooltipAnchor: [0, -h + 10],
  });
}

/** Cluster badge: red disc with a soft halo + white count, so a stack of pins reads as "N buildings" at any zoom. */
function clusterIcon(L: Record<string, any>, count: number) {
  const size = count < 10 ? 40 : count < 25 ? 46 : 52;
  return L.divIcon({
    html: `<div class="legacy-cluster" style="width:${size}px;height:${size}px"><span>${count}</span></div>`,
    className: "legacy-cluster-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Minimal on-map card: real photo + name + location + asset class / fund.
 * Built from DOM nodes with textContent (never interpolated HTML) so CMS
 * strings like the building name can't inject markup. `showOffering` is off in
 * the single-investment embed — the fund is already the page you're on, so the
 * tag would only repeat it.
 */
function buildPopupContent(
  p: MapProperty,
  viewListingLabel: string,
  openInMapsLabel: string,
  renderingLabel: string,
  showOffering: boolean,
) {
  const el = document.createElement("div");
  el.className = "fund-popup";

  // Media — the real photo when we have one, otherwise the same navy placeholder
  // tile the building cards use. Always shown so the popup reads as a card.
  const media = document.createElement("div");
  media.className = "fund-popup-media";
  if (p.image?.src) {
    const img = document.createElement("img");
    img.src = p.image.src;
    img.alt = p.name;
    img.loading = "lazy";
    media.appendChild(img);
    // An architect's rendering is labelled as one, so the popup never reads as
    // a photograph of a building that looks like this today.
    if (isRendering(p.image)) {
      const tag = document.createElement("span");
      tag.className = "fund-popup-rendering";
      tag.textContent = renderingLabel;
      media.appendChild(tag);
    }
  } else {
    const placeholder = document.createElement("div");
    placeholder.style.cssText =
      `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background-image:${BUILDING_PLACEHOLDER_GRADIENT};`;
    const initials = document.createElement("span");
    initials.style.cssText =
      "font-family:var(--serif);font-size:26px;font-weight:600;color:rgba(255,255,255,0.85);";
    initials.textContent = initialsFrom(p.name);
    placeholder.appendChild(initials);
    media.appendChild(placeholder);
  }
  if (showOffering && p.offeringName) {
    const fund = document.createElement("span");
    fund.className = "fund-popup-fund";
    fund.textContent = p.offeringName;
    media.appendChild(fund);
  }
  // Icon-only outbound link to Google Maps, tucked in the photo's bottom-right
  // corner. No label — the glyph on a location card implies "open where this is";
  // the address goes to the accessible name for screen readers and the tooltip.
  const maps = document.createElement("a");
  maps.href = googleMapsUrl(p);
  maps.target = "_blank";
  maps.rel = "noreferrer";
  maps.className = "fund-popup-maps";
  maps.title = openInMapsLabel;
  maps.setAttribute("aria-label", openInMapsLabel);
  maps.innerHTML = EXTERNAL_LINK_SVG;
  media.appendChild(maps);
  el.appendChild(media);

  const body = document.createElement("div");
  body.className = "fund-popup-body";

  const title = document.createElement("strong");
  title.className = "fund-popup-title";
  title.textContent = p.name;
  body.appendChild(title);

  const loc = document.createElement("span");
  loc.className = "fund-popup-loc";
  loc.textContent = `${p.city}, ${p.province}`;
  body.appendChild(loc);

  if (p.listingUrl) {
    const link = document.createElement("a");
    link.href = p.listingUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "fund-popup-link";
    link.textContent = viewListingLabel;
    body.appendChild(link);
  }

  el.appendChild(body);
  return el;
}

export function FundMap({
  properties,
  selectedId,
  onSelect,
  variant = "embed",
}: {
  properties: MapProperty[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  variant?: "embed" | "full";
}) {
  const { t, lang } = useLang();
  const m = t.capitalApp.map;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Record<string, any> | null>(null);
  const leafletRef = useRef<Record<string, any> | null>(null);
  const markersRef = useRef<Map<string, Record<string, any>>>(new Map());
  const clusterRef = useRef<Record<string, any> | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  // Set while we close/remove popups programmatically, so the `popupclose`
  // handler doesn't mistake a teardown or a marker switch for a user close.
  const suppressPopupCloseRef = useRef(false);
  // Popup label read through a ref so the marker-build effect stays keyed only
  // on [status, properties] (properties already change when language changes).
  const viewListingLabelRef = useRef(t.capitalApp.portfolio.viewListing);
  viewListingLabelRef.current = t.capitalApp.portfolio.viewListing;
  const openInMapsLabelRef = useRef(t.capitalApp.portfolio.openInMaps);
  openInMapsLabelRef.current = t.capitalApp.portfolio.openInMaps;
  const renderingLabelRef = useRef(localizeRendering(lang));
  renderingLabelRef.current = localizeRendering(lang);
  const [status, setStatus] = useState<Status>("loading");

  // Stable fingerprint of the marker data. The parent recomputes `properties`
  // into a fresh array on every render (including every selection change), so
  // the marker-build effect keys on this string rather than the array identity.
  // Otherwise selecting a building would tear down and refit the whole cluster
  // (a visible zoom-out) while the selection effect raced `zoomToShowLayer`
  // against the rebuild — the crash. The signature only changes when the actual
  // building data (or its localized labels/photos) changes.
  const signature = useMemo(
    () =>
      properties
        .map((p) =>
          [p.id, p.latitude, p.longitude, p.name, p.city, p.province, p.offeringName ?? "", p.image?.src ?? "", p.listingUrl ?? ""].join("|"),
        )
        .join("~"),
    [properties],
  );

  useEffect(() => {
    let cancelled = false;
    let invalidateTimer: ReturnType<typeof setTimeout> | undefined;
    loadLeafletCluster()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        leafletRef.current = L;
        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: false,
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
        });
        mapRef.current = map;
        L.control.zoom({ position: "topright" }).addTo(map);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTR, subdomains: "abcd", maxZoom: 19 }).addTo(map);
        map.setView([56, -96], 3);
        setStatus("ready");
        invalidateTimer = setTimeout(() => {
          if (mapRef.current === map) map.invalidateSize();
        }, 0);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      try {
        suppressPopupCloseRef.current = true;
        mapRef.current?.stop();
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      markersRef.current = new Map();
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (status !== "ready" || !L || !map) return;

    suppressPopupCloseRef.current = true;
    if (clusterRef.current) map.removeLayer(clusterRef.current);
    clusterRef.current = null;
    suppressPopupCloseRef.current = false;

    // Buildings sit in tight per-city knots (11 in Lethbridge, 6 in North
    // Battleford, …), so plain markers collapse to a handful of dots when the
    // whole portfolio is in view. The cluster group keeps a counted badge at
    // every zoom and spiderfies pins that share a coordinate.
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40,
      iconCreateFunction: (c: Record<string, any>) => clusterIcon(L, c.getChildCount()),
    });
    const markers = new Map<string, Record<string, any>>();
    const latlngs: [number, number][] = [];

    properties.forEach((p) => {
      const marker = L.marker([p.latitude, p.longitude], {
        icon: pinIcon(L, p.id === selectedIdRef.current),
        riseOnHover: true,
      });
      marker.on("click", () => onSelectRef.current(p.id));
      marker.bindTooltip(p.name, { direction: "top" });
      marker.bindPopup(buildPopupContent(p, viewListingLabelRef.current, openInMapsLabelRef.current, renderingLabelRef.current, variant !== "embed"), {
        maxWidth: 272,
        minWidth: 272,
        closeButton: true,
        autoPan: true,
        autoPanPadding: [24, 24],
        className: "fund-popup-wrap",
      });
      // Closing the popup (its × or a click away) clears the selection so the
      // aside highlight follows. Guarded so a marker→marker switch (which closes
      // the previous popup) and teardown don't wrongly deselect.
      marker.on("popupclose", () => {
        if (suppressPopupCloseRef.current) return;
        if (selectedIdRef.current === p.id) onSelectRef.current(null);
      });
      cluster.addLayer(marker);
      markers.set(p.id, marker);
      latlngs.push([p.latitude, p.longitude]);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;
    markersRef.current = markers;

    // Frame the buildings. invalidateSize() first, because this effect can run
    // before the map's box has settled (it lives well below the fold) and
    // fitBounds on a stale/zero-sized map pins to maxZoom over empty space.
    // Selection no longer rebuilds the cluster, so this is the only fit — we also
    // re-frame on the next tick to correct a late layout (invalidateSize forces a
    // fresh size read either way).
    const frame = () => {
      if (mapRef.current !== map) return;
      map.invalidateSize();
      if (latlngs.length === 1) map.setView(latlngs[0], 12, { animate: false });
      else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [44, 44], maxZoom: 12, animate: false });
    };
    frame();
    // Deferred re-frame only when nothing is selected, so it corrects a premature
    // initial fit without ever overriding the selection effect's zoom-to-marker.
    const refitTimer = setTimeout(() => {
      if (!selectedIdRef.current) frame();
    }, 0);
    return () => clearTimeout(refitTimer);
    // Keyed on `signature`, not `properties`: `properties` is a fresh reference
    // every render, so depending on it would rebuild + refit on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, signature]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (status !== "ready" || !L) return;
    // Recolor pins to reflect the current selection. Iterate the live marker map
    // (not `properties`) so this effect doesn't depend on that fresh-every-render
    // array — selection alone must never trigger a cluster rebuild.
    markersRef.current.forEach((mk, id) => mk.setIcon(pinIcon(L, id === selectedId)));
    if (selectedId && cluster) {
      const mk = markersRef.current.get(selectedId);
      if (mk && map) {
        // Close in to a street-level detail zoom first so the building's
        // surroundings are visible, then let the cluster reveal it. Pre-zooming
        // means zoomToShowLayer finds a lone building already visible (immediate
        // popup) and spiderfies coincident pins at the detail zoom rather than
        // stopping at the low zoom where they merely un-cluster.
        if (map.getZoom() < DETAIL_ZOOM) map.setView(mk.getLatLng(), DETAIL_ZOOM, { animate: false });
        cluster.zoomToShowLayer(mk, () => mk.openPopup());
      }
    } else if (map) {
      map.closePopup();
    }
    // `signature` (not `properties`) so a genuine data change re-opens the
    // selected popup, but a plain re-render does not.
  }, [status, selectedId, signature]);

  function reset() {
    const map = mapRef.current;
    if (!map || !properties.length) return;
    const latlngs = properties.map((p) => [p.latitude, p.longitude] as [number, number]);
    if (latlngs.length === 1) map.setView(latlngs[0], 12, { animate: false });
    else map.fitBounds(latlngs, { padding: [44, 44], maxZoom: 12, animate: false });
  }


  return (
    <div className={cn("relative z-0 grid gap-3.5 md:grid-cols-[minmax(0,1fr)_360px]", variant === "full" ? "md:h-[min(72vh,680px)]" : "md:h-[440px]")}>
      <div className="isolate relative z-0 overflow-hidden rounded-xl border border-border bg-muted">
        <div ref={containerRef} className="absolute inset-0 z-0 max-md:relative max-md:h-80" />
        {status === "loading" && (
          <div className="absolute inset-0 z-10 grid place-items-center text-sm text-muted-foreground">{m.loading}</div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 z-10 grid place-items-center gap-1 p-6 text-center text-sm text-muted-foreground">
            <strong className="text-foreground">{m.error}</strong>
            <span>{m.errorHint}</span>
          </div>
        )}
        {status === "ready" && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            <span className="rounded-full bg-card/90 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm">
              {properties.length} {t.capitalApp.common.buildings}
            </span>
            <button type="button" onClick={reset} className="rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm hover:text-primary/80">
              {m.reset}
            </button>
          </div>
        )}
      </div>

      <aside className="flex min-h-0 flex-col gap-2.5 overflow-y-auto rounded-xl border border-border bg-card p-3.5 max-md:max-h-80">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {properties.map((p) => (
            <li key={p.id}>
              <article
                className={cn(
                  "grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3 rounded-lg border p-2.5 transition-colors",
                  p.id === selectedId ? "border-primary bg-secondary/50" : "border-transparent bg-muted/50 hover:border-border",
                )}
              >
                {p.image?.src ? (
                  <span className="relative block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image.src}
                      alt={tx(p.image.alt, lang) ?? p.name}
                      className="aspect-[4/3] w-full rounded-md border border-border object-cover"
                    />
                    {isRendering(p.image) && (
                      <span className="absolute inset-x-0 bottom-0 rounded-b-md bg-background/85 px-1 py-0.5 text-center text-[9px] font-semibold leading-tight text-muted-foreground">
                        {localizeRendering(lang)}
                      </span>
                    )}
                  </span>
                ) : (
                  <div
                    className="flex aspect-[4/3] w-full items-center justify-center rounded-md border border-border"
                    style={{ backgroundImage: BUILDING_PLACEHOLDER_GRADIENT }}
                    aria-hidden
                  >
                    <span className="font-serif text-sm font-semibold text-white/85">
                      {initialsFrom(p.name)}
                    </span>
                  </div>
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect(p.id === selectedId ? null : p.id)}
                    aria-pressed={p.id === selectedId}
                    className="min-w-0 text-left"
                  >
                    <span className="block text-[13px] font-semibold leading-snug text-foreground">{p.name}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs leading-snug text-muted-foreground">
                      <MapPin className="size-3 shrink-0 text-primary/70" aria-hidden />
                      <span className="truncate">{p.city}, {p.province}</span>
                    </span>
                    {variant !== "embed" && p.offeringName && <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-primary">{p.offeringName}</span>}
                  </button>
                  {p.listingUrl && (
                    <a
                      href={p.listingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 self-start text-xs font-semibold leading-snug text-primary hover:underline"
                    >
                      <span className="truncate">{t.capitalApp.portfolio.viewListing}</span>
                      <ArrowUpRight className="size-3" aria-hidden />
                    </a>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
