"use client";

/**
 * The Admin console's landing screen: what needs attention, before you pick a
 * section.
 *
 * Attention-first is the whole point. Every tile is derived from data already
 * loaded for the sections themselves — no extra round trip — and anything that
 * is actually waiting on a human reads as a warning, not as a bare number. A
 * zero is deliberately quiet: an empty queue should not compete for the eye.
 */
import { useMemo } from "react";
import { ArrowRight, CalendarClock, TriangleAlert } from "lucide-react";
import type { AdminSectionId } from "@/lib/capital/admin-sections";
import type { OfferingAdminRow } from "@/lib/capital/offering-admin-server";
import type { AdminUserRow } from "@/lib/capital/admin-server";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import { formatMoneyCompact } from "@/lib/capital/present";
import { scoreOfferingCompleteness } from "@/lib/capital/field-catalogue";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { Panel, shortDate } from "../PortalUI";

export type OverviewQueueCounts = Partial<Record<string, number>>;

const COPY = {
  en: {
    title: "Overview",
    description: "Everything waiting on you, across the platform.",
    attention: "Needs attention", allClear: "Nothing is waiting. Every queue is empty and every investment is current.",
    recent: "Recent activity", noRecent: "No activity recorded yet.",
    open: "Open",
    tiles: {
      capital: "Total committed capital", positions: "Funded positions",
      requests: "Requests awaiting action", leads: "Leads",
    },
    overdue: "overdue for review", dueSoon: "due for review soon", unscheduled: "with no review schedule",
    incomplete: "investment profile(s) below 100%", missingRequired: "missing required fields",
    admins: "platform administrator(s)", users: "user(s)",
    investments: "Investments", people: "People",
  },
  tr: {
    title: "Genel bakış",
    description: "Platform genelinde sizi bekleyen her şey.",
    attention: "Dikkat gerektiriyor", allClear: "Bekleyen iş yok. Tüm kuyruklar boş ve tüm yatırımlar güncel.",
    recent: "Son faaliyet", noRecent: "Henüz faaliyet kaydı yok.",
    open: "Aç",
    tiles: {
      capital: "Toplam taahhüt edilen sermaye", positions: "Fonlanan pozisyonlar",
      requests: "İşlem bekleyen talepler", leads: "Potansiyel müşteriler",
    },
    overdue: "incelemesi gecikmiş", dueSoon: "incelemesi yaklaşan", unscheduled: "inceleme planı olmayan",
    incomplete: "yatırım profili %100'ün altında", missingRequired: "zorunlu alan eksik",
    admins: "platform yöneticisi", users: "kullanıcı",
    investments: "Yatırımlar", people: "Kişiler",
  },
} as const;

type AttentionItem = { id: string; label: string; tone: "warn" | "bad"; section: AdminSectionId };

const AWAITING_STATUSES = new Set(["submitted", "compliance_review", "approved_for_subscription", "accepted"]);

