import { type EquitonProperty } from "../equitonMapData";
import { type GroupBy } from "../tiers";
import { ChevronIcon } from "./icons";
import { PlacesList } from "./PlacesList";
import styles from "../investor-map.module.css";

export function DataOverviewPanel({
  groupBy,
  selectedId,
  collapsed,
  onToggleCollapsed,
  onSelectProperty,
}: {
  groupBy: GroupBy;
  selectedId: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectProperty: (property: EquitonProperty) => void;
}) {
  return (
    <aside className={styles.dataPanel} data-collapsed={collapsed} aria-label="Data overview">
      <button
        type="button"
        className={styles.dataPanelHead}
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
      >
        <span>
          <strong>Data Overview</strong>
          <small>Grouped by {groupBy === "tier" ? "size tier" : "city"}</small>
        </span>
        <i data-collapsed={collapsed} aria-hidden="true">
          <ChevronIcon />
        </i>
      </button>

      {!collapsed ? (
        <PlacesList groupBy={groupBy} selectedId={selectedId} onSelectProperty={onSelectProperty} />
      ) : null}
    </aside>
  );
}
