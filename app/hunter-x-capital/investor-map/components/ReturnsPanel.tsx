import { type InvestmentMode } from "../equitonMapData";
import { formatCurrency } from "../format";
import styles from "../investor-map.module.css";

/**
 * Scenario amount + return summary + lens switch, laid out for the mobile
 * sheet's Returns tab. Desktop keeps its own floating summary/mode markup.
 */
export function ReturnsPanel({
  amount,
  onAmountChange,
  mode,
  onModeChange,
  annualLow,
  annualHigh,
  monthlyLow,
  monthlyHigh,
}: {
  amount: number;
  onAmountChange: (value: number) => void;
  mode: InvestmentMode;
  onModeChange: (mode: InvestmentMode) => void;
  annualLow: number;
  annualHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
}) {
  return (
    <div className={styles.returnsPanel}>
      <label className={styles.returnsAmount}>
        <span>Scenario capital</span>
        <input
          type="number"
          value={amount}
          min={0}
          step={25000}
          onChange={(event) => onAmountChange(Number(event.target.value))}
        />
      </label>

      <div className={styles.returnsTiles}>
        <div>
          <span className={styles.summaryLabel}>Target annual net return</span>
          <strong>8-12%</strong>
        </div>
        <div>
          <span className={styles.summaryLabel}>Annual range</span>
          <strong>
            {formatCurrency(annualLow)}-{formatCurrency(annualHigh)}
          </strong>
        </div>
        <div>
          <span className={styles.summaryLabel}>Monthly equivalent</span>
          <strong>
            {formatCurrency(monthlyLow)}-{formatCurrency(monthlyHigh)}
          </strong>
        </div>
      </div>

      <div className={styles.returnsModes} role="group" aria-label="Return lens">
        {(["distribution", "appreciation", "total"] as InvestmentMode[]).map((item) => (
          <button
            key={item}
            type="button"
            className={mode === item ? styles.modeActive : ""}
            onClick={() => onModeChange(item)}
          >
            {item === "distribution" ? "Distribution" : item === "appreciation" ? "Appreciation" : "Total"}
          </button>
        ))}
      </div>
    </div>
  );
}
