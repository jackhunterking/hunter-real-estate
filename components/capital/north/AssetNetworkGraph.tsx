"use client";

/**
 * The relationship graph for the asset network: subject → vehicle → market → asset.
 *
 * Two encoding rules, both load-bearing:
 *
 *   Above the vehicle line, thickness is money. The subject-to-vehicle edge is
 *   weighted by committed dollars, which is our own transaction record and exact.
 *
 *   Below the vehicle line, thickness is COUNT. Allocating a vehicle's capital
 *   across its buildings would need a per-asset value the platform does not hold,
 *   so a market edge is weighted by how many buildings feed it — a fact, not an
 *   estimate.
 *
 * Tiers render only when they have members. An offering with no published
 * property list (a debt or blind-pool vehicle) draws subject → vehicle and stops,
 * which is the correct picture rather than an empty column.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/capital/types";
import type { Building, Focus, Vehicle } from "./AssetNetwork";

export type GraphNode =
  | { kind: "subject"; x: number; y: number; r: number; label: string }
  | { kind: "vehicle"; x: number; y: number; r: number; vehicle: Vehicle }
  | { kind: "market"; x: number; y: number; r: number; city: string; count: number; color: string }
  | { kind: "asset"; x: number; y: number; r: number; building: Building; color: string };

type Edge = { a: GraphNode; b: GraphNode; width: number; color: string };

const GOLD = "#ebc76b";
const GROUND = "#07090c";
const INK = "#d7dee6";
const INK3 = "#5d6874";

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function money(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function NetworkGraph({
  vehicles,
  buildings,
  focus,
  onFocus,
  subject,
  lang,
}: {
  vehicles: Vehicle[];
  buildings: Building[];
  focus: Focus;
  onFocus: (focus: Focus) => void;
  subject: string;
  lang: Lang;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ nodes: GraphNode[]; edges: Edge[]; w: number; h: number }>({
    nodes: [],
    edges: [],
    w: 0,
    h: 0,
  });
  const [tip, setTip] = useState<{ x: number; y: number; title: string; lines: string[] } | null>(null);

  // Ordering markets by vehicle keeps the tiers from crossing.
  const marketOrder = useMemo(() => {
    const out: { city: string; count: number; color: string }[] = [];
    vehicles.forEach((v) => {
      const cities: string[] = [];
      v.buildings.forEach((b) => {
        if (!cities.includes(b.city)) cities.push(b.city);
      });
      cities
        .map((city) => ({
          city,
          count: v.buildings.filter((b) => b.city === city).length,
          color: v.color,
        }))
        .sort((a, b) => b.count - a.count)
        .forEach((row) => out.push(row));
    });
    return out;
  }, [vehicles]);

  const assetOrder = useMemo(
    () => marketOrder.flatMap((m) => buildings.filter((b) => b.city === m.city)),
    [marketOrder, buildings],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const raw = canvas.getContext("2d");
    if (!raw) return;
    const ctx: CanvasRenderingContext2D = raw;

    function layout(w: number, h: number) {
      const nodes: GraphNode[] = [];
      const edges: Edge[] = [];
      const top = 34;
      const bottom = h - 26;
      const mid = (top + bottom) / 2;

      // Tier count decides the column positions, so a vehicle with no property
      // list produces a two-column graph rather than two empty columns.
      const hasMarkets = marketOrder.length > 0;
      const hasAssets = assetOrder.length > 0;
      const xs = hasAssets
        ? [w * 0.09, w * 0.34, w * 0.62, w * 0.9]
        : hasMarkets
          ? [w * 0.12, w * 0.45, w * 0.8]
          : [w * 0.2, w * 0.72];

      const subjectNode: GraphNode = { kind: "subject", x: xs[0], y: mid, r: 9, label: subject };
      nodes.push(subjectNode);

      const totalCommitted = vehicles.reduce((sum, v) => sum + v.committed, 0);
      const vehicleNodes = vehicles.map((v, i) => {
        const node: GraphNode = {
          kind: "vehicle",
          vehicle: v,
          x: xs[1],
          y:
            vehicles.length === 1
              ? mid
              : top + (bottom - top) * (i / (vehicles.length - 1)) * 0.72 + (bottom - top) * 0.14,
          r: 7,
        };
        nodes.push(node);
        // Above the vehicle line: thickness is money.
        const share = totalCommitted > 0 ? v.committed / totalCommitted : 0;
        edges.push({
          a: subjectNode,
          b: node,
          width: v.held ? 1.2 + share * 5 : 0.8,
          color: v.color,
        });
        return node;
      });

      if (hasMarkets) {
        const maxCount = Math.max(...marketOrder.map((m) => m.count), 1);
        const marketNodes = marketOrder.map((m, i) => {
          const node: GraphNode = {
            kind: "market",
            city: m.city,
            count: m.count,
            color: m.color,
            x: xs[2],
            y:
              marketOrder.length === 1
                ? mid
                : top + (bottom - top) * (i / (marketOrder.length - 1)),
            r: 5,
          };
          nodes.push(node);
          const owner = vehicleNodes.find(
            (v) => v.kind === "vehicle" && v.vehicle.buildings.some((b) => b.city === m.city),
          );
          // Below the vehicle line: thickness is count.
          if (owner) {
            edges.push({ a: owner, b: node, width: 0.7 + (m.count / maxCount) * 2.4, color: m.color });
          }
          return node;
        });

        if (hasAssets) {
          assetOrder.forEach((b, i) => {
            const color = vehicles.find((v) => v.id === b.vehicleId)?.color ?? "#6d86d6";
            const node: GraphNode = {
              kind: "asset",
              building: b,
              color,
              x: xs[3],
              y:
                assetOrder.length === 1
                  ? mid
                  : top + (bottom - top) * (i / (assetOrder.length - 1)),
              r: 3,
            };
            nodes.push(node);
            const market = marketNodes.find((m) => m.kind === "market" && m.city === b.city);
            if (market) edges.push({ a: market, b: node, width: 0.6, color });
          });
        }
      }

      stateRef.current = { nodes, edges, w, h };
    }

    function dimmed(node: GraphNode) {
      if (!focus) return false;
      if (focus.type === "vehicle") {
        if (node.kind === "vehicle") return node.vehicle.id !== focus.key;
        if (node.kind === "market") {
          return !vehicles.find((v) => v.id === focus.key)?.buildings.some((b) => b.city === node.city);
        }
        if (node.kind === "asset") return node.building.vehicleId !== focus.key;
        return false;
      }
      if (node.kind === "market") return node.city !== focus.key;
      if (node.kind === "asset") return node.building.city !== focus.key;
      return false;
    }

    function draw() {
      const { nodes, edges, w, h } = stateRef.current;
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, w, h);
      if (!nodes.length) return;

      // column rules
      const seen = new Set<number>();
      ctx.strokeStyle = "rgba(110,132,180,.06)";
      ctx.lineWidth = 1;
      nodes.forEach((n) => {
        if (seen.has(n.x)) return;
        seen.add(n.x);
        ctx.beginPath();
        ctx.moveTo(n.x + 0.5, 22);
        ctx.lineTo(n.x + 0.5, h - 16);
        ctx.stroke();
      });

      edges.forEach((e) => {
        const dim = dimmed(e.a) || dimmed(e.b);
        ctx.strokeStyle = rgba(e.color, dim ? 0.05 : 0.3);
        ctx.lineWidth = e.width;
        const mx = (e.a.x + e.b.x) / 2;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.bezierCurveTo(mx, e.a.y, mx, e.b.y, e.b.x, e.b.y);
        ctx.stroke();
      });

      nodes.forEach((n) => {
        const dim = dimmed(n);
        ctx.globalAlpha = dim ? 0.18 : 1;
        const color =
          n.kind === "subject"
            ? GOLD
            : n.kind === "vehicle"
              ? n.vehicle.color
              : n.kind === "market"
                ? n.color
                : n.color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        if (n.kind === "subject") {
          ctx.strokeStyle = rgba(GOLD, 0.35);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      // labels: subject, vehicles, and markets. Assets are hover-only.
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      nodes.forEach((n) => {
        if (n.kind === "asset") return;
        ctx.globalAlpha = dimmed(n) ? 0.2 : 1;
        if (n.kind === "market") {
          ctx.textAlign = "left";
          ctx.fillStyle = INK;
          ctx.fillText(`${n.city}  ${n.count}`, n.x + 10, n.y + 3);
        } else if (n.kind === "vehicle") {
          ctx.textAlign = "center";
          ctx.fillStyle = INK;
          ctx.fillText(n.vehicle.short, n.x, n.y - n.r - 8);
          ctx.fillStyle = INK3;
          ctx.fillText(
            n.vehicle.held ? money(n.vehicle.committed, lang) : "—",
            n.x,
            n.y + n.r + 14,
          );
        } else {
          ctx.textAlign = "center";
          ctx.fillStyle = GOLD;
          ctx.fillText(n.label, n.x, n.y - n.r - 10);
        }
        ctx.globalAlpha = 1;
      });

      // tier headers
      ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = INK3;
      ctx.textAlign = "center";
      const cols = Array.from(seen).sort((a, b) => a - b);
      const heads =
        cols.length === 4
          ? ["SUBJECT", "VEHICLE", "MARKET", "ASSET"]
          : cols.length === 3
            ? ["SUBJECT", "VEHICLE", "MARKET"]
            : ["SUBJECT", "VEHICLE"];
      ctx.save();
      ctx.letterSpacing = "1.2px";
      cols.forEach((x, i) => ctx.fillText(heads[i] ?? "", x, 14));
      ctx.restore();
    }

    const el = canvas;
    function resize() {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(rect.width * dpr);
      el.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout(rect.width, rect.height);
      draw();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    return () => observer.disconnect();
  }, [vehicles, buildings, marketOrder, assetOrder, focus, subject, lang]);

  function nodeAt(x: number, y: number) {
    let best: GraphNode | null = null;
    let bestD = 14;
    stateRef.current.nodes.forEach((n) => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    });
    return best as GraphNode | null;
  }

  return (
    <div className="relative min-h-[420px] flex-1">
      <canvas
        ref={canvasRef}
        className="block size-full"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const n = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
          if (!n) {
            setTip(null);
            event.currentTarget.style.cursor = "default";
            return;
          }
          event.currentTarget.style.cursor = "pointer";
          if (n.kind === "subject") {
            setTip({ x: n.x, y: n.y, title: n.label, lines: [] });
          } else if (n.kind === "vehicle") {
            const v = n.vehicle;
            setTip({
              x: n.x,
              y: n.y,
              title: v.name,
              lines: [
                v.held ? money(v.committed, lang) : "—",
                v.units != null ? `${v.units.toLocaleString()} units` : "",
                `${v.buildings.length} assets · ${v.completeness}% complete`,
              ].filter(Boolean),
            });
          } else if (n.kind === "market") {
            setTip({ x: n.x, y: n.y, title: n.city, lines: [`${n.count} buildings`] });
          } else {
            setTip({
              x: n.x,
              y: n.y,
              title: n.building.name,
              lines: [
                `${n.building.city}, ${n.building.province}`,
                n.building.units != null ? `${n.building.units.toLocaleString()} units` : "",
              ].filter(Boolean),
            });
          }
        }}
        onPointerLeave={() => setTip(null)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const n = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
          if (!n || n.kind === "subject") {
            onFocus(null);
            return;
          }
          const next: Focus =
            n.kind === "vehicle"
              ? { type: "vehicle", key: n.vehicle.id }
              : n.kind === "market"
                ? { type: "market", key: n.city }
                : { type: "market", key: n.building.city };
          onFocus(focus && focus.type === next!.type && focus.key === next!.key ? null : next);
        }}
      />
      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[240px] border border-[#2a3a49] bg-[#0e141b] px-2.5 py-2 text-[11px] leading-snug"
          style={{
            left: Math.max(90, Math.min(stateRef.current.w - 90, tip.x)),
            top: Math.max(38, tip.y),
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <b className="mb-0.5 block font-normal tracking-[0.03em] text-[#ebc76b]">{tip.title}</b>
          {tip.lines.map((line) => (
            <span key={line} className="block text-[#8794a3]">
              {line}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
