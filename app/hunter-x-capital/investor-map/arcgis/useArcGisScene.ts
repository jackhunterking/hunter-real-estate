import { useEffect, useRef, useState } from "react";
import { type EquitonProperty, type InvestmentMode, equitonProperties } from "../equitonMapData";
import { ARC_GIS_BUILDINGS_URL, loadArcGisModules, setArcGisTheme } from "./loader";
import { createCameraController, getPortfolioCenter, type CameraController } from "./cameraController";
import { buildPropertyGraphics, type PropertyGraphicsController } from "./propertyGraphics";
import type { ArcGisModules, MapTheme } from "./types";

export type SceneStatus = "loading" | "ready" | "error";

export type HoverCardState = { property: EquitonProperty; x: number; y: number };

export type SceneControls = {
  flyToProperty: (property: EquitonProperty) => void;
  flyToPortfolio: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  toggleCinematic: () => boolean;
  startTour: () => void;
  stopTour: () => void;
  setTheme: (theme: MapTheme) => void;
};

type SceneProps = {
  selectedId: string;
  mode: InvestmentMode;
  isolate: boolean;
  theme: MapTheme;
  onSelectProperty: (property: EquitonProperty) => void;
  onTourStateChange?: (touring: boolean) => void;
};

const HOVER_THROTTLE_MS = 80;
const TOUR_STEP_MS = 3600;

