"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import type { AdminUserRow } from "@/lib/capital/admin-server";
import { formatMoneyCompact } from "@/lib/capital/present";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { InvestorPortfolio } from "../InvestorPortfolio";
import { InvestorInvestments } from "./InvestorInvestments";
import { Panel } from "../PortalUI";

type Status = InvestmentApplication["status"];

const STATUS_LABELS: Record<Status, { en: string; tr: string }> = {
  draft: { en: "Draft", tr: "Taslak" },
  submitted: { en: "Submitted", tr: "Gönderildi" },
  compliance_review: { en: "Compliance review", tr: "Uyum incelemesi" },
  approved_for_subscription: { en: "Approved", tr: "Onaylandı" },
  accepted: { en: "Accepted", tr: "Kabul edildi" },
  funded: { en: "Funded", tr: "Fonlandı" },
  declined: { en: "Declined", tr: "Reddedildi" },
  withdrawn: { en: "Withdrawn", tr: "Geri çekildi" },
  closed: { en: "Closed", tr: "Kapandı" },
};

const COPY = {
  en: {
    title: "Investors",
    lead: "Every investor, exactly as they see their portfolio — plus the controls to manage their requests and transaction status.",
    search: "Search investors",
    none: "No investor records yet.",
    noMatch: "No investors match your search.",
    back: "All investors",
    positions: "positions", invested: "invested", requests: "requests", noActivity: "No requests yet",
    mirrorTitle: "What this investor sees",
    mirrorNote: "A live mirror of this investor's portfolio — the same cards, figures and status the investor sees.",
    individual: "Individual", entity: "Entity",
  },
  tr: {
    title: "Yatırımcılar",
    lead: "Her yatırımcı, portföyünü tam olarak gördüğü gibi — ayrıca taleplerini ve işlem durumunu yönetme kontrolleriyle.",
    search: "Yatırımcı ara",
    none: "Henüz yatırımcı kaydı yok.",
    noMatch: "Aramanızla eşleşen yatırımcı yok.",
    back: "Tüm yatırımcılar",
    positions: "pozisyon", invested: "yatırılan", requests: "talep", noActivity: "Henüz talep yok",
    mirrorTitle: "Bu yatırımcının gördüğü",
    mirrorNote: "Yatırımcının portföyünün canlı yansıması — yatırımcının gördüğü kartlar, rakamlar ve durum.",
    individual: "Bireysel", entity: "Tüzel kişi",
  },
} as const;

type InvestorStat = {
  user: AdminUserRow;
  requests: number;
  positions: number;
  totalInvested: number;
  latest: Status | null;
};

export function AdminInvestors({
  users,
  investments,
  offerings,
}: {
  users: AdminUserRow[];
  investments: InvestmentApplication[];
  offerings: OfferingBundle[];
}) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const byUser = useMemo(() => {
    const map = new Map<string, InvestmentApplication[]>();
    for (const investment of investments) {
      const list = map.get(investment.userId) ?? [];
      list.push(investment);
      map.set(investment.userId, list);
    }
    return map;
  }, [investments]);

  const stats = useMemo<InvestorStat[]>(() => {
    return users
      .filter((user) => user.accountIntent === "investor" || (byUser.get(user.userId)?.length ?? 0) > 0)
      .map((user) => {
        const apps = byUser.get(user.userId) ?? [];
        const funded = apps.filter((application) => application.status === "funded");
        const latest = [...apps].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
        return {
          user,
          requests: apps.length,
          positions: new Set(funded.map((application) => application.offeringId)).size,
          totalInvested: funded.reduce((sum, application) => sum + application.amount, 0),
          latest: latest ? latest.status : null,
        };
      })
      .sort((a, b) => b.totalInvested - a.totalInvested || a.user.displayName.localeCompare(b.user.displayName));
  }, [users, byUser]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return stats;
    return stats.filter((stat) => `${stat.user.displayName} ${stat.user.email}`.toLocaleLowerCase().includes(needle));
  }, [stats, query]);

  const selected = selectedId ? stats.find((stat) => stat.user.userId === selectedId) : null;

  if (selected) {
    const user = selected.user;
    return (
      <section>
        <button type="button" onClick={() => setSelectedId(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a4b72] hover:underline">
          <ArrowLeft className="size-4" />{c.back}
        </button>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#18384e]">{user.displayName}</h2>
          <p className="mt-1 text-sm text-[#657681]">
            {user.email}
            {user.investorAccountType && <> · {user.investorAccountType === "entity" ? c.entity : c.individual}</>}
            {user.investorQualificationCategory && <> · {user.investorQualificationCategory}</>}
          </p>
        </div>

        <InvestorInvestments userId={user.userId} investments={investments} offerings={offerings} />

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[#193143]">{c.mirrorTitle}</h3>
          <p className="mt-1 mb-4 max-w-2xl text-sm leading-6 text-[#697681]">{c.mirrorNote}</p>
          <div className="rounded-xl border border-[#e2e8ec] bg-[#fbfcfd] p-4 sm:p-5">
            <InvestorPortfolio offerings={offerings} viewAsUserId={user.userId} investments={investments} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#18384e]">{c.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#657681]">{c.lead}</p>
        </div>
        <label className="relative block min-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81909a]" />
          <span className="sr-only">{c.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search}
            className="h-10 w-full rounded-md border border-[#d5dde2] bg-white pl-9 pr-3 text-sm" />
        </label>
      </div>

      {stats.length === 0 ? (
        <Panel className="p-12 text-center text-sm text-[#697681]">{c.none}</Panel>
      ) : filtered.length === 0 ? (
        <Panel className="p-12 text-center text-sm text-[#697681]">{c.noMatch}</Panel>
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-[#e8ecee]">
            {filtered.map((stat) => (
              <li key={stat.user.userId}>
                <button type="button" onClick={() => setSelectedId(stat.user.userId)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left hover:bg-[#f7f9fa]">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#1c3546]">{stat.user.displayName}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#6b7982]">{stat.user.email}</span>
                  </span>
                  <span className="flex items-center gap-4 text-right">
                    <span className="hidden sm:block">
                      <span className="block text-sm font-semibold tabular-nums text-[#123f5e]">{stat.totalInvested > 0 ? formatMoneyCompact(stat.totalInvested, lang) : "—"}</span>
                      <span className="block text-[11px] text-[#87929a]">{stat.positions} {c.positions} · {stat.requests} {c.requests}</span>
                    </span>
                    <span className="rounded bg-[#eef2f4] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5f6e78]">
                      {stat.latest ? pick(STATUS_LABELS[stat.latest], lang) : c.noActivity}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[#8b96a0]" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}
