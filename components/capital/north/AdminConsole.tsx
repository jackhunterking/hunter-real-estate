"use client";

/**
 * The master Admin console — one page for every administrative surface.
 *
 * Sections are declared once in lib/capital/admin-sections.ts; this component
 * renders the grouped rail from that registry and mounts either the shared queue
 * view or the section's own panel. The console is investor-relationship first:
 * the Investors section mirrors what each investor sees and carries the controls
 * to manage their requests and transaction status.
 */
import { useMemo, useState } from "react";
import {
  BookOpen, CalendarClock, ClipboardCheck, FileSearch, LayoutDashboard, Landmark,
  Mail, Scale, Search, ShieldCheck, Tags, UserCheck, Users, X,
} from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import type { LearningAdminResource } from "@/lib/capital/learning";
import type { OfferingAdminRow } from "@/lib/capital/offering-admin-server";
import type { AdminDirectories } from "@/lib/capital/admin-server";
import {
  ADMIN_SECTIONS, ADMIN_SECTION_GROUPS, adminSection,
  type AdminSectionId,
} from "@/lib/capital/admin-sections";
import { hasPlatformRole } from "@/lib/capital/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import { LearningContentManager } from "./LearningContentManager";
import { OfferingContentManager } from "./OfferingContentManager";
import { OfferingDataFreshness } from "./OfferingDataFreshness";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminInvestors } from "./admin/AdminInvestors";
import { RecordTable } from "./admin/RecordTable";
import { TaxonomyManager } from "./admin/TaxonomyManager";
import { UsersAndRoles } from "./admin/UsersAndRoles";
import { usePortalAccess } from "./PortalAccessProvider";
import { PageHeader, Panel, shortDate } from "./PortalUI";

/** Queue modules emitted by `api.operations_queue`. */
export type QueueModule = "requests" | "leads" | "audit" | "freshness";

export type OperationsQueueItem = {
  id: string;
  module: QueueModule;
  title: string;
  summary: string;
  status: string;
  date: string;
  details: Record<string, string | number | undefined>;
};

const SECTION_ICONS: Record<AdminSectionId, typeof ShieldCheck> = {
  overview: LayoutDashboard,
  offerings: Landmark, freshness: CalendarClock, taxonomies: Tags,
  investors: Users, requests: ClipboardCheck, interests: FileSearch, users: UserCheck,
  content: BookOpen,
  leads: FileSearch,
  audit: FileSearch, email: Mail, legal: Scale,
};

const COPY = {
  en: {
    eyebrow: "Hunter & Hunter Investment Advisors staff",
    title: "Admin",
    description: "One console for investors, investments, content and system records.",
    search: "Search this queue", noItems: "No items match these filters.",
    close: "Close", jumpTo: "Jump to section",
    descriptions: {
      requests: "Investors asking to invest in a published investment.",
      leads: "Enquiries captured from the public site.",
      audit: "Every privileged action recorded on the platform.",
      interests: "Investors who registered interest in an investment.",
      email: "Delivery state for every transactional email the platform sent.",
      legal: "Published versions of the platform's legal documents.",
    },
  },
  tr: {
    eyebrow: "Hunter & Hunter Investment Advisors ekibi",
    title: "Yönetim",
    description: "Yatırımcılar, yatırımlar, içerik ve sistem kayıtları için tek konsol.",
    search: "Bu kuyrukta ara", noItems: "Bu filtrelerle eşleşen kayıt yok.",
    close: "Kapat", jumpTo: "Bölüme git",
    descriptions: {
      requests: "Yayımlanmış bir yatırıma yatırım yapmak isteyen yatırımcılar.",
      leads: "Genel siteden toplanan talepler.",
      audit: "Platformda kaydedilen tüm ayrıcalıklı işlemler.",
      interests: "Bir yatırıma ilgi kaydeden yatırımcılar.",
      email: "Platformun gönderdiği her işlem e-postasının teslim durumu.",
      legal: "Platformun hukuki belgelerinin yayımlanmış sürümleri.",
    },
  },
} as const;

