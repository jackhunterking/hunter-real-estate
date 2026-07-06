import { type EquitonProperty, type InvestmentMode, equitonApartmentFund, equitonProperties } from "../equitonMapData";
import { formatCurrency } from "../format";
import { getTierForProperty } from "../tiers";
import { SourceIcon } from "./icons";
import { ScenarioBar } from "./ScenarioBar";
import { BuildingImage } from "./BuildingImage";
import styles from "../investor-map.module.css";

/**
 * The property media + detail body. Shared by the desktop drawer
 * (`PropertyDrawer`) and the mobile bottom sheet (`MobileSheet`).
 */
export function PropertyDetail({
  selectedProperty,
  selectedId,
  amount,
  mode,
  monthlyLow,
  monthlyHigh,
  onSelectProperty,
}: {
  selectedProperty: EquitonProperty;
  selectedId: string;
  amount: number;
  mode: InvestmentMode;
  monthlyLow: number;
  monthlyHigh: number;
  onSelectProperty: (property: EquitonProperty) => void;
}) {
  const tier = getTierForProperty(selectedProperty);

  return (
    <>
      <div className={styles.propertyMedia}>
        <BuildingImage property={selectedProperty} />
        <span>Satellite · verified</span>
      </div>

      <div className={styles.drawerBody}>
        <div className={styles.propertyTitleRow}>
          <div>
            <p>
              {selectedProperty.city}, {selectedProperty.province}
            </p>
            <h1>{selectedProperty.name}</h1>
          </div>
          <a
            href={selectedProperty.sourceUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open official source for ${selectedProperty.name}`}
          >
            <SourceIcon />
          </a>
        </div>

        <p className={styles.address}>{selectedProperty.address}</p>

        <div className={styles.propertyStrip} aria-label="Verified properties">
          {equitonProperties.map((property) => (
            <button
              key={property.id}
              type="button"
              className={property.id === selectedId ? styles.stripActive : ""}
              data-property-id={`selector-${property.id}`}
              aria-label={`Select ${property.name}`}
              onClick={() => onSelectProperty(property)}
              onPointerDown={() => onSelectProperty(property)}
            >
              <span
                className={styles.stripTier}
                style={{ background: getTierForProperty(property).accent }}
                aria-hidden="true"
              />
              <strong>{property.name}</strong>
              <small>{property.city}</small>
            </button>
          ))}
        </div>

        <div className={styles.detailGrid}>
          <div>
            <span>Size tier</span>
            <strong>
              {tier.label} · {selectedProperty.buildingProfile.floors} floors
            </strong>
          </div>
          <div>
            <span>Verified coordinate</span>
            <strong>
              {selectedProperty.latitude.toFixed(5)}, {selectedProperty.longitude.toFixed(5)}
            </strong>
          </div>
          <div>
            <span>Scenario capital</span>
            <strong>{formatCurrency(amount)}</strong>
          </div>
          <div>
            <span>Monthly equivalent</span>
            <strong>
              {formatCurrency(monthlyLow)}-{formatCurrency(monthlyHigh)}
            </strong>
          </div>
          <div>
            <span>Public fund source</span>
            <strong>Checked {equitonApartmentFund.sourceCheckedAt}</strong>
          </div>
          <div>
            <span>3D model source</span>
            <strong>Esri Open 3D Buildings</strong>
          </div>
        </div>

        <ScenarioBar mode={mode} amount={amount} />

        <p className={styles.complianceNote}>
          Illustrative only. Target returns and monthly equivalents are not guaranteed.
        </p>
        <p className={styles.modelStatus}>
          3D building context is rendered from Esri Open 3D Buildings, based on Overture Maps and
          OpenStreetMap contributor data. The selected property address and coordinate come from the
          verified Equiton listing.
        </p>
        <p className={styles.disclaimer}>{equitonApartmentFund.disclaimer}</p>
      </div>
    </>
  );
}
