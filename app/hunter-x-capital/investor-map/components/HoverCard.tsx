import { type InvestmentMode, equitonApartmentFund } from "../equitonMapData";
import { formatCurrency } from "../format";
import type { HoverCardState } from "../arcgis/useArcGisScene";
import styles from "../investor-map.module.css";

export function HoverCard({
  hoverCard,
  amount,
  mode,
}: {
  hoverCard: HoverCardState;
  amount: number;
  mode: InvestmentMode;
}) {
  const monthlyLow = (amount * equitonApartmentFund.targetAnnualNetReturn.low) / 12;
  const monthlyHigh = (amount * equitonApartmentFund.targetAnnualNetReturn.high) / 12;
  const x = Math.round(hoverCard.x + 18);
  const y = Math.round(hoverCard.y - 24);

  return (
    <aside
      className={styles.hoverCard}
      style={{
        left: `min(calc(100% - 250px), max(12px, ${x}px))`,
        top: `min(calc(100% - 206px), max(12px, ${y}px))`,
      }}
      aria-label={`${hoverCard.property.name} investment facts`}
    >
      <div className={styles.hoverCardHeader}>
        <span aria-hidden="true">{hoverCard.property.name.slice(0, 1)}</span>
        <div>
          <strong>{hoverCard.property.name}</strong>
          <small>
            {hoverCard.property.city}, {hoverCard.property.province}
          </small>
        </div>
      </div>
      <dl>
        <div>
          <dt>Capital</dt>
          <dd>{formatCurrency(amount)}</dd>
        </div>
        <div>
          <dt>Monthly range</dt>
          <dd>
            {formatCurrency(monthlyLow)}-{formatCurrency(monthlyHigh)}
          </dd>
        </div>
        <div>
          <dt>Target return</dt>
          <dd>8-12%</dd>
        </div>
        <div>
          <dt>Lens</dt>
          <dd>{mode === "total" ? "Total" : mode === "distribution" ? "Distribution" : "Appreciation"}</dd>
        </div>
      </dl>
      <p>{hoverCard.property.address}</p>
    </aside>
  );
}
