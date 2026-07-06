import { type EquitonProperty, equitonProperties } from "./equitonMapData";

// The reference site (data.sael.net/city) groups its buildings into valuation
// tiers. Real estate has no single "valuation" field here, so we derive an
// equivalent size tier from the verified building height (floors). Swap the
// metric here if a market-value field is added to EquitonProperty later.

export type TierId = "flagship" | "core" | "emerging";
export type GroupBy = "tier" | "city";

export type Tier = {
  id: TierId;
  label: string;
  caption: string;
  minFloors: number;
  accent: string;
};

export const TIERS: Tier[] = [
  { id: "flagship", label: "Flagship", caption: "15+ floors", minFloors: 15, accent: "#ebc76b" },
  { id: "core", label: "Core", caption: "10–14 floors", minFloors: 10, accent: "#9fb1c7" },
  { id: "emerging", label: "Emerging", caption: "Under 10 floors", minFloors: 0, accent: "#1fefa1" },
];

export function getTierForProperty(property: EquitonProperty): Tier {
  const floors = property.buildingProfile.floors;
  return TIERS.find((tier) => floors >= tier.minFloors) ?? TIERS[TIERS.length - 1];
}

export function getTierAccent(property: EquitonProperty): string {
  return getTierForProperty(property).accent;
}

export type PropertyGroup = {
  key: string;
  label: string;
  caption?: string;
  accent?: string;
  properties: EquitonProperty[];
};

/** Group properties for the Data Overview panel, either by size tier or by city. */
export function groupProperties(groupBy: GroupBy): PropertyGroup[] {
  if (groupBy === "city") {
    const byCity = new Map<string, EquitonProperty[]>();
    for (const property of equitonProperties) {
      const list = byCity.get(property.city) ?? [];
      list.push(property);
      byCity.set(property.city, list);
    }
    return [...byCity.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([city, properties]) => ({
        key: city,
        label: city,
        caption: `${properties.length} ${properties.length === 1 ? "property" : "properties"}`,
        properties,
      }));
  }

  return TIERS.map((tier) => ({
    key: tier.id,
    label: tier.label,
    caption: tier.caption,
    accent: tier.accent,
    properties: equitonProperties.filter((property) => getTierForProperty(property).id === tier.id),
  })).filter((group) => group.properties.length > 0);
}
