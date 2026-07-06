import { type EquitonProperty } from "../equitonMapData";
import { type GroupBy, groupProperties } from "../tiers";
import styles from "../investor-map.module.css";

/**
 * Grouped property list. Shared by the desktop Data Overview panel and the
 * mobile sheet's Places tab.
 */
export function PlacesList({
  groupBy,
  selectedId,
  onSelectProperty,
}: {
  groupBy: GroupBy;
  selectedId: string;
  onSelectProperty: (property: EquitonProperty) => void;
}) {
  const groups = groupProperties(groupBy);

  return (
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
  );
}
