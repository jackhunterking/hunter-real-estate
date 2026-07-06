import { type EquitonProperty, type InvestmentMode } from "../equitonMapData";
import { PropertyDetail } from "./PropertyDetail";
import styles from "../investor-map.module.css";

export function PropertyDrawer(props: {
  selectedProperty: EquitonProperty;
  selectedId: string;
  amount: number;
  mode: InvestmentMode;
  monthlyLow: number;
  monthlyHigh: number;
  onSelectProperty: (property: EquitonProperty) => void;
}) {
  return (
    <aside className={styles.drawer} aria-label="Selected property details">
      <div className={styles.drawerHandle} aria-hidden="true" />
      <PropertyDetail {...props} />
    </aside>
  );
}
