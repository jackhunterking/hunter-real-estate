import { type EquitonProperty, equitonProperties } from "../equitonMapData";
import type { ArcGisModules } from "./types";

type GoToSpec = Record<string, unknown>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function finiteOr(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeHeading(heading: number) {
  return ((heading % 360) + 360) % 360;
}

export function getPortfolioCenter() {
  const latitude =
    equitonProperties.reduce((total, p) => total + p.latitude, 0) / equitonProperties.length;
  const longitude =
    equitonProperties.reduce((total, p) => total + p.longitude, 0) / equitonProperties.length;
  return { latitude, longitude };
}

/**
 * Owns every camera mutation through a single requestAnimationFrame scheduler
 * with one pending target. This removes the competing loops (the old 120ms
 * setInterval auto-orbit + per-drag goTo) that caused the stutter.
 */
export function createCameraController(view: Record<string, any>, modules: ArcGisModules) {
  let frame: number | null = null;
  let pending: GoToSpec | null = null;
  let cinematicFrame: number | null = null;
  let lastCinematicAt = 0;
  let destroyed = false;

  const point = (latitude: number, longitude: number) =>
    new modules.Point({ latitude, longitude, spatialReference: { wkid: 4326 } });

  /** Schedule an instantaneous (non-animated) camera update; latest wins. */
  const schedule = (spec: GoToSpec) => {
    pending = spec;
    if (frame !== null || destroyed) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      const next = pending;
      pending = null;
      if (!next || destroyed) return;
      view.goTo(next, { animate: false }).catch(() => undefined);
    });
  };

  const stopScheduled = () => {
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }
    pending = null;
  };

  const stopAnimation = () => {
    view.animation?.stop?.();
  };

  /** Rotate the view around its current center by screen-drag deltas. */
  const rotateBy = (deltaHeading: number, deltaTilt: number) => {
    const heading = normalizeHeading(finiteOr(view.camera?.heading, 0) + deltaHeading * 0.2);
    const tilt = clamp(finiteOr(view.camera?.tilt, 60) + deltaTilt, 12, 80);
    schedule({ center: view.center, heading, tilt });
  };

  /** Grab-and-drag pan: shift the ground point under the cursor. */
  const panByScreen = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    const p1 = view.toMap?.(from);
    const p2 = view.toMap?.(to);
    if (!p1 || !p2) return;
    const center = view.center;
    if (!center) return;
    schedule({
      center: point(
        center.latitude + (p1.latitude - p2.latitude),
        center.longitude + (p1.longitude - p2.longitude),
      ),
    });
  };

  const getPropertyCamera = (property: EquitonProperty) => ({
    target: point(property.latitude, property.longitude),
    zoom: 17,
    tilt: 64,
    heading: 328,
  });

  const flyToProperty = (property: EquitonProperty, duration = 1100) => {
    stopCinematic();
    return view
      .goTo(getPropertyCamera(property), { duration, easing: "ease-in-out" })
      .catch(() => undefined);
  };

  const flyToPortfolio = (duration = 1200) => {
    stopCinematic();
    const center = getPortfolioCenter();
    return view
      .goTo(
        { target: point(center.latitude, center.longitude), zoom: 7, tilt: 48, heading: 328 },
        { duration, easing: "ease-in-out" },
      )
      .catch(() => undefined);
  };

  const zoomBy = (delta: number) => {
    stopCinematic();
    const zoom = clamp(finiteOr(view.zoom, 12) + delta, 3, 20);
    view.goTo({ zoom }, { duration: 350, easing: "ease-in-out" }).catch(() => undefined);
  };

  const runCinematic = (timestamp: number) => {
    if (destroyed) return;
    // Throttle to ~30fps so continuous orbit stays cheap.
    if (timestamp - lastCinematicAt > 33) {
      lastCinematicAt = timestamp;
      const heading = normalizeHeading(finiteOr(view.camera?.heading, 328) + 0.22);
      const tilt = clamp(finiteOr(view.camera?.tilt, 58), 40, 66);
      schedule({ center: view.center, heading, tilt });
    }
    cinematicFrame = window.requestAnimationFrame(runCinematic);
  };

  function startCinematic() {
    if (cinematicFrame !== null || destroyed) return;
    lastCinematicAt = 0;
    cinematicFrame = window.requestAnimationFrame(runCinematic);
  }

  function stopCinematic() {
    if (cinematicFrame !== null) {
      window.cancelAnimationFrame(cinematicFrame);
      cinematicFrame = null;
    }
  }

  function destroy() {
    destroyed = true;
    stopScheduled();
    stopCinematic();
  }

  return {
    rotateBy,
    panByScreen,
    flyToProperty,
    flyToPortfolio,
    zoomBy,
    startCinematic,
    stopCinematic,
    stopAnimation,
    stopScheduled,
    destroy,
  };
}

export type CameraController = ReturnType<typeof createCameraController>;
