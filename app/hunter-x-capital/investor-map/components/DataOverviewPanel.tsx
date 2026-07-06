import { type EquitonProperty } from "../equitonMapData";
import { type GroupBy, groupProperties } from "../tiers";
import { ChevronIcon } from "./icons";
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
  const groups = groupProperties(groupBy);

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
        <div className={styles.dataPanelBody}>
          {groups.map((group) => (
            <section key={group.key} className={styles.dataGroup}>
              <header>
                {group.accent ? (
                  <span className={styles.tierDot} style={{ background: group.accent }} aria-hidden="true" />
                ) : null}
                <strong>{group.label}</strong>
                {group.caption ? <small>{group.caption}</small> : null}
              </header>
              <ul>
                {group.properties.map((property) => (
                  <li key={property.id}>
                    <button
                      type="button"
                      className={property.id === selectedId ? styles.dataRowActive : ""}
                      onClick={() => onSelectProperty(property)}
                    >
                      <span className={styles.dataRowName}>{property.name}</span>
                      <span className={styles.dataRowMeta}>
                        {property.city} · {property.buildingProfile.floors} fl
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
