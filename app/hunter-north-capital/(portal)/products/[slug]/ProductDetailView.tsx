"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgePercent, Building2, ExternalLink, FileText, MapPinned, ShieldAlert } from "lucide-react";
import type { FundCommissionSchedule, OfferingBundle, ShareClass, SourcedValue } from "@/lib/capital/types";
import { formatCurrencyCad, formatSourceLine } from "@/lib/capital/present";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { InvestmentRequestButton } from "@/components/capital/north/InvestmentRequestButton";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { Panel } from "@/components/capital/north/PortalUI";
import { usePortalAccess } from "@/components/capital/north/PortalAccessProvider";
import { canUseWorkspace } from "@/lib/capital/portal-access";

type Tab = "overview" | "buildings" | "documents";

const COPY = {
  en: {
    back: "Explore funds", overview: "Overview", buildings: "Buildings", documents: "Documents", managed: "Managed by",
    available: "Available", paused: "Paused", closed: "Closed", coming: "Coming soon", preview: "What the fund owns and where",
    previewHelp: "Verified underlying properties connected to this fund. This does not represent direct ownership by an investor.",
    facts: "Fund-published facts", approach: "Investment approach", history: "Historical information", historical: "Historical—not a forecast",
    start: "Starting amount and account options", terms: "Fees, access and withdrawal conditions", risks: "Material risks and trade-offs",
    sources: "Source and information dates", share: "Share class", minimum: "Minimum investment", accounts: "Available account options",
    unit: "Unit price", targetReturn: "Fund-published target return", targetDistribution: "Fund-published target distribution",
    term: "Fund term", managementFee: "Management fee", valuation: "Valuation frequency", distribution: "Distribution frequency",
    redemption: "Withdrawal and early-exit conditions", drip: "Distribution reinvestment", unavailable: "Unavailable in approved material",
    exact: "Values and conditions are shown as published for the selected share class. Targets are not guaranteed.",
    presentation: "Open presentation", buildingTitle: "Buildings and locations", buildingHelp: "Select a marker or card. Missing facts are shown as unavailable and are not inferred.",
    docsHelp: "Approved fund documents are kept with this fund so their source and version remain clear.",
    type: "Type", effective: "Effective date", version: "Version", source: "Source", open: "Open document", held: "Available through Hunter North",
    lastVerified: "Fund information verified", noHistory: "No approved historical information is available.", noDocs: "No approved documents are available.",
    commissionTitle: "Published fund commission", commissionGross: "Gross commission as posted", commissionAsPosted: "Shown as published for this fund. Apply your current partner-tier percentage separately.",
    commissionLoading: "Loading the published schedule…", commissionUnavailable: "No current published commission schedule is available.",
  },
  tr: {
    back: "Fonları keşfet", overview: "Genel Bakış", buildings: "Binalar", documents: "Belgeler", managed: "Yönetici",
    available: "Mevcut", paused: "Duraklatıldı", closed: "Kapalı", coming: "Yakında", preview: "Fonun sahip olduğu varlıklar ve konumları",
    previewHelp: "Bu fonla bağlantılı doğrulanmış dayanak mülkler. Bu, yatırımcının doğrudan mülk sahipliği anlamına gelmez.",
    facts: "Fon tarafından yayımlanan bilgiler", approach: "Yatırım yaklaşımı", history: "Geçmiş bilgiler", historical: "Geçmiş bilgi—tahmin değildir",
    start: "Başlangıç tutarı ve hesap seçenekleri", terms: "Ücretler, erişim ve para çekme koşulları", risks: "Önemli riskler ve ödünleşimler",
    sources: "Kaynak ve bilgi tarihleri", share: "Pay sınıfı", minimum: "Minimum yatırım", accounts: "Mevcut hesap seçenekleri",
    unit: "Birim fiyatı", targetReturn: "Fonun yayımladığı hedef getiri", targetDistribution: "Fonun yayımladığı hedef dağıtım",
    term: "Fon süresi", managementFee: "Yönetim ücreti", valuation: "Değerleme sıklığı", distribution: "Dağıtım sıklığı",
    redemption: "Para çekme ve erken çıkış koşulları", drip: "Dağıtım yeniden yatırımı", unavailable: "Onaylı materyalde mevcut değil",
    exact: "Değerler ve koşullar seçili pay sınıfı için yayımlandığı şekliyle gösterilir. Hedefler garanti edilmez.",
    presentation: "Sunumu aç", buildingTitle: "Binalar ve konumlar", buildingHelp: "Bir işaretçi veya kart seçin. Eksik bilgiler mevcut değil olarak gösterilir ve tahmin edilmez.",
    docsHelp: "Onaylı fon belgeleri, kaynak ve sürümlerinin açık kalması için bu fonla birlikte tutulur.",
    type: "Tür", effective: "Yürürlük tarihi", version: "Sürüm", source: "Kaynak", open: "Belgeyi aç", held: "Hunter North üzerinden mevcut",
    lastVerified: "Fon bilgisi doğrulama tarihi", noHistory: "Onaylı geçmiş bilgi mevcut değil.", noDocs: "Onaylı belge mevcut değil.",
    commissionTitle: "Yayımlanan fon komisyonu", commissionGross: "Yayımlandığı şekliyle brüt komisyon", commissionAsPosted: "Bu fon için yayımlandığı şekliyle gösterilir. Mevcut partner kademenizin yüzdesini ayrıca uygulayın.",
    commissionLoading: "Yayımlanan program yükleniyor…", commissionUnavailable: "Geçerli yayımlanmış komisyon programı bulunmuyor.",
  },
} as const;

