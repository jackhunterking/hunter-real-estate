"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { tx } from "@/lib/i18n/localize";
import type { MapProperty } from "@/lib/capital/present";
import { cn } from "@/lib/utils";
import { BuildingMapThumb } from "./BuildingMapThumb";
import { loadLeaflet } from "./leaflet-loader";

type Status = "loading" | "ready" | "error";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
const TILE_ATTR = "© OpenStreetMap contributors © CARTO";
const SELECTED = "#1e3378"; // navy

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
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    let invalidateTimer: ReturnType<typeof setTimeout> | undefined;
    loadLeaflet()
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
        mapRef.current?.stop();
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      markersRef.current = new Map();
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (status !== "ready" || !L || !map) return;

    markersRef.current.forEach((mk) => map.removeLayer(mk));
    const markers = new Map<string, Record<string, any>>();
    const latlngs: [number, number][] = [];

    properties.forEach((p) => {
      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: p.accent,
        fillOpacity: 0.95,
      });
      marker.on("click", () => onSelectRef.current(p.id));
      marker.bindTooltip(p.name, { direction: "top", offset: [0, -6] });
      marker.addTo(map);
      markers.set(p.id, marker);
      latlngs.push([p.latitude, p.longitude]);
    });

    markersRef.current = markers;
    if (latlngs.length === 1) map.setView(latlngs[0], 12, { animate: false });
    else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [44, 44], maxZoom: 12, animate: false });
    const invalidateTimer = setTimeout(() => {
      if (mapRef.current === map) map.invalidateSize();
    }, 0);
    return () => clearTimeout(invalidateTimer);
  }, [status, properties]);

  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready") return;
    properties.forEach((p) => {
      const mk = markersRef.current.get(p.id);
      if (!mk) return;
      const sel = p.id === selectedId;
      mk.setStyle({ radius: sel ? 13 : 9, weight: sel ? 3 : 2, color: sel ? SELECTED : "#ffffff", fillColor: p.accent });
      if (sel) mk.bringToFront();
    });
    if (selectedId && map) {
      const p = properties.find((x) => x.id === selectedId);
      if (p) map.setView([p.latitude, p.longitude], 14, { animate: false });
    }
  }, [status, selectedId, properties]);

  function reset() {
    const map = mapRef.current;
    if (!map || !properties.length) return;
    const latlngs = properties.map((p) => [p.latitude, p.longitude] as [number, number]);
    if (latlngs.length === 1) map.setView(latlngs[0], 12, { animate: false });
    else map.fitBounds(latlngs, { padding: [44, 44], maxZoom: 12, animate: false });
  }

  const selected = properties.find((p) => p.id === selectedId) ?? null;

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
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{m.portfolioBuildings}</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {properties.map((p) => (
            <li key={p.id}>
              <article
                className={cn(
                  "grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-lg border p-2.5 transition-colors",
                  p.id === selectedId ? "border-primary bg-secondary/50" : "border-transparent bg-muted/50 hover:border-border",
                )}
              >
                {p.image?.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image.src}
                    alt={tx(p.image.alt, lang) ?? p.name}
                    className="aspect-[4/3] w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <BuildingMapThumb
                    latitude={p.latitude}
                    longitude={p.longitude}
                    query={`${p.address ?? p.name}, ${p.city}, ${p.province}`}
                    label={p.name}
                    className="w-full rounded-md border border-border"
                  />
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect(p.id === selectedId ? null : p.id)}
                    aria-pressed={p.id === selectedId}
                    className="min-w-0 text-left"
                  >
                    <span className="block text-[13px] font-semibold leading-snug text-foreground">{p.name}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{p.city}, {p.province}</span>
                    {p.offeringName && <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-primary">{p.offeringName}</span>}
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

        {selected && (
          <div className="mt-auto border-t border-border pt-3">
            <h3 className="font-serif text-[17px] font-semibold text-foreground">{selected.name}</h3>
            <p className="mb-2 text-[12.5px] text-muted-foreground">{selected.city}, {selected.province}</p>
            <dl className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2"><dt className="text-[10.5px] font-semibold text-muted-foreground">{lang === "tr" ? "Adres" : "Address"}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.address ?? (lang === "tr" ? "Mevcut değil" : "Unavailable")}</dd></div>
              {selected.offeringName && <div><dt className="text-[10.5px] font-semibold text-muted-foreground">{lang === "tr" ? "İlgili fon" : "Related fund"}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.offeringName}</dd></div>}
              <div><dt className="text-[10.5px] font-semibold text-muted-foreground">{t.capitalApp.detail.assetClass}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.assetClass}</dd></div>
              {selected.detail && <div><dt className="text-[10.5px] font-semibold text-muted-foreground">{t.capitalApp.portfolio.size}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.detail}</dd></div>}
              <div><dt className="text-[10.5px] font-semibold text-muted-foreground">{t.capitalApp.portfolio.status}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.status}</dd></div>
              <div><dt className="text-[10.5px] font-semibold text-muted-foreground">{t.capitalApp.portfolio.verification}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.verification}</dd></div>
              <div><dt className="text-[10.5px] font-semibold text-muted-foreground">{lang === "tr" ? "Kaynak" : "Source"}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.sourceId ?? (lang === "tr" ? "Mevcut değil" : "Unavailable")}</dd></div>
              <div><dt className="text-[10.5px] font-semibold text-muted-foreground">{lang === "tr" ? "Bilgi tarihi" : "Information date"}</dt><dd className="text-[13px] font-semibold text-foreground">{selected.asOfDate ?? (lang === "tr" ? "Mevcut değil" : "Unavailable")}</dd></div>
            </dl>
          </div>
        )}
      </aside>
    </div>
  );
}
