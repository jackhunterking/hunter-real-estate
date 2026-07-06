"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type EquitonProperty, type InvestmentMode, equitonApartmentFund, equitonProperties } from "./equitonMapData";
import { type GroupBy } from "./tiers";
import { formatCurrency } from "./format";
import type { MapTheme } from "./arcgis/types";
import { useArcGisScene } from "./arcgis/useArcGisScene";
import { useIsMobile } from "./useIsMobile";
import { DataOverviewPanel } from "./components/DataOverviewPanel";
import { HoverCard } from "./components/HoverCard";
import { InstructionsOverlay } from "./components/InstructionsOverlay";
import { PropertyDrawer } from "./components/PropertyDrawer";
import { TopControls } from "./components/TopControls";
import { MobileControls } from "./components/MobileControls";
import { MobileSheet } from "./components/MobileSheet";
import { MinusIcon, PlusIcon, ResetIcon } from "./components/icons";
import styles from "./investor-map.module.css";

export default function InvestorMapClient() {
  const [selectedId, setSelectedId] = useState(equitonProperties[0].id);
  const [mode, setMode] = useState<InvestmentMode>("total");
  const [amount, setAmount] = useState(100000);
  const [theme, setTheme] = useState<MapTheme>("dark");
  const [isolate, setIsolate] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("tier");
  const [cinematicActive, setCinematicActive] = useState(false);
  const [touring, setTouring] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  // Bumped on every focus intent (map tap, list/drawer tap) so the mobile sheet
  // opens even when the same property is tapped again.
  const [focusTick, setFocusTick] = useState(0);

  const selectedProperty =
    equitonProperties.find((property) => property.id === selectedId) ?? equitonProperties[0];

  const scenario = useMemo(() => {
    const safeAmount = Math.max(0, amount || 0);
    const annualLow = safeAmount * equitonApartmentFund.targetAnnualNetReturn.low;
    const annualHigh = safeAmount * equitonApartmentFund.targetAnnualNetReturn.high;
    return {
      annualLow,
      annualHigh,
      monthlyLow: annualLow / 12,
      monthlyHigh: annualHigh / 12,
    };
  }, [amount]);

  const handleSelectProperty = useCallback((property: EquitonProperty) => {
    setSelectedId(property.id);
    setFocusTick((tick) => tick + 1);
  }, []);

  const { containerRef, status, hoverCard, controlsRef } = useArcGisScene({
    selectedId,
    mode,
    isolate,
    theme,
    onSelectProperty: handleSelectProperty,
    onTourStateChange: setTouring,
  });

  // Focus (select + fly) — used by clicks in the drawer, panel, and keyboard nav.
  const focusProperty = useCallback(
    (property: EquitonProperty) => {
      setSelectedId(property.id);
      controlsRef.current?.flyToProperty(property);
      setFocusTick((tick) => tick + 1);
    },
    [controlsRef],
  );

  // Apply theme changes to the live scene.
  useEffect(() => {
    controlsRef.current?.setTheme(theme);
  }, [theme, controlsRef]);

  const toggleTour = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (touring) controls.stopTour();
    else controls.startTour();
  }, [touring, controlsRef]);

  const showAround = useCallback(() => {
    const on = controlsRef.current?.toggleCinematic() ?? false;
    setCinematicActive(on);
  }, [controlsRef]);

  const toggleGrouping = useCallback(() => {
    setGroupBy((current) => (current === "tier" ? "city" : "tier"));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const stepSelection = useCallback(
    (direction: 1 | -1) => {
      const index = equitonProperties.findIndex((property) => property.id === selectedId);
      const next = (index + direction + equitonProperties.length) % equitonProperties.length;
      focusProperty(equitonProperties[next]);
    },
    [selectedId, focusProperty],
  );

  // Keyboard shortcuts mirroring the reference (I / S / T / C / L + arrow nav).
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      switch (event.key.toLowerCase()) {
        case "i":
          setIsolate((v) => !v);
          break;
        case "s":
        case "g":
          toggleGrouping();
          break;
        case "t":
          toggleTour();
          break;
        case "c":
          showAround();
          break;
        case "l":
          toggleTheme();
          break;
        case "arrowright":
          event.preventDefault();
          stepSelection(1);
          break;
        case "arrowleft":
          event.preventDefault();
          stepSelection(-1);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleGrouping, toggleTour, showAround, toggleTheme, stepSelection]);

  function updateAmount(value: number) {
    if (!Number.isFinite(value)) return;
    setAmount(Math.min(Math.max(value, 0), 2000000));
  }

  const isMobile = useIsMobile();

  const zoomCluster = (
    <div className={styles.zoomControls} aria-label="Map zoom controls">
      <button type="button" onClick={() => controlsRef.current?.zoomIn()} aria-label="Zoom in">
        <PlusIcon />
      </button>
      <button type="button" onClick={() => controlsRef.current?.zoomOut()} aria-label="Zoom out">
        <MinusIcon />
      </button>
      <button type="button" onClick={() => controlsRef.current?.reset()} aria-label="Reset camera">
        <ResetIcon />
      </button>
    </div>
  );

  return (
    <main className={styles.shell} data-theme={theme}>
      <section className={styles.mapStage} data-mode={mode}>
        <div className={styles.mapViewport} aria-label="Verified Equiton property 3D map">
          <div ref={containerRef} className={styles.arcgisScene} />

          {status !== "ready" ? (
            <div className={styles.sceneStatus} role="status">
              <strong>{status === "error" ? "3D scene unavailable" : "Loading 3D buildings"}</strong>
              <span>
                {status === "error"
                  ? "The investor data is still available in the property panel."
                  : "Esri Open 3D Buildings"}
              </span>
            </div>
          ) : null}

          {hoverCard && status === "ready" ? (
            <HoverCard hoverCard={hoverCard} amount={amount} mode={mode} />
          ) : null}

          {showInstructions && status === "ready" ? (
            <InstructionsOverlay mobile={isMobile} onDismiss={() => setShowInstructions(false)} />
          ) : null}
        </div>

        {isMobile ? (
          <>
            <header className={styles.topBar} data-variant="mobile">
              <a href="/hunter-x-capital" className={styles.brandLockup} aria-label="Hunter X Capital">
                <span className={styles.brandMark}>H</span>
                <span>
                  <strong>Investor Map</strong>
                  <small>Equiton Apartment Fund demo</small>
                </span>
              </a>
            </header>

            <MobileControls
              cinematicActive={cinematicActive}
              isolate={isolate}
              touring={touring}
              theme={theme}
              onShowAround={showAround}
              onToggleIsolate={() => setIsolate((v) => !v)}
              onToggleTour={toggleTour}
              onToggleTheme={toggleTheme}
            />

            {zoomCluster}

            <MobileSheet
              selectedProperty={selectedProperty}
              selectedId={selectedId}
              focusTick={focusTick}
              amount={amount}
              mode={mode}
              groupBy={groupBy}
              annualLow={scenario.annualLow}
              annualHigh={scenario.annualHigh}
              monthlyLow={scenario.monthlyLow}
              monthlyHigh={scenario.monthlyHigh}
              onSelectProperty={focusProperty}
              onAmountChange={updateAmount}
              onModeChange={setMode}
              onToggleGrouping={toggleGrouping}
            />
          </>
        ) : (
          <>
            <header className={styles.topBar}>
              <a href="/hunter-x-capital" className={styles.brandLockup} aria-label="Hunter X Capital">
                <span className={styles.brandMark}>H</span>
                <span>
                  <strong>Investor Map</strong>
                  <small>Equiton Apartment Fund demo</small>
                </span>
              </a>

              <TopControls
                cinematicActive={cinematicActive}
                isolate={isolate}
                touring={touring}
                groupBy={groupBy}
                theme={theme}
                onShowAround={showAround}
                onToggleIsolate={() => setIsolate((v) => !v)}
                onToggleGrouping={toggleGrouping}
                onToggleTour={toggleTour}
                onToggleTheme={toggleTheme}
              />

              <div className={styles.amountCard}>
                <label htmlFor="investmentAmount">Scenario</label>
                <input
                  id="investmentAmount"
                  type="number"
                  value={amount}
                  min={0}
                  step={25000}
                  onChange={(event) => updateAmount(Number(event.target.value))}
                />
              </div>
            </header>

            <DataOverviewPanel
              groupBy={groupBy}
              selectedId={selectedId}
              collapsed={panelCollapsed}
              onToggleCollapsed={() => setPanelCollapsed((v) => !v)}
              onSelectProperty={focusProperty}
            />

            <section className={styles.summaryPanel} aria-label="Investment scenario summary">
              <div>
                <span className={styles.summaryLabel}>Target annual net return</span>
                <strong>8-12%</strong>
              </div>
              <div>
                <span className={styles.summaryLabel}>Annual range</span>
                <strong>
                  {formatCurrency(scenario.annualLow)}-{formatCurrency(scenario.annualHigh)}
                </strong>
              </div>
              <div>
                <span className={styles.summaryLabel}>Monthly equivalent</span>
                <strong>
                  {formatCurrency(scenario.monthlyLow)}-{formatCurrency(scenario.monthlyHigh)}
                </strong>
              </div>
            </section>

            <div className={styles.modeSwitch} role="group" aria-label="Return lens">
              {(["distribution", "appreciation", "total"] as InvestmentMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={mode === item ? styles.modeActive : ""}
                  onClick={() => setMode(item)}
                >
                  {item === "distribution" ? "Distribution" : item === "appreciation" ? "Appreciation" : "Total"}
                </button>
              ))}
            </div>

            {zoomCluster}

            <PropertyDrawer
              selectedProperty={selectedProperty}
              selectedId={selectedId}
              amount={amount}
              mode={mode}
              monthlyLow={scenario.monthlyLow}
              monthlyHigh={scenario.monthlyHigh}
              onSelectProperty={focusProperty}
            />
          </>
        )}
      </section>
    </main>
  );
}
