/**
 * The shape an investor's holdings take once they leave the database.
 *
 * Two admin surfaces read this — the relationship terminal and the cluster
 * views — and they must never disagree about how many buildings a fund holds
 * or what a position is worth. So the derivation lives here once rather than
 * in whichever component was written first.
 *
 * The rules it enforces are the same two the terminal was scoped to:
 *
 * 1. The platform has no record of money an investor received. `committed` is a
 *    cost basis, never a current value, and nothing below the vehicle carries a
 *    dollar figure at all.
 * 2. Nothing may assume Lankin and Epiphany. A future offering can publish no
 *    properties (a debt or blind-pool vehicle) and no unit price — `properties`
 *    can be empty and `shareClasses.unitPrice` is only `recommended` in
 *    OFFERING_FIELD_CATALOGUE. Optional fields stay `undefined` here rather
 *    than collapsing to zero, so a renderer can tell "none published" apart
 *    from "published as nothing".
 */

import type { InvestmentApplication } from "@/lib/equity-market/portal-access";
import type { Lang, OfferingBundle } from "@/lib/equity-market/types";
import { scoreOfferingCompleteness } from "@/lib/equity-market/field-catalogue";
import { primaryShareClass } from "@/lib/equity-market/present";
import { unitPriceOf, impliedShares } from "@/lib/equity-market/shares";
import { tx } from "@/lib/i18n/localize";

export const CADENCE_MONTHS: Record<string, number> = {
  quarterly: 3,
  "semi-annual": 6,
  annual: 12,
  "ad-hoc": 12,
};

export type Building = {
  id: string;
  name: string;
  city: string;
  province: string;
  assetClassId: string;
  condition: string;
  verification: string;
  units?: number;
  vehicleId: string;
  /** Used to order markets west to east. Never drawn as a coordinate. */
  latitude: number;
  longitude: number;
};

export type Vehicle = {
  id: string;
  short: string;
  name: string;
  color: string;
  held: boolean;
  committed: number;
  /** Undefined when no unit price is published — never zero. */
  units?: number;
  unitPrice?: number;
  aum?: string;
  unitsTotal?: number;
  targetReturn?: string;
  targetDistribution?: string;
  minimum?: number;
  periodLabel?: string;
  dataAsOf?: string;
  cadenceMonths?: number;
  /** Discrete published figures. Never plotted as a series. */
  returns: { period: string; value: string }[];
  returnsBasis?: string;
  completeness: number;
  /** The manager's own wordmark, when the offering publishes one. */
  logo?: string;
  managerName?: string;
  buildings: Building[];
};

export type Focus = { type: "vehicle" | "market"; key: string } | null;

/**
 * Builds the vehicle list for one investor.
 *
 * When the investor holds nothing funded, this falls back to every available
 * offering with `committed: 0` and `held: false` so the surface has something
 * to draw. Callers must label that state — the fallback rows are not owned.
 */
export function buildVehicles({
  offerings,
  investments,
  targetUserId,
  lang,
  palette,
}: {
  offerings: OfferingBundle[];
  investments: InvestmentApplication[];
  targetUserId: string;
  lang: Lang;
  palette: readonly string[];
}): { vehicles: Vehicle[]; usingHeld: boolean } {
  const mine = investments.filter((i) => i.userId === targetUserId && i.status === "funded");

  type Held = { offering: OfferingBundle; committed: number; units?: number };
  const held: Held[] = offerings
    .map((offering): Held | null => {
      const rows = mine.filter((i) => i.offeringId === offering.id);
      if (!rows.length) return null;
      const price = unitPriceOf(offering);
      const committed = rows.reduce((sum, r) => sum + r.amount, 0);
      // Units only exist when a price is published (`unitPrice` is merely
      // `recommended` in the catalogue) or the subscription recorded them.
      const recorded = rows.reduce((sum, r) => sum + (r.shareQuantity ?? 0), 0);
      const implied = price ? impliedShares(committed, price) : null;
      const units = recorded > 0 ? recorded : implied != null ? Math.round(implied) : undefined;
      return { offering, committed, units };
    })
    .filter((x): x is Held => x != null);

  const source: Held[] = held.length
    ? held
    : offerings
        .filter((o) => o.status === "available")
        .map((offering) => ({ offering, committed: 0, units: undefined }));

  const vehicles: Vehicle[] = source.map(({ offering, committed, units }, index) => {
    const shareClass = primaryShareClass(offering);
    return {
      id: offering.id,
      short: tx(offering.shortName, lang),
      name: tx(offering.name, lang),
      color: palette[index % palette.length],
      held: held.length > 0,
      committed,
      units,
      unitPrice: unitPriceOf(offering) ?? undefined,
      aum: offering.aum?.value,
      unitsTotal: offering.unitsTotal?.value,
      targetReturn: shareClass?.targetReturn?.value,
      targetDistribution: shareClass?.targetDistribution?.value,
      minimum: shareClass?.minimumInvestment?.value,
      periodLabel: offering.dataPeriodLabel,
      dataAsOf: offering.dataAsOf,
      cadenceMonths: offering.updateCadence ? CADENCE_MONTHS[offering.updateCadence] : undefined,
      returns: (offering.trailingReturns ?? []).map((r) => ({
        period: tx(r.period, lang),
        value: r.value,
      })),
      returnsBasis: offering.trailingReturnsNote ? tx(offering.trailingReturnsNote, lang) : undefined,
      completeness: scoreOfferingCompleteness(offering).percent,
      logo: offering.media?.logo?.src,
      managerName: offering.manager?.name ? tx(offering.manager.name, lang) : undefined,
      buildings: offering.properties.map((p) => ({
        id: `${offering.id}:${p.id}`,
        name: tx(p.name, lang),
        city: p.city,
        province: p.province,
        assetClassId: p.assetClassId,
        condition: p.status,
        verification: p.verificationStatus,
        units: p.unitCount,
        vehicleId: offering.id,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    };
  });

  return { vehicles, usingHeld: held.length > 0 };
}

/** The investors an admin can switch the view to — funded holders, minus self. */
export function fundedInvestorOptions(
  users: { userId: string; displayName?: string; email: string }[],
  investments: InvestmentApplication[],
  currentUserId: string,
) {
  const funded = new Set(investments.filter((i) => i.status === "funded").map((i) => i.userId));
  return users
    .filter((u) => funded.has(u.userId) && u.userId !== currentUserId)
    .map((u) => ({ id: u.userId, label: u.displayName || u.email }));
}

/**
 * A short form for a province, for places where "North Battleford, Saskatchewan"
 * will not fit — a canvas label beside a node, for instance.
 *
 * Falls back to the value as published: an offering outside Canada, or one that
 * already stores a code, must not be mangled into something that looks official
 * but is not.
 */
const PROVINCE_CODES: Record<string, string> = {
  alberta: "AB",
  "british columbia": "BC",
  manitoba: "MB",
  "new brunswick": "NB",
  "newfoundland and labrador": "NL",
  "northwest territories": "NT",
  "nova scotia": "NS",
  nunavut: "NU",
  ontario: "ON",
  "prince edward island": "PE",
  quebec: "QC",
  "québec": "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

export function provinceCode(province: string): string {
  if (!province) return "";
  if (province.length <= 3) return province.toUpperCase();
  return PROVINCE_CODES[province.trim().toLowerCase()] ?? province;
}