export function AdminOverview({
  queueCounts,
  offerings,
  users,
  investments,
  recent,
  onOpen,
}: {
  queueCounts: OverviewQueueCounts;
  offerings: OfferingAdminRow[];
  users: AdminUserRow[];
  investments: InvestmentApplication[];
  recent: { id: string; title: string; summary: string; date: string }[];
  onOpen: (section: AdminSectionId) => void;
}) {
  const { lang } = useLang();
  const c = pick(COPY, lang);

  const funded = investments.filter((investment) => investment.status === "funded");
  const totalCommitted = funded.reduce((sum, investment) => sum + investment.amount, 0);
  const awaiting = investments.filter((investment) => AWAITING_STATUSES.has(investment.status)).length;
  const capitalTiles: { key: string; label: string; display: string; active: boolean; section: AdminSectionId }[] = [
    { key: "capital", label: c.tiles.capital, display: totalCommitted > 0 ? formatMoneyCompact(totalCommitted, lang) : "—", active: totalCommitted > 0, section: "investors" },
    { key: "positions", label: c.tiles.positions, display: String(funded.length), active: funded.length > 0, section: "investors" },
    { key: "requests", label: c.tiles.requests, display: String(awaiting), active: awaiting > 0, section: "requests" },
    { key: "leads", label: c.tiles.leads, display: String(queueCounts.leads ?? 0), active: (queueCounts.leads ?? 0) > 0, section: "leads" },
  ];

  const { attention, incomplete } = useMemo(() => {
    const items: AttentionItem[] = [];
    const overdue = offerings.filter((o) => o.freshnessStatus === "overdue");
    const dueSoon = offerings.filter((o) => o.freshnessStatus === "due-soon");
    const unscheduled = offerings.filter((o) => o.freshnessStatus === "unscheduled");
    const scored = offerings
      .map((o) => ({ offering: o, score: scoreOfferingCompleteness(o.bundle) }))
      .filter((entry) => entry.score.percent < 100);

    for (const o of overdue) {
      items.push({ id: `overdue-${o.id}`, tone: "bad", section: "freshness",
        label: `${tx(o.bundle?.name, lang) || o.slug} — ${c.overdue}` });
    }
    for (const o of unscheduled) {
      items.push({ id: `unsched-${o.id}`, tone: "warn", section: "freshness",
        label: `${tx(o.bundle?.name, lang) || o.slug} — ${c.unscheduled}` });
    }
    for (const o of dueSoon) {
      items.push({ id: `due-${o.id}`, tone: "warn", section: "freshness",
        label: `${tx(o.bundle?.name, lang) || o.slug} — ${c.dueSoon}` });
    }
    for (const { offering, score } of scored) {
      if (!score.missingRequired.length) continue;
      items.push({ id: `gap-${offering.id}`, tone: "warn", section: "offerings",
        label: `${tx(offering.bundle?.name, lang) || offering.slug} — ${score.missingRequired.length} ${c.missingRequired}` });
    }
    return { attention: items, incomplete: scored.length };
  }, [offerings, lang, c]);

  const adminCount = users.filter((u) => u.platformRoles.includes("master_admin")).length;

  return <section className="flex flex-col gap-6">
    <div>
      <h2 className="text-2xl font-semibold text-[#18384e]">{c.title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#657681]">{c.description}</p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {capitalTiles.map((tile) => (
        <Tile key={tile.key} label={tile.label} display={tile.display} active={tile.active} onOpen={() => onOpen(tile.section)} />
      ))}
    </div>

    <Panel className="p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#234154]">
        <TriangleAlert className="size-4 text-[#8a6d24]" />{c.attention}
      </h3>
      {attention.length === 0 ? (
        <p className="rounded-md bg-[#e8f4ed] px-3 py-2.5 text-sm font-medium text-[#2f7d55]">{c.allClear}</p>
      ) : (
        <ul className="divide-y divide-[#eef2f4]">
          {attention.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onOpen(item.section)}
                className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:text-[#0a4b72]">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={`size-1.5 shrink-0 rounded-full ${item.tone === "bad" ? "bg-[#a24d43]" : "bg-[#c99b2e]"}`} />
                  <span className="truncate text-sm text-[#2c4352]">{item.label}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-[#87929a]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>

    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#234154]">
          <CalendarClock className="size-4 text-[#0a4b72]" />{c.investments}
        </h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label={c.investments} value={offerings.length} />
          <Stat label={c.incomplete} value={incomplete} tone={incomplete ? "warn" : "ok"} />
        </dl>
        <h3 className="mb-3 mt-6 font-semibold text-[#234154]">{c.people}</h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label={c.users} value={users.length} />
          <Stat label={c.admins} value={adminCount} />
        </dl>
      </Panel>

      <Panel className="p-5">
        <h3 className="mb-3 font-semibold text-[#234154]">{c.recent}</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-[#71808a]">{c.noRecent}</p>
        ) : (
          <ul className="divide-y divide-[#eef2f4]">
            {recent.slice(0, 8).map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-[#2c4352]">{event.title}</span>
                  <span className="block truncate text-xs text-[#87929a]">{event.summary}</span>
                </span>
                {event.date && <span className="shrink-0 text-[11px] text-[#87929a]">{shortDate(event.date.slice(0, 10), lang)}</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  </section>;
}

function Tile({ label, display, active, onOpen }: { label: string; display: string; active: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen}
      className={`rounded-lg border p-4 text-left transition ${
        active ? "border-[#cfe0ea] bg-[#f2f7fa]" : "border-[#d9e1e5] bg-white"
      } hover:border-[#8aaabd]`}>
      <span className={`block text-2xl font-semibold tabular-nums ${active ? "text-[#123f5e]" : "text-[#9aa8b1]"}`}>{display}</span>
      <span className="mt-1 block text-[11px] font-semibold leading-4 text-[#657681]">{label}</span>
    </button>
  );
}

function Stat({ label, value, tone = "ok" }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return <div>
    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#87929a]">{label}</dt>
    <dd className={`mt-1 text-lg font-semibold tabular-nums ${tone === "warn" ? "text-[#8a6d24]" : "text-[#2c4352]"}`}>{value}</dd>
  </div>;
}
