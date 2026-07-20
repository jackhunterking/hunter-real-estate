import { tx } from "@/lib/i18n/localize";
import type { Lang, LocalizedText } from "./types";

export type TaxonomyItem = { id: string; label: LocalizedText; color: string };

export const strategies: TaxonomyItem[] = [
  { id: "core-plus", label: { en: "Core Plus", tr: "Core Plus" }, color: "#61765b" },
  { id: "value-add", label: { en: "Value Add", tr: "Değer Artırma" }, color: "#a27138" },
];

export const assetClasses: TaxonomyItem[] = [
  { id: "multifamily", label: { en: "Multifamily", tr: "Çok Konutlu" }, color: "#365f72" },
  { id: "commercial", label: { en: "Commercial", tr: "Ticari" }, color: "#806b46" },
];

export const regions: TaxonomyItem[] = [
  { id: "ontario", label: { en: "Ontario", tr: "Ontario" }, color: "#456b63" },
  { id: "alberta", label: { en: "Alberta", tr: "Alberta" }, color: "#8b6645" },
  { id: "saskatchewan", label: { en: "Saskatchewan", tr: "Saskatchewan" }, color: "#7b7652" },
  { id: "manitoba", label: { en: "Manitoba", tr: "Manitoba" }, color: "#59717a" },
  { id: "british-columbia", label: { en: "British Columbia", tr: "British Columbia" }, color: "#5c7157" },
];

export function taxonomyLabel(items: TaxonomyItem[], id: string, lang: Lang) {
  const item = items.find((item) => item.id === id);
  return item ? tx(item.label, lang) : id;
}
