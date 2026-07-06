import { useEffect, useRef, useState } from "react";
import { type EquitonProperty, type InvestmentMode } from "../equitonMapData";
import { type GroupBy } from "../tiers";
import { PropertyDetail } from "./PropertyDetail";
import { PlacesList } from "./PlacesList";
import { ReturnsPanel } from "./ReturnsPanel";
import { SortIcon } from "./icons";
import styles from "../investor-map.module.css";

type Snap = "peek" | "half" | "full";
type Tab = "details" | "places" | "returns";

const SNAP_ORDER: Snap[] = ["peek", "half", "full"];
const SHEET_RATIO = 0.9;
const PEEK_PX = 104;

/** Translate (px from fully-open) for each snap, given the viewport height. */
function snapTranslatePx(snap: Snap, vh: number) {
  const height = vh * SHEET_RATIO;
  if (snap === "full") return 0;
  if (snap === "half") return height - vh * 0.52;
  return height - PEEK_PX;
}

export function MobileSheet({
  selectedProperty,
  selectedId,
  amount,
  mode,
  groupBy,
  annualLow,
  annualHigh,
  monthlyLow,
  monthlyHigh,
  onSelectProperty,
  onAmountChange,
  onModeChange,
  onToggleGrouping,
}: {
  selectedProperty: EquitonProperty;
  selectedId: string;
  amount: number;
  mode: InvestmentMode;
  groupBy: GroupBy;
  annualLow: number;
  annualHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
  onSelectProperty: (property: EquitonProperty) => void;
  onAmountChange: (value: number) => void;
  onModeChange: (mode: InvestmentMode) => void;
  onToggleGrouping: () => void;
}) {
  const [snap, setSnap] = useState<Snap>("peek");
  const [tab, setTab] = useState<Tab>("details");
  const [dragPx, setDragPx] = useState<number | null>(null);
  const [vh, setVh] = useState(800);
  const dragRef = useRef<{ startY: number; startPx: number; moved: number } | null>(null);

  // Track viewport height so the sheet snaps in real pixels (robust on phones
  // where svh/dvh shift as the address bar shows/hides).
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Raise the sheet to Details when the selection actually changes (map tap /
  // place tap). Comparing the id (not a first-run flag) is robust against
  // React StrictMode's double-mount in dev.
  const prevSelected = useRef(selectedId);
  useEffect(() => {
    if (prevSelected.current === selectedId) return;
    prevSelected.current = selectedId;
    setTab("details");
    setSnap((current) => (current === "peek" ? "half" : current));
  }, [selectedId]);

  const onHandleDown = (event: React.PointerEvent) => {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      startY: event.clientY,
      startPx: snapTranslatePx(snap, window.innerHeight),
      moved: 0,
    };
    setDragPx(snapTranslatePx(snap, window.innerHeight));
  };

  const onHandleMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = event.clientY - drag.startY;
    drag.moved = Math.max(drag.moved, Math.abs(delta));
    const vh = window.innerHeight;
    const next = Math.min(Math.max(drag.startPx + delta, 0), snapTranslatePx("peek", vh));
    setDragPx(next);
  };

  const onHandleUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    // A tap (little movement) cycles peek → half → full → peek.
    if (drag.moved < 6) {
      setDragPx(null);
      setSnap((current) => SNAP_ORDER[(SNAP_ORDER.indexOf(current) + 1) % SNAP_ORDER.length]);
      return;
    }

    // Otherwise snap to the nearest state.
    const vh = window.innerHeight;
    const current = dragPx ?? snapTranslatePx(snap, vh);
    const nearest = SNAP_ORDER.reduce((best, candidate) =>
      Math.abs(snapTranslatePx(candidate, vh) - current) <
      Math.abs(snapTranslatePx(best, vh) - current)
        ? candidate
        : best,
    );
    setDragPx(null);
    setSnap(nearest);
  };

  const handleSelect = (property: EquitonProperty) => {
    onSelectProperty(property);
    setTab("details");
    setSnap((current) => (current === "peek" ? "half" : current));
  };

  return (
    <aside
      className={styles.mobileSheet}
      style={{
        height: `${Math.round(vh * SHEET_RATIO)}px`,
        transform: `translateY(${Math.round(dragPx ?? snapTranslatePx(snap, vh))}px)`,
        transition: dragPx !== null ? "none" : undefined,
      }}
      aria-label="Property panel"
    >
      <div
        className={styles.sheetGrip}
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        role="button"
        aria-label="Drag to resize panel"
        tabIndex={0}
      >
        <span className={styles.sheetHandle} aria-hidden="true" />
        <div className={styles.sheetPeek}>
          <strong>{selectedProperty.name}</strong>
          <small>
            {selectedProperty.city}, {selectedProperty.province}
          </small>
        </div>
      </div>

      <div className={styles.sheetTabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === "details"} className={tab === "details" ? styles.sheetTabActive : ""} onClick={() => setTab("details")}>
          Details
        </button>
        <button type="button" role="tab" aria-selected={tab === "places"} className={tab === "places" ? styles.sheetTabActive : ""} onClick={() => setTab("places")}>
          Places
        </button>
        <button type="button" role="tab" aria-selected={tab === "returns"} className={tab === "returns" ? styles.sheetTabActive : ""} onClick={() => setTab("returns")}>
          Returns
        </button>
      </div>

      <div className={styles.sheetBody}>
        {tab === "details" ? (
          <PropertyDetail
            selectedProperty={selectedProperty}
            selectedId={selectedId}
            amount={amount}
            mode={mode}
            monthlyLow={monthlyLow}
            monthlyHigh={monthlyHigh}
            onSelectProperty={handleSelect}
          />
        ) : null}

        {tab === "places" ? (
          <div className={styles.placesTab}>
            <button type="button" className={styles.groupToggle} onClick={onToggleGrouping}>
              <SortIcon />
              <span>Group by {groupBy === "tier" ? "size tier" : "city"}</span>
            </button>
            <PlacesList groupBy={groupBy} selectedId={selectedId} onSelectProperty={handleSelect} />
          </div>
        ) : null}

        {tab === "returns" ? (
          <ReturnsPanel
            amount={amount}
            onAmountChange={onAmountChange}
            mode={mode}
            onModeChange={onModeChange}
            annualLow={annualLow}
            annualHigh={annualHigh}
            monthlyLow={monthlyLow}
            monthlyHigh={monthlyHigh}
          />
        ) : null}
      </div>
    </aside>
  );
}