function finiteOr(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function useArcGisScene(props: SceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<SceneStatus>("loading");
  const [hoverCard, setHoverCard] = useState<HoverCardState | null>(null);
  const controlsRef = useRef<SceneControls | null>(null);

  // Latest props mirrored into refs so the imperative scene reads current state.
  const propsRef = useRef(props);
  propsRef.current = props;

  const graphicsStateRef = useRef({
    selectedId: props.selectedId,
    mode: props.mode,
    hoveredId: null as string | null,
    isolate: props.isolate,
  });

  const sceneRef = useRef<{
    view: Record<string, any>;
    camera: CameraController;
    graphics: PropertyGraphicsController;
  } | null>(null);

  // ---- Build the scene once ----
  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    async function createScene() {
      if (!containerRef.current) return;
      try {
        setStatus("loading");
        const modules: ArcGisModules = await loadArcGisModules(propsRef.current.theme);
        if (cancelled || !containerRef.current) return;

        const theme = propsRef.current.theme;
        const map = new modules.Map({
          basemap: theme === "dark" ? "dark-gray-vector" : "gray-vector",
          ground: "world-elevation",
        });
        const buildingsLayer = new modules.SceneLayer({
          url: ARC_GIS_BUILDINGS_URL,
          title: "Open 3D Buildings",
          copyright: "Esri, Overture Maps, OpenStreetMap contributors",
        });
        const graphicsLayer = new modules.GraphicsLayer({
          title: "Equiton properties",
          elevationInfo: { mode: "relative-to-scene" },
        });
        map.addMany([buildingsLayer, graphicsLayer]);

        const center = getPortfolioCenter();
        const view = new modules.SceneView({
          container: containerRef.current,
          map,
          qualityProfile: "medium",
          viewingMode: "global",
          popupEnabled: false,
          camera: {
            position: { latitude: center.latitude - 0.8, longitude: center.longitude - 0.85, z: 210000 },
            heading: 328,
            tilt: 50,
          },
          environment: {
            atmosphereEnabled: false,
            starsEnabled: false,
            background: { type: "color", color: theme === "dark" ? [3, 5, 10, 1] : [232, 236, 242, 1] },
            // Shadows + ambient occlusion are the heaviest per-frame cost on the
            // streamed buildings layer; disabled for smooth interaction.
            lighting: { directShadowsEnabled: false, ambientOcclusionEnabled: false },
          },
          constraints: { altitude: { min: 120, max: 800000 }, tilt: { max: 80 } },
          ui: { components: ["attribution"] },
        });

        const camera = createCameraController(view, modules);
        const graphics = buildPropertyGraphics(modules, graphicsLayer);
        sceneRef.current = { view, camera, graphics };

        const applyGraphics = () => graphics.update(graphicsStateRef.current);
        applyGraphics();

        // ---- Buildings layer view (for hover highlight) ----
        let buildingsLayerView: Record<string, any> | null = null;
        let buildingHighlight: { remove: () => void } | null = null;
        view
          .whenLayerView(buildingsLayer)
          .then((lv: Record<string, any>) => {
            if (!cancelled) buildingsLayerView = lv;
          })
          .catch(() => undefined);
        const highlightBuilding = (graphic: Record<string, any> | null) => {
          buildingHighlight?.remove();
          buildingHighlight = null;
          if (graphic && typeof buildingsLayerView?.highlight === "function") {
            buildingHighlight = buildingsLayerView.highlight(graphic);
          }
        };

        // ---- Hover: throttled hitTest, skipped while dragging ----
        let dragging = false;
        let lastHoverAt = 0;
        let hoverInFlight = false;
        let hoverSeq = 0;

        const setHovered = (property: EquitonProperty | null, event?: Record<string, any>) => {
          const nextId = property?.id ?? null;
          if (graphicsStateRef.current.hoveredId !== nextId) {
            graphicsStateRef.current.hoveredId = nextId;
            applyGraphics();
          }
          setHoverCard(
            property && event
              ? { property, x: finiteOr(event.x, 0), y: finiteOr(event.y, 0) }
              : null,
          );
        };

        const pointerMove = view.on("pointer-move", (event: Record<string, any>) => {
          if (dragging) return;
          // Hover is a pointer affordance; touch uses tap-to-select instead.
          if (event.pointerType === "touch") return;
          const now = performance.now();
          if (hoverInFlight || now - lastHoverAt < HOVER_THROTTLE_MS) return;
          lastHoverAt = now;
          hoverInFlight = true;
          const seq = ++hoverSeq;
          view
            .hitTest(event)
            .then((hit: Record<string, any>) => {
              if (cancelled || seq !== hoverSeq) return;
              const propertyGraphic = hit.results?.find(
                (r: Record<string, any>) => r.graphic?.attributes?.propertyId,
              )?.graphic;
              const buildingGraphic =
                hit.results?.find((r: Record<string, any>) => r.graphic?.layer === buildingsLayer)
                  ?.graphic ?? null;
              const property =
                equitonProperties.find((p) => p.id === propertyGraphic?.attributes?.propertyId) ??
                null;
              setHovered(property, event);
              highlightBuilding(buildingGraphic);
            })
            .catch(() => undefined)
            .finally(() => {
              hoverInFlight = false;
            });
        });
        cleanups.push(() => pointerMove.remove());

        // ---- Click: select a property ----
        const clickHandle = view.on("click", async (event: Record<string, unknown>) => {
          camera.stopCinematic();
          const hit = await view.hitTest(event);
          const graphic = hit.results?.find(
            (r: Record<string, any>) => r.graphic?.attributes?.propertyId,
          )?.graphic;
          const property = equitonProperties.find(
            (p) => p.id === graphic?.attributes?.propertyId,
          );
          if (property) propsRef.current.onSelectProperty(property);
        });
        cleanups.push(() => clickHandle.remove());

        // ---- Drag: left = rotate, right = pan ----
        let dragMode: "rotate" | "pan" | null = null;
        let lastPoint = { x: 0, y: 0 };
        const dragHandle = view.on("drag", (event: Record<string, any>) => {
          // On touch, defer to ArcGIS native gestures (one-finger pan,
          // two-finger rotate/tilt, pinch zoom) — don't stopPropagation.
          if (event.pointerType === "touch") return;
          const button = typeof event.button === "number" ? event.button : event.native?.button;
          if (event.action === "start") {
            camera.stopCinematic();
            camera.stopAnimation();
            dragMode = button === 2 ? "pan" : "rotate";
            dragging = true;
            highlightBuilding(null);
            setHovered(null);
            lastPoint = { x: finiteOr(event.x, 0), y: finiteOr(event.y, 0) };
            event.stopPropagation?.();
            return;
          }
          if (!dragMode) return;
          if (event.action === "update") {
            const x = finiteOr(event.x, lastPoint.x);
            const y = finiteOr(event.y, lastPoint.y);
            if (dragMode === "rotate") {
              camera.rotateBy(x - lastPoint.x, -(y - lastPoint.y));
            } else {
              camera.panByScreen(lastPoint, { x, y });
            }
            lastPoint = { x, y };
            event.stopPropagation?.();
            return;
          }
          if (event.action === "end") {
            dragMode = null;
            dragging = false;
            event.stopPropagation?.();
          }
        });
        cleanups.push(() => dragHandle.remove());

        // ---- Native cleanups: cancel cinematic on wheel, kill context menu on pan ----
        const el = containerRef.current;
        const onWheel = () => camera.stopCinematic();
        const onContextMenu = (e: Event) => e.preventDefault();
        const onPointerLeave = () => {
          highlightBuilding(null);
          setHovered(null);
        };
        el.addEventListener("wheel", onWheel, { passive: true });
        el.addEventListener("contextmenu", onContextMenu);
        el.addEventListener("pointerleave", onPointerLeave);
        cleanups.push(() => {
          el.removeEventListener("wheel", onWheel);
          el.removeEventListener("contextmenu", onContextMenu);
          el.removeEventListener("pointerleave", onPointerLeave);
        });

        // ---- Tour orchestration ----
        let tourTimer: number | null = null;
        let tourIndex = 0;
        const stopTour = () => {
          if (tourTimer !== null) {
            window.clearTimeout(tourTimer);
            tourTimer = null;
          }
          propsRef.current.onTourStateChange?.(false);
        };
        const stepTour = () => {
          if (cancelled) return;
          const property = equitonProperties[tourIndex % equitonProperties.length];
          propsRef.current.onSelectProperty(property);
          camera.flyToProperty(property);
          tourIndex += 1;
          if (tourIndex >= equitonProperties.length) {
            tourTimer = window.setTimeout(stopTour, TOUR_STEP_MS);
            return;
          }
          tourTimer = window.setTimeout(stepTour, TOUR_STEP_MS);
        };
        const startTour = () => {
          stopTour();
          camera.stopCinematic();
          tourIndex = 0;
          propsRef.current.onTourStateChange?.(true);
          stepTour();
        };

        // ---- Cinematic toggle ----
        let cinematicOn = false;
        const toggleCinematic = () => {
          cinematicOn = !cinematicOn;
          if (cinematicOn) camera.startCinematic();
          else camera.stopCinematic();
          return cinematicOn;
        };

        controlsRef.current = {
          flyToProperty: (property) => camera.flyToProperty(property),
          flyToPortfolio: () => camera.flyToPortfolio(),
          zoomIn: () => camera.zoomBy(1),
          zoomOut: () => camera.zoomBy(-1),
          reset: () => {
            stopTour();
            cinematicOn = false;
            camera.flyToPortfolio();
          },
          toggleCinematic,
          startTour,
          stopTour,
          setTheme: (nextTheme) => {
            setArcGisTheme(nextTheme);
            view.map.basemap = nextTheme === "dark" ? "dark-gray-vector" : "gray-vector";
            if (view.environment?.background) {
              view.environment.background.color =
                nextTheme === "dark" ? [3, 5, 10, 1] : [232, 236, 242, 1];
            }
          },
        };
        cleanups.push(stopTour);

        await view.when();
        if (cancelled) return;
        setStatus("ready");
        camera.flyToProperty(propsRef.current.selectedId
          ? equitonProperties.find((p) => p.id === propsRef.current.selectedId) ?? equitonProperties[0]
          : equitonProperties[0]);
      } catch (error) {
        if (!cancelled) {
          console.error("ArcGIS scene failed to load", error);
          setStatus("error");
        }
      }
    }

    createScene();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      const scene = sceneRef.current;
      scene?.camera.destroy();
      scene?.view?.destroy();
      sceneRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  // ---- Sync graphics with selection / mode / isolate ----
  useEffect(() => {
    graphicsStateRef.current.selectedId = props.selectedId;
    graphicsStateRef.current.mode = props.mode;
    graphicsStateRef.current.isolate = props.isolate;
    sceneRef.current?.graphics.update(graphicsStateRef.current);
  }, [props.selectedId, props.mode, props.isolate]);

  return { containerRef, status, hoverCard, controlsRef };
}
