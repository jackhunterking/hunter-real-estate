/**
 * The Admin console's section registry.
 *
 * One declaration per section drives three things at once: the grouped rail, the
 * `?section=` allowlist on the route, and the overview's attention counts. Adding
 * a section later is one entry here, not several edits spread across the app.
 *
 * Deliberately data-only — no React, no icons. `tests/admin-console.test.ts`
 * imports this directly in Node, and the icon map lives with the component that
 * renders it (components/capital/north/AdminConsole.tsx).
 */
import type { LocalizedText } from "./types";

export type AdminSectionGroup =
  | "overview"
  | "investments"
  | "people"
  | "content"
  | "growth"
  | "system";

/**
 * `overview` is the landing summary. `queue` sections filter the live
 * `api.operations_queue` view. `panel` sections mount their own component.
 */
export type AdminSectionKind = "overview" | "queue" | "panel";

export type AdminSectionId =
  | "overview"
  | "offerings" | "freshness" | "taxonomies" | "network"
  | "investors" | "requests" | "interests" | "users"
  | "content"
  | "leads"
  | "audit" | "email" | "legal";

export type AdminSection = {
  id: AdminSectionId;
  group: AdminSectionGroup;
  kind: AdminSectionKind;
  label: LocalizedText;
  /** Queue sections only: the `module` value they filter `operations_queue` on. */
  queueModule?: string;
  /** Shown under the label in the rail when the section needs explaining. */
  hint?: LocalizedText;
};

export const ADMIN_SECTION_GROUPS: { id: AdminSectionGroup; label: LocalizedText }[] = [
  { id: "overview", label: { en: "", tr: "" } },
  { id: "investments", label: { en: "Investments", tr: "Yatırımlar" } },
  { id: "people", label: { en: "People", tr: "Kişiler" } },
  { id: "content", label: { en: "Content", tr: "İçerik" } },
  { id: "growth", label: { en: "Growth", tr: "Büyüme" } },
  { id: "system", label: { en: "System", tr: "Sistem" } },
];

export const ADMIN_SECTIONS: AdminSection[] = [
  { id: "overview", group: "overview", kind: "overview", label: { en: "Overview", tr: "Genel bakış" } },

  // Investments — the profiles investors read, and everything that keeps them true.
  { id: "offerings", group: "investments", kind: "panel", label: { en: "Investment profiles", tr: "Yatırım profilleri" } },
  // Not a queue section — the panel reads offering rows directly. The
  // `freshness` branch of operations_queue still feeds the overview's counts.
  { id: "freshness", group: "investments", kind: "panel", label: { en: "Data freshness", tr: "Veri güncelliği" } },
  { id: "taxonomies", group: "investments", kind: "panel", label: { en: "Taxonomies", tr: "Sınıflandırmalar" },
    hint: { en: "Strategy, asset class and region tags", tr: "Strateji, varlık sınıfı ve bölge etiketleri" } },
  // Trial surface. Admin-only by virtue of living here — `canAccessPath` gates
  // every /admin path on the operations workspace. Removing this one entry
  // removes the section from the rail and the `?section=` allowlist together.
  { id: "network", group: "investments", kind: "panel", label: { en: "Asset network", tr: "Varlık ağı" },
    hint: {
      en: "Holdings as a relationship graph — swipes tier by tier on a phone",
      tr: "Pozisyonların ilişki grafiği — telefonda katman katman kaydırılır",
    } },

  // People — the investors and their relationship with the platform.
  { id: "investors", group: "people", kind: "panel", label: { en: "Investors", tr: "Yatırımcılar" },
    hint: { en: "Each investor's portfolio, requests and transaction status", tr: "Her yatırımcının portföyü, talepleri ve işlem durumu" } },
  { id: "requests", group: "people", kind: "queue", queueModule: "requests", label: { en: "Investor requests", tr: "Yatırımcı talepleri" } },
  { id: "interests", group: "people", kind: "panel", label: { en: "Investment interests", tr: "Yatırım ilgileri" } },
  { id: "users", group: "people", kind: "panel", label: { en: "Users & roles", tr: "Kullanıcılar ve roller" },
    hint: { en: "Grant or remove platform admin", tr: "Platform yöneticiliği ver veya kaldır" } },

  { id: "content", group: "content", kind: "panel", label: { en: "Learning centre", tr: "Bilgi merkezi" } },

  { id: "leads", group: "growth", kind: "queue", queueModule: "leads", label: { en: "Leads", tr: "Potansiyel müşteriler" } },

  { id: "audit", group: "system", kind: "queue", queueModule: "audit", label: { en: "Audit activity", tr: "Denetim faaliyeti" } },
  { id: "email", group: "system", kind: "panel", label: { en: "Email delivery", tr: "E-posta teslimi" } },
  { id: "legal", group: "system", kind: "panel", label: { en: "Legal documents", tr: "Hukuki belgeler" } },
];

const BY_ID = new Map(ADMIN_SECTIONS.map((section) => [section.id, section]));

export function adminSection(id: string | undefined): AdminSection {
  return (id && BY_ID.get(id as AdminSectionId)) || BY_ID.get("overview")!;
}

export function isAdminSectionId(value: string | undefined): value is AdminSectionId {
  return Boolean(value && BY_ID.has(value as AdminSectionId));
}

export function adminSectionsByGroup(group: AdminSectionGroup): AdminSection[] {
  return ADMIN_SECTIONS.filter((section) => section.group === group);
}