export function AdminConsole({
  initialSection = "overview",
  initialQueue = [],
  offerings = [],
  offeringAdmin = [],
  learningResources = [],
  directories,
  backendConfigured = false,
}: {
  initialSection?: AdminSectionId;
  initialQueue?: OperationsQueueItem[];
  offerings?: OfferingBundle[];
  offeringAdmin?: OfferingAdminRow[];
  learningResources?: LearningAdminResource[];
  directories: AdminDirectories;
  backendConfigured?: boolean;
}) {
  const { lang } = useLang();
  const { currentUser, dataset } = usePortalAccess();
  const c = investorTerminology(pick(COPY, lang));
  const [section, setSection] = useState<AdminSectionId>(initialSection);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OperationsQueueItem | null>(null);
  const isAdmin = hasPlatformRole(currentUser, "master_admin");

  const active = adminSection(section);

  /** One pass over the queue gives both the per-module counts and the rows. */
  const { counts, byModule } = useMemo(() => {
    const counts: Record<string, number> = {};
    const byModule = new Map<string, OperationsQueueItem[]>();
    for (const item of initialQueue) {
      counts[item.module] = (counts[item.module] ?? 0) + 1;
      const list = byModule.get(item.module) ?? [];
      list.push(item);
      byModule.set(item.module, list);
    }
    return { counts, byModule };
  }, [initialQueue]);

  const queueRows = useMemo(() => {
    if (!active.queueModule) return [];
    const rows = byModule.get(active.queueModule) ?? [];
    const needle = query.toLocaleLowerCase();
    return rows
      .filter((item) => `${item.title} ${item.summary} ${item.status}`.toLocaleLowerCase().includes(needle))
      .sort((a, b) => Date.parse(b.date || "1970-01-01") - Date.parse(a.date || "1970-01-01"));
  }, [active.queueModule, byModule, query]);

  if (!isAdmin) {
    return <div>
      <PageHeader title={c.title} />
      <p className="-mt-4 mb-6 max-w-3xl text-sm leading-6 text-[#657681]">{c.description}</p>
    </div>;
  }

  const descriptions = c.descriptions as Record<string, string>;

  return <div>
    {/* PageHeader accepts `description` but renders only the title, so the
        console's own subtitle is written here rather than changing the shared
        component and shifting every other page. */}
    <PageHeader title={c.title} />
    <p className="-mt-4 mb-6 max-w-3xl text-sm leading-6 text-[#657681]">{c.description}</p>

    {/* Under lg the rail collapses to a single select. */}
    <label className="mb-4 block lg:hidden">
      <span className="sr-only">{c.jumpTo}</span>
      <select value={section} onChange={(e) => setSection(e.target.value as AdminSectionId)}
        className="h-11 w-full rounded-md border border-[#d5dde2] bg-white px-3 text-sm font-semibold text-[#31566c]">
        {ADMIN_SECTION_GROUPS.map((group) => {
          const items = ADMIN_SECTIONS.filter((s) => s.group === group.id);
          if (!items.length) return null;
          const label = tx(group.label, lang);
          return label
            ? <optgroup key={group.id} label={label}>
                {items.map((s) => <option key={s.id} value={s.id}>{tx(s.label, lang)}</option>)}
              </optgroup>
            : items.map((s) => <option key={s.id} value={s.id}>{tx(s.label, lang)}</option>);
        })}
      </select>
    </label>

    <div className="grid gap-6 lg:grid-cols-[236px_minmax(0,1fr)]">
      <nav aria-label={c.title} className="hidden lg:block">
        <div className="sticky top-6 space-y-5">
          {ADMIN_SECTION_GROUPS.map((group) => {
            const items = ADMIN_SECTIONS.filter((s) => s.group === group.id);
            if (!items.length) return null;
            const groupLabel = tx(group.label, lang);
            return (
              <div key={group.id}>
                {groupLabel && (
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b98a1]">{groupLabel}</p>
                )}
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = SECTION_ICONS[item.id];
                    const count = item.queueModule ? counts[item.queueModule] ?? 0 : 0;
                    const isActive = section === item.id;
                    return (
                      <li key={item.id}>
                        <button type="button" onClick={() => { setSection(item.id); setQuery(""); }}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                            isActive ? "bg-[#0a2d46] text-white" : "text-[#4d616e] hover:bg-[#eef2f4]"
                          }`}>
                          <Icon className={`size-4 shrink-0 ${isActive ? "text-white" : "text-[#7b919e]"}`} />
                          <span className="min-w-0 flex-1 truncate">{tx(item.label, lang)}</span>
                          {count > 0 && (
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                              isActive ? "bg-white/20 text-white" : "bg-[#e4ebef] text-[#54697a]"
                            }`}>{count}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="min-w-0">
        {active.kind === "overview" && (
          <AdminOverview
            queueCounts={counts}
            offerings={offeringAdmin}
            users={directories.users}
            investments={dataset.investments}
            recent={(byModule.get("audit") ?? []).slice(0, 8).map((item) => ({
              id: item.id, title: item.title, summary: item.summary, date: item.date,
            }))}
            onOpen={setSection}
          />
        )}

        {active.id === "investors" && <AdminInvestors users={directories.users} investments={dataset.investments} offerings={offerings} />}
        {active.id === "offerings" && <OfferingContentManager offerings={offeringAdmin} backendConfigured={backendConfigured} />}
        {active.id === "freshness" && <OfferingDataFreshness offerings={offeringAdmin} backendConfigured={backendConfigured} onEdit={() => setSection("offerings")} />}
        {active.id === "taxonomies" && <TaxonomyManager taxonomies={directories.taxonomies} />}
        {active.id === "content" && <LearningContentManager resources={learningResources} backendConfigured={backendConfigured} />}
        {active.id === "users" && <UsersAndRoles users={directories.users} />}
        {active.id === "interests" && <RecordTable title={tx(active.label, lang)} description={descriptions.interests} rows={directories.interests} />}
        {active.id === "email" && <RecordTable title={tx(active.label, lang)} description={descriptions.email} rows={directories.email} />}
        {active.id === "legal" && <RecordTable title={tx(active.label, lang)} description={descriptions.legal} rows={directories.legal} />}

        {active.kind === "queue" && (
          <section>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#18384e]">{tx(active.label, lang)}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#657681]">{descriptions[active.id]}</p>
              </div>
              <label className="relative block min-w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81909a]" />
                <span className="sr-only">{c.search}</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search}
                  className="h-10 w-full rounded-md border border-[#d5dde2] bg-white pl-9 pr-3 text-sm" />
              </label>
            </div>
            <Panel className="overflow-hidden">
              <div className="divide-y divide-[#e8ecee]">
                {queueRows.map((item) => {
                  const Icon = SECTION_ICONS[active.id];
                  return (
                    <button key={item.id} type="button" onClick={() => setSelected(item)}
                      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left hover:bg-[#f7f9fa]">
                      <span className="grid size-10 place-items-center rounded-lg bg-[#edf3f6] text-[#0a4b72]"><Icon className="size-5" /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#1c3546]">{item.title}</span>
                        <span className="mt-1 block truncate text-xs text-[#6b7982]">{item.summary}</span>
                      </span>
                      <span className="text-right">
                        <span className="block rounded bg-[#eef2f4] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5f6e78]">{item.status}</span>
                        {item.date && <span className="mt-1.5 block text-[10px] text-[#87929a]">{shortDate(item.date.slice(0, 10), lang)}</span>}
                      </span>
                    </button>
                  );
                })}
                {!queueRows.length && <div className="p-12 text-center text-sm text-[#697680]">{c.noItems}</div>}
              </div>
            </Panel>
          </section>
        )}
      </div>
    </div>

    {selected && (
      <div className="fixed inset-0 z-[80]">
        <button type="button" aria-label={c.close} className="absolute inset-0 bg-[#061521]/50" onClick={() => setSelected(null)} />
        <aside role="dialog" aria-modal="true" aria-labelledby="admin-drawer-title"
          className="absolute inset-y-0 right-0 w-[min(94vw,520px)] overflow-y-auto bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b878f]">{tx(active.label, lang)}</p>
              <h2 id="admin-drawer-title" className="mt-2 text-xl font-semibold text-[#183246]">{selected.title}</h2>
              <span className="mt-2 inline-flex rounded bg-[#eef2f4] px-2 py-1 text-xs font-bold text-[#5c6b75]">{selected.status}</span>
            </div>
            <button type="button" aria-label={c.close} onClick={() => setSelected(null)}
              className="grid size-9 place-items-center rounded-full hover:bg-[#eef2f4]"><X className="size-5" /></button>
          </div>
          <dl className="mt-7 divide-y divide-[#e8ecee]">
            {Object.entries(selected.details)
              .filter(([, value]) => value !== undefined && value !== "")
              .map(([key, value]) => (
                <div key={key} className="py-3">
                  <dt className="text-xs font-semibold text-[#75818a]">{key}</dt>
                  <dd className="mt-1 break-words text-sm leading-6 text-[#2c4352]">{String(value)}</dd>
                </div>
              ))}
          </dl>
        </aside>
      </div>
    )}
  </div>;
}
