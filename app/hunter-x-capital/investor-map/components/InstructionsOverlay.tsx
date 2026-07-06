import styles from "../investor-map.module.css";

export function InstructionsOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className={styles.instructions} role="note">
      <ul>
        <li>
          <strong>Left Click + Drag</strong> to Rotate
        </li>
        <li>
          <strong>Right Click + Drag</strong> to Pan
        </li>
        <li>
          <strong>Scroll</strong> to Zoom
        </li>
      </ul>
      <button type="button" onClick={onDismiss} aria-label="Dismiss controls hint">
        Got it
      </button>
    </div>
  );
}
