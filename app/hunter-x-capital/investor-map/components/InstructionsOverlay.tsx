import styles from "../investor-map.module.css";

export function InstructionsOverlay({
  mobile = false,
  onDismiss,
}: {
  mobile?: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className={styles.instructions} role="note">
      {mobile ? (
        <ul>
          <li>
            <strong>Drag</strong> to move
          </li>
          <li>
            <strong>Two fingers</strong> to rotate
          </li>
          <li>
            <strong>Pinch</strong> to zoom
          </li>
        </ul>
      ) : (
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
      )}
      <button type="button" onClick={onDismiss} aria-label="Dismiss controls hint">
        Got it
      </button>
    </div>
  );
}