function PublishedFundCommission({ offeringId }: { offeringId: string }) {
  const { lang } = useLang();
  const c = COPY[lang];
  const [schedule, setSchedule] = useState<FundCommissionSchedule>();
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    fetch(`/api/hnc-fund-commission-schedules?offeringId=${encodeURIComponent(offeringId)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { data?: FundCommissionSchedule[] };
        if (!response.ok) throw new Error("Schedule unavailable");
        return result.data?.[0];
      })
      .then((item) => {
        if (!active) return;
        setSchedule(item);
        setStatus(item ? "ready" : "unavailable");
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });
    return () => { active = false; };
  }, [offeringId]);

  return (
    <Panel className="mt-4 overflow-hidden rounded-xl border-[#d8e1e5] bg-[#f8fafb]">
      <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e8f0f3] text-[#0a4b72]">
            <BadgePercent className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#74818a]">{c.commissionTitle}</p>
            <p className="mt-1 text-sm leading-5 text-[#65737d]">{c.commissionAsPosted}</p>
          </div>
        </div>
        {status === "ready" && schedule ? (
          <div className="shrink-0 rounded-lg border border-[#d3dde2] bg-white px-4 py-3 sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#78848d]">{c.commissionGross}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0a4b72]">
              {new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", { maximumFractionDigits: 2 }).format(schedule.grossCommissionBps)} BPS
            </p>
            <p className="mt-1 text-xs text-[#74818a]">{c.effective}: {new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-CA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${schedule.effectiveFrom}T12:00:00Z`))}</p>
          </div>
        ) : (
          <p className="shrink-0 text-sm font-medium text-[#6c7982]">{status === "loading" ? c.commissionLoading : c.commissionUnavailable}</p>
        )}
      </div>
    </Panel>
  );
}

function Provenance({ value, lang }: { value?: SourcedValue; lang: "en" | "tr" }) {
  const line = formatSourceLine(value, lang);
  if (!line || !value) return null;
  return <span className="mt-1 block text-[10px] text-[#7a858d]">{value.sourceId} · {line}</span>;
}

