import { type GroupBy } from "../tiers";
import type { MapTheme } from "../arcgis/types";
import { CompassIcon, IsolateIcon, MoonIcon, SortIcon, SunIcon, TourIcon } from "./icons";
import styles from "../investor-map.module.css";

export function TopControls({
  cinematicActive,
  isolate,
  touring,
  groupBy,
  theme,
  onShowAround,
  onToggleIsolate,
  onToggleGrouping,
  onToggleTour,
  onToggleTheme,
}: {
  cinematicActive: boolean;
  isolate: boolean;
  touring: boolean;
  groupBy: GroupBy;
  theme: MapTheme;
  onShowAround: () => void;
  onToggleIsolate: () => void;
  onToggleGrouping: () => void;
  onToggleTour: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <div className={styles.topControls} role="group" aria-label="Map controls">
      <button
        type="button"
        className={cinematicActive ? styles.controlActive : ""}
        aria-pressed={cinematicActive}
        onClick={onShowAround}
      >
        <CompassIcon />
        <span>Show Me Around</span>
        <kbd>C</kbd>
      </button>
      <button
        type="button"
        className={isolate ? styles.controlActive : ""}
        aria-pressed={isolate}
        onClick={onToggleIsolate}
      >
        <IsolateIcon />
        <span>Isolate Data</span>
        <kbd>I</kbd>
      </button>
      <button
        type="button"
        className={groupBy === "city" ? styles.controlActive : ""}
        aria-pressed={groupBy === "city"}
        onClick={onToggleGrouping}
      >
        <SortIcon />
        <span>Sort Grouping</span>
        <kbd>S</kbd>
      </button>
      <button
        type="button"
        className={touring ? styles.controlActive : ""}
        aria-pressed={touring}
        onClick={onToggleTour}
      >
        <TourIcon />
        <span>Tour</span>
        <kbd>T</kbd>
      </button>
      <button type="button" className={styles.themeToggle} onClick={onToggleTheme} aria-label="Toggle light or dark mode">
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        <kbd>L</kbd>
      </button>
    </div>
  );
}
