"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Filter, Plus, Search } from "lucide-react";
import type { OfferingBundle, ReferralStatus } from "@/lib/capital/types";
import { REFERRAL_STATUS_ORDER } from "@/lib/capital/partner-data";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useClients } from "@/components/capital/north/ClientProvider";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel, money, shortDate } from "@/components/capital/north/PortalUI";
import { StageIndicator } from "@/components/capital/north/StageIndicator";

const COPY = {
  tr: {
    eyebrow: "Partner iş akışı", title: "Müşteriler", desc: "Her müşterinin ilerlemesini, yatırım ilgilerini ve istenen belgelerini tek profilden yönetin.", add: "Yeni müşteri",
    search: "Ad, kurum veya e-posta ara", allStatuses: "Tüm durumlar", allFunds: "Tüm fonlar", client: "Müşteri", fund: "Birincil fon", amount: "Gösterge tutarı", stage: "Aşama", next: "Sonraki adım", updated: "Son güncelleme", empty: "Bu filtrelerle eşleşen müşteri yok.",
    statuses: { introduced: "Tanıştırıldı", contacted: "İletişime geçildi", "compliance-review": "Uyum incelemesi", accepted: "Kabul edildi", funded: "Fonlandı" } as Record<ReferralStatus, string>,
  },
  en: {
    eyebrow: "Partner workflow", title: "Clients", desc: "Manage each client’s progress, investment interests, and requested documents from one profile.", add: "New client",
    search: "Search name, organization, or email", allStatuses: "All statuses", allFunds: "All funds", client: "Client", fund: "Primary fund", amount: "Illustrative amount", stage: "Stage", next: "Next action", updated: "Last update", empty: "No clients match these filters.",
    statuses: { introduced: "Introduced", contacted: "Contacted", "compliance-review": "Compliance review", accepted: "Accepted", funded: "Funded" } as Record<ReferralStatus, string>,
  },
} as const;

function badge(status: ReferralStatus) {
  if (status === "funded" || status === "accepted") return "bg-[#e8f2ec] text-[#2d6849]";
  if (status === "compliance-review") return "bg-[#f7efd9] text-[#7b5c19]";
  return "bg-[#eaf0f5] text-[#3c5d75]";
}

