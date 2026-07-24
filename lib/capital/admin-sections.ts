/**
 * The Admin console's section registry.
 *
 * One declaration per section drives four things at once: the grouped rail, the
 * `?section=` allowlist on the route, the overview's attention counts, and the
 * redirect targets of the legacy `/admin/*` and `/operations` URLs. Adding a
 * section later is one entry here, not five edits spread across the app.
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
  | "firms"
  | "money"
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
  | "offerings" | "freshness" | "fund-schedules" | "taxonomies"
  | "requests" | "interests" | "professional" | "licences" | "users"
  | "firms" | "memberships"
  | "payments"
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
  { id: "firms", label: { en: "Firms", tr: "Firmalar" } },
  { id: "money", label: { en: "Money", tr: "Finans" } },
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
  { id: "fund-schedules", group: "investments", kind: "panel", label: { en: "Commission schedules", tr: "Komisyon programları" } },
  { id: "taxonomies", group: "investments", kind: "panel", label: { en: "Taxonomies", tr: "Sınıflandırmalar" },
    hint: { en: "Strategy, asset class and region tags", tr: "Strateji, varlık sınıfı ve bölge etiketleri" } },

  // People — everyone who asks for something, and who can act on the platform.
  { id: "requests", group: "people", kind: "queue", queueModule: "requests", label: { en: "Investor requests", tr: "Yatırımcı talepleri" } },
  { id: "interests", group: "people", kind: "panel", label: { en: "Investment interests", tr: "Yatırım ilgileri" } },
  { id: "professional", group: "people", kind: "queue", queueModule: "professional", label: { en: "Professional applications", tr: "Profesyonel başvuruları" } },
  { id: "licences", group: "people", kind: "queue", queueModule: "licences", label: { en: "Licence checks", tr: "Lisans kontrolleri" } },
  { id: "users", group: "people", kind: "panel", label: { en: "Users & roles", tr: "Kullanıcılar ve roller" },
    hint: { en: "Grant or remove platform admin", tr: "Platform yöneticiliği ver veya kaldır" } },

  { id: "firms", group: "firms", kind: "queue", queueModule: "firms", label: { en: "Firm records", tr: "Firma kayıtları" } },
  { id: "memberships", group: "firms", kind: "panel", label: { en: "Firm memberships", tr: "Firma üyelikleri" } },

  { id: "payments", group: "money", kind: "queue", queueModule: "payments", label: { en: "Payments", tr: "Ödemeler" } },

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

/**
 * Where the retired URLs land. `/operations?module=x` used the same keys as the
 * section ids, so most map to themselves; the eight `/admin/<x>` stubs used
 * their own names and are translated here.
 */
export const LEGACY_ADMIN_PATHS: Record<string, AdminSectionId> = {
  "license-verifications": "licences",
  "partner-applications": "professional",
  "firm-memberships": "memberships",
  firms: "firms",
  commissions: "payments",
  interests: "interests",
  leads: "leads",
  audit: "audit",
};
