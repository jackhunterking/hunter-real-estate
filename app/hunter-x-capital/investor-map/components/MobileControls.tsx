import type { MapTheme } from "../arcgis/types";
import { CompassIcon, IsolateIcon, MoonIcon, SunIcon, TourIcon } from "./icons";
import styles from "../investor-map.module.css";

export function MobileControls({
  cinematicActive,
  isolate,
  touring,
  theme,
  onShowAround,
  onToggleIsolate,
  onToggleTour,
  onToggleTheme,
}: {
  cinematicActive: boolean;
  isolate: boolean;
  touring: boolean;
  theme: MapTheme;
  onShowAround: () => void;
  onToggleIsolate: () => void;
  onToggleTour: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <div className={styles.mobileControls} role="group" aria-label="Map controls">
      <button type="button" className={cinematicActive ? styles.controlActive : ""} aria-pressed={cinematicActive} aria-label="Show me around" onClick={onShowAround}>
        <CompassIcon />
      </button>
      <button type="button" className={isolate ? styles.controlActive : ""} aria-pressed={isolate} aria-label="Isolate data" onClick={onToggleIsolate}>
        <IsolateIcon />
      </button>
      <button type="button" className={touring ? styles.controlActive : ""} aria-pressed={touring} aria-label="Tour" onClick={onToggleTour}>
        <TourIcon />
      </button>
      <button type="button" aria-label="Toggle light or dark mode" onClick={onToggleTheme}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