export function ClientDirectory({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { clients } = useClients();
  const router = useRouter();
  const c = COPY[lang];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReferralStatus | "all">("all");
  const [fund, setFund] = useState("all");

  const rows = useMemo(() => clients.filter((client) => {
    const primary = client.fundInterests.find((item) => item.primary) ?? client.fundInterests[0];
    const offering = offerings.find((item) => item.id === primary?.offeringId);
    const text = `${client.displayName} ${client.organization ?? ""} ${client.email} ${offering?.shortName[lang] ?? ""}`.toLocaleLowerCase(lang === "tr" ? "tr" : "en");
    const needle = query.trim().toLocaleLowerCase(lang === "tr" ? "tr" : "en");
    return (!needle || text.includes(needle)) && (status === "all" || client.status === status) && (fund === "all" || client.fundInterests.some((item) => item.offeringId === fund));
  }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [clients, fund, lang, offerings, query, status]);

  return <div>
    <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.desc} action={<Link href={`${NORTH_BASE}/clients/new`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]"><Plus className="size-4" />{c.add}</Link>} />

    <div className="mb-4 grid gap-3 rounded-md border border-[#dfe4e9] bg-white p-3 md:grid-cols-[minmax(0,1fr)_210px_220px]">
      <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b858e]" /><span className="sr-only">{c.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search} className="h-10 w-full rounded-md border border-[#d6dde2] pl-9 pr-3 text-sm outline-none focus:border-[#0a4b72]" /></label>
      <label className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b858e]" /><span className="sr-only">{c.allStatuses}</span><select value={status} onChange={(event) => setStatus(event.target.value as ReferralStatus | "all")} className="h-10 w-full appearance-none rounded-md border border-[#d6dde2] bg-white pl-9 pr-3 text-sm"><option value="all">{c.allStatuses}</option>{REFERRAL_STATUS_ORDER.map((item) => <option key={item} value={item}>{c.statuses[item]}</option>)}</select></label>
      <label><span className="sr-only">{c.allFunds}</span><select value={fund} onChange={(event) => setFund(event.target.value)} className="h-10 w-full rounded-md border border-[#d6dde2] bg-white px-3 text-sm"><option value="all">{c.allFunds}</option>{offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.shortName[lang]}</option>)}</select></label>
    </div>
    {rows.length ? <>
      <Panel className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]"><tr>{[c.client,c.fund,c.amount,c.stage,c.next,c.updated,""].map((item,index) => <th key={`${item}-${index}`} className="border-b border-[#e2e6e9] px-5 py-3">{item}</th>)}</tr></thead><tbody>{rows.map((client) => {
          const primary = client.fundInterests.find((item) => item.primary) ?? client.fundInterests[0];
          const offering = offerings.find((item) => item.id === primary?.offeringId);
          const href = `${NORTH_BASE}/clients/${client.id}`;
          return <tr key={client.id} onClick={() => router.push(href)} className="cursor-pointer border-b border-[#edf0f2] last:border-0 hover:bg-[#fafbfc]"><td className="px-5 py-4"><Link href={href} onClick={(event) => event.stopPropagation()} className="font-semibold text-[#233743] hover:text-[#0a4b72]">{client.displayName}</Link><p className="mt-1 text-[10px] text-[#7b858e]">{client.organization ?? client.email}</p></td><td className="px-5 py-4 text-[#65727c]">{offering?.shortName[lang] ?? "—"}</td><td className="px-5 py-4 tabular-nums text-[#3c4e5b]">{primary ? money(primary.amount, lang) : "—"}</td><td className="px-5 py-4"><StageIndicator status={client.status} label={<span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(client.status)}`}>{c.statuses[client.status]}</span>} labels={c.statuses} /></td><td className="max-w-64 px-5 py-4 text-xs text-[#65727c]">{client.nextAction[lang]}</td><td className="px-5 py-4 text-xs text-[#76818a]">{shortDate(client.updatedAt.slice(0,10),lang)}</td><td className="px-5 py-4 text-right text-[#0a4b72]"><ArrowRight className="ml-auto size-4" /></td></tr>;
        })}</tbody></table></div>
      </Panel>
      <div className="grid gap-3 md:hidden">{rows.map((client) => {
        const primary = client.fundInterests.find((item) => item.primary) ?? client.fundInterests[0];
        const offering = offerings.find((item) => item.id === primary?.offeringId);
        return <Link key={client.id} href={`${NORTH_BASE}/clients/${client.id}`} className="rounded-md border border-[#dfe4e9] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#233743]">{client.displayName}</p><p className="mt-1 text-xs text-[#75808a]">{client.organization ?? client.email}</p></div></div><StageIndicator className="mt-3" status={client.status} label={<span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(client.status)}`}>{c.statuses[client.status]}</span>} labels={c.statuses} /><dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#edf0f2] pt-3 text-xs"><div><dt className="text-[#84909a]">{c.fund}</dt><dd className="mt-1 font-semibold text-[#40515e]">{offering?.shortName[lang] ?? "—"}</dd></div><div><dt className="text-[#84909a]">{c.amount}</dt><dd className="mt-1 font-semibold text-[#40515e]">{primary ? money(primary.amount, lang) : "—"}</dd></div></dl><p className="mt-3 flex items-center justify-between text-xs text-[#65727c]"><span>{client.nextAction[lang]}</span><ArrowRight className="size-4 shrink-0 text-[#0a4b72]" /></p></Link>;
      })}</div>
    </> : <Panel className="p-12 text-center text-sm text-[#74808a]">{c.empty}</Panel>}
  </div>;
}
