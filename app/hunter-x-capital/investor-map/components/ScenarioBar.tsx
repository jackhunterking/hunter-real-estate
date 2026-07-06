import { type InvestmentMode, equitonApartmentFund } from "../equitonMapData";
import { formatCurrency, getModeLabel } from "../format";
import styles from "../investor-map.module.css";

export function ScenarioBar({ mode, amount }: { mode: InvestmentMode; amount: number }) {
  const low = amount * equitonApartmentFund.targetAnnualNetReturn.low;
  const high = amount * equitonApartmentFund.targetAnnualNetReturn.high;
  const mid = (low + high) / 2;

  return (
    <div className={styles.scenarioBar} data-mode={mode}>
      <div className={styles.scenarioBarHead}>
        <span>{getModeLabel(mode)}</span>
        <strong>{formatCurrency(mid)} midpoint</strong>
      </div>
      <div className={styles.barTrack}>
        <span className={styles.barLow} />
        <span className={styles.barHigh} />
      </div>
      <div className={styles.barLabels}>
        <span>{formatCurrency(low)}</span>
        <span>{formatCurrency(high)}</span>
      </div>
    </div>
  );
}