function TermRow({ label, value, provenance }: { label: string; value?: string | null; provenance?: React.ReactNode }) {
  return <div className="border-b border-[#e8ecee] py-3 last:border-0"><dt className="text-xs font-semibold text-[#6d7a83]">{label}</dt><dd className="mt-1 text-sm font-semibold leading-6 text-[#223b4b]">{value || "—"}</dd>{provenance}</div>;
}

function Overview({ offering, share }: { offering: OfferingBundle; share?: ShareClass }) {
  const { lang } = useLang();
  const c = COPY[lang];
  const definedFacts = [...(offering.fundDefinedFacts ?? []), ...(share?.fundDefinedFacts ?? [])].filter(
    (fact) => fact.approval !== "private" && (!fact.shareClassId || fact.shareClassId === share?.id),
  );
  const targetFacts = definedFacts.filter((fact) => fact.category === "target");
  const termFacts = definedFacts.filter((fact) => fact.category !== "target");
  const approvedFacts = [
    ...targetFacts.map((fact) => ({ label: fact.label[lang], value: fact.value[lang], sourceId: fact.sourceId, sourcePage: fact.sourcePage, effectiveDate: fact.effectiveDate })),
    ...(targetFacts.length ? [] : [
      ...(share?.targetReturn ? [{ label: c.targetReturn, value: share.targetReturn.value, sourceId: share.targetReturn.sourceId, sourcePage: share.targetReturn.sourcePage, effectiveDate: share.targetReturn.asOfDate }] : []),
      ...(share?.targetDistribution ? [{ label: c.targetDistribution, value: share.targetDistribution.value, sourceId: share.targetDistribution.sourceId, sourcePage: share.targetDistribution.sourcePage, effectiveDate: share.targetDistribution.asOfDate }] : []),
    ]),
    ...offering.portfolioFacts.map((fact) => ({ label: c.facts, value: String(fact.value), sourceId: fact.sourceId, sourcePage: fact.sourcePage, effectiveDate: fact.asOfDate })),
  ];

  return <div className="space-y-6">
    <section>
      <div className="mb-3"><h2 className="text-lg font-semibold text-[#173246]">{c.preview}</h2><p className="mt-1 text-sm text-[#687681]">{c.previewHelp}</p></div>
      <FundMapEmbed offering={offering} />
    </section>

    <section><h2 className="mb-3 text-lg font-semibold text-[#173246]">{c.facts}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{approvedFacts.map((fact, index) => <Panel key={`${fact.sourceId}-${index}`} className="p-4"><p className="text-xs font-semibold text-[#6d7a83]">{fact.label}</p><p className="mt-2 text-lg font-semibold text-[#173246]">{fact.value}</p><span className="mt-1 block text-[10px] text-[#7a858d]">{fact.sourceId} · {fact.effectiveDate}{fact.sourcePage ? ` · ${lang === "tr" ? "s" : "p"}.${fact.sourcePage}` : ""}</span></Panel>)}</div><p className="mt-3 text-xs text-[#6b7780]">{c.exact}</p></section>

    <section className="grid gap-5 lg:grid-cols-2">
      <Panel className="p-5 sm:p-6"><h2 className="text-lg font-semibold text-[#173246]">{c.approach}</h2><p className="mt-3 text-sm leading-7 text-[#566976]">{offering.thesis[lang]}</p>{offering.highlights?.length ? <ul className="mt-4 space-y-2 text-sm leading-6 text-[#566976]">{offering.highlights.map((highlight) => <li key={highlight[lang]} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#b68b34]" />{highlight[lang]}</li>)}</ul> : null}</Panel>
      <Panel className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-[#173246]">{c.history}</h2><span className="rounded bg-[#f4eddc] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#785b22]">{c.historical}</span></div>{offering.trailingReturns?.length ? <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{offering.trailingReturns.map((item) => <div key={item.period[lang]} className="rounded-md bg-[#f5f7f8] p-3"><p className="text-[11px] text-[#6c7982]">{item.period[lang]}</p><p className="mt-1 text-base font-semibold text-[#193447]">{item.value}</p></div>)}</div> : <p className="mt-4 text-sm text-[#687681]">{c.noHistory}</p>}{offering.trailingReturnsNote && <p className="mt-4 text-xs leading-5 text-[#6f7c85]">{offering.trailingReturnsNote[lang]}</p>}</Panel>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <Panel className="p-5 sm:p-6"><h2 className="text-lg font-semibold text-[#173246]">{c.start}</h2><dl className="mt-3"><TermRow label={c.minimum} value={share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : c.unavailable} provenance={<Provenance value={share?.minimumInvestment} lang={lang} />} /><TermRow label={c.unit} value={share?.unitPrice ? formatCurrencyCad(share.unitPrice.value, lang) : c.unavailable} provenance={<Provenance value={share?.unitPrice} lang={lang} />} /><TermRow label={c.accounts} value={share?.registeredAccountTypes.length ? share.registeredAccountTypes.join(", ") : c.unavailable} /></dl></Panel>
      <Panel className="p-5 sm:p-6"><h2 className="text-lg font-semibold text-[#173246]">{c.terms}</h2><dl className="mt-3">{termFacts.map((fact) => <TermRow key={fact.id} label={fact.label[lang]} value={fact.value[lang]} provenance={<span className="mt-1 block text-[10px] text-[#7a858d]">{fact.sourceId} · {fact.effectiveDate}{fact.sourcePage ? ` · ${lang === "tr" ? "s" : "p"}.${fact.sourcePage}` : ""}</span>} />)}{!termFacts.some((fact) => fact.category === "fee") && <TermRow label={c.managementFee} value={offering.managementFee?.[lang] ?? c.unavailable} />}<TermRow label={c.valuation} value={offering.valuationFrequency?.[lang] ?? c.unavailable} /><TermRow label={c.distribution} value={offering.distributionFrequency?.[lang] ?? c.unavailable} />{!termFacts.some((fact) => fact.category === "term") && <TermRow label={c.term} value={share?.term?.value ?? c.unavailable} provenance={<Provenance value={share?.term} lang={lang} />} />}{!termFacts.some((fact) => fact.category === "early-exit") && <TermRow label={c.redemption} value={share?.redemptionTerms?.[lang] ?? c.unavailable} />}<TermRow label={c.drip} value={share?.drip?.[lang] ?? c.unavailable} /></dl></Panel>
    </section>

    <Panel className="border-[#e5cf9c] bg-[#fffaf0] p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#8c6727]" /><div><h2 className="text-lg font-semibold text-[#493a21]">{c.risks}</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-[#665537]">{offering.risks.map((risk) => <li key={risk[lang]}>• {risk[lang]}</li>)}</ul></div></div></Panel>

    <Panel className="p-5"><h2 className="text-sm font-semibold text-[#173246]">{c.sources}</h2><p className="mt-2 text-xs leading-5 text-[#6d7a83]">{c.lastVerified}: {offering.verifiedAt}. {c.exact}</p></Panel>
  </div>;
}

function Buildings({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang(); const c = COPY[lang];
  return <div><div className="mb-4"><h2 className="text-lg font-semibold text-[#173246]">{c.buildingTitle}</h2><p className="mt-1 text-sm text-[#687681]">{c.buildingHelp}</p></div><FundMapEmbed offering={offering} /></div>;
}

function Documents({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang(); const c = COPY[lang];
  const approvedDocuments = offering.documents.filter((document) => document.visibility !== "private");
  return <div><div className="mb-4"><h2 className="text-lg font-semibold text-[#173246]">{c.documents}</h2><p className="mt-1 text-sm text-[#687681]">{c.docsHelp}</p></div><div className="grid gap-3">{approvedDocuments.map((document) => <Panel key={document.id} className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex min-w-0 gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#edf3f6] text-[#0a4b72]"><FileText className="size-5" /></span><div><h3 className="font-semibold text-[#173246]">{document.title[lang]}</h3><dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6c7982]"><div><dt className="inline font-semibold">{c.type}: </dt><dd className="inline">{document.type}</dd></div><div><dt className="inline font-semibold">{c.effective}: </dt><dd className="inline">{document.effectiveDate}</dd></div><div><dt className="inline font-semibold">{c.version}: </dt><dd className="inline">{document.version}</dd></div><div><dt className="inline font-semibold">{c.source}: </dt><dd className="inline">{document.sourceId ?? c.unavailable}</dd></div></dl></div></div>{document.href ? <a href={document.href} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#0a4b72] hover:underline">{c.open}<ExternalLink className="size-4" /></a> : <span className="text-xs font-semibold text-[#6b7881]">{c.held}</span>}</div></Panel>)}{!approvedDocuments.length && <Panel className="p-10 text-center text-sm text-[#687681]">{c.noDocs}</Panel>}</div></div>;
}

export function ProductDetailView({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const { context } = usePortalAccess();
  const c = COPY[lang];
  const [tab, setTab] = useState<Tab>("overview");
  const [shareClassId, setShareClassId] = useState(offering.shareClasses[0]?.id ?? "");
  const share = offering.shareClasses.find((item) => item.id === shareClassId) ?? offering.shareClasses[0];
  const professional = canUseWorkspace(context, "professional");
  const status = offering.status === "available" ? c.available : offering.status === "coming-soon" ? c.coming : offering.status === "paused" ? c.paused : c.closed;

  return <div>
    <Link href={`${NORTH_BASE}/funds`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4b72] hover:underline"><ArrowLeft className="size-3.5" />{c.back}</Link>
    <header className="overflow-hidden rounded-xl bg-[#0b2d43] text-white">
      <div className="relative p-6 sm:p-8"><div className="absolute inset-0 opacity-25" style={{ backgroundImage: offering.media?.banner?.src ? `url(${offering.media.banner.src})` : undefined, backgroundPosition: "center", backgroundSize: "cover" }} /><div className="absolute inset-0 bg-gradient-to-r from-[#081f30] via-[#0b2d43]/90 to-[#0b2d43]/55" /><div className="relative max-w-3xl"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold"><span className="rounded-full bg-white/12 px-3 py-1">{status}</span><span className="text-white/70">{c.managed} {offering.manager.name[lang]}</span></div><h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{offering.name[lang]}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">{offering.summary[lang]}</p><div className="mt-6 flex flex-wrap items-center gap-3">{professional ? <Link href={`${NORTH_BASE}/funds/${offering.slug}/present`} className="inline-flex h-10 items-center rounded-md bg-white px-4 text-sm font-semibold text-[#0a2d46]">{c.presentation}</Link> : <InvestmentRequestButton offerings={[offering]} initialOfferingId={offering.id} light />}{offering.shareClasses.length > 1 && <label className="flex items-center gap-2 text-xs font-semibold text-white/80">{c.share}<select value={shareClassId} onChange={(event) => setShareClassId(event.target.value)} className="h-10 rounded-md border border-white/25 bg-[#123e58] px-3 text-sm text-white">{offering.shareClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}</div></div></div>
    </header>

    {professional && <PublishedFundCommission offeringId={offering.id} />}

    <nav aria-label={offering.shortName[lang]} className="sticky top-0 z-20 mt-4 flex gap-1 rounded-lg border border-[#dfe5e8] bg-white p-1 shadow-sm">{([{ id: "overview", label: c.overview, icon: MapPinned }, { id: "buildings", label: c.buildings, icon: Building2 }, { id: "documents", label: c.documents, icon: FileText }] as const).map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold ${tab === id ? "bg-[#0a2d46] text-white" : "text-[#5d6c76] hover:bg-[#f0f4f6]"}`}><Icon className="size-4" />{label}</button>)}</nav>
    <main className="mt-6">{tab === "overview" ? <Overview offering={offering} share={share} /> : tab === "buildings" ? <Buildings offering={offering} /> : <Documents offering={offering} />}</main>
  </div>;
}
