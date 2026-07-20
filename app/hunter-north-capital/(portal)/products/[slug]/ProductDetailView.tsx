"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgePercent, Building2, FileText, Landmark, type LucideIcon, MapPinned, TrendingUp, Wallet } from "lucide-react";
import type { FundCommissionSchedule, OfferingBundle, ShareClass } from "@/lib/capital/types";
import { formatCurrencyCad, formatMoneyCompact } from "@/lib/capital/present";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { InvestmentRequestButton } from "@/components/capital/north/InvestmentRequestButton";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { Panel } from "@/components/capital/north/PortalUI";
import { usePortalAccess } from "@/components/capital/north/PortalAccessProvider";
import { canUseWorkspace } from "@/lib/capital/portal-access";
import {
  Highlights,
  type KeyFact,
  KeyFactsCard,
  PresentationCard,
  StatCard,
  TrustStrip,
} from "@/components/capital/offering-ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Tab = "overview" | "buildings" | "documents";

const COPY = {
  en: {
    back: "Back to Discover", overview: "Overview", buildings: "Buildings", documents: "Documents", managed: "Managed by",
    available: "Available", paused: "Paused", closed: "Closed", coming: "Coming soon",
    realEstate: "The real estate", realEstateHelp: "Verified underlying properties connected to this offering — not direct ownership by an investor.",
    summaryReturns: "Projected returns", offeringSize: "Offering size", aum: "Assets under management",
    keyFacts: "Key facts", riskProfile: "Risk profile", minimum: "Minimum investment", projectedReturn: "Projected return",
    unitPrice: "Unit price", term: "Investment term", distribution: "Distribution", registered: "Registered accounts",
    redemption: "Redemptions", managementFee: "Management fee",
    highlights: "Highlights", cities: "Cities", buildingsCount: "Buildings", locations: "Locations",
    approach: "Investment approach", presentation: "Presentation", presentationOpen: "Open presentation",
    presentationVersion: "Version", presentationUnavailable: "Available through Hunter Advisory",
    risks: "Material risks and trade-offs",
    historical: "Full historical information", noHistory: "No approved historical information is available.", historicalTag: "Historical—not a forecast",
    sources: "Sources and information dates", sourcesBody: "Fund information verified",
    exact: "Values and conditions are shown as published for the selected share class. Targets are not guaranteed.",
    trust: "Independently verified", auditor: "Auditor", legalCounsel: "Legal counsel", appraiser: "Appraiser", verified: "Verified",
    share: "Share class",
    buildingHelp: "Select a marker or card. Missing facts are shown as unavailable and are not inferred.",
    docsHelp: "Approved documents are kept with this offering so their source and version remain clear.",
    type: "Type", effective: "Effective date", version: "Version", source: "Source", open: "Open document", held: "Available through Hunter Advisory",
    noDocs: "No approved documents are available.",
    commissionTitle: "Published fund commission", commissionGross: "Gross commission as posted", commissionAsPosted: "Shown as published for this fund. Apply your current partner-tier percentage separately.",
    commissionLoading: "Loading the published schedule…", commissionUnavailable: "No current published commission schedule is available.",
  },
  tr: {
    back: "Keşfet'e dön", overview: "Genel Bakış", buildings: "Binalar", documents: "Belgeler", managed: "Yönetici",
    available: "Mevcut", paused: "Duraklatıldı", closed: "Kapalı", coming: "Yakında",
    realEstate: "Gayrimenkul", realEstateHelp: "Bu seçenekle bağlantılı doğrulanmış dayanak mülkler — yatırımcının doğrudan mülk sahipliği anlamına gelmez.",
    summaryReturns: "Öngörülen getiri", offeringSize: "Teklif büyüklüğü", aum: "Yönetilen varlıklar",
    keyFacts: "Temel bilgiler", riskProfile: "Risk profili", minimum: "Minimum yatırım", projectedReturn: "Öngörülen getiri",
    unitPrice: "Birim fiyatı", term: "Yatırım süresi", distribution: "Dağıtım", registered: "Kayıtlı hesaplar",
    redemption: "Para çekme", managementFee: "Yönetim ücreti",
    highlights: "Öne çıkanlar", cities: "Şehir", buildingsCount: "Bina", locations: "Konum",
    approach: "Yatırım yaklaşımı", presentation: "Sunum", presentationOpen: "Sunumu aç",
    presentationVersion: "Sürüm", presentationUnavailable: "Hunter Advisory üzerinden mevcut",
    risks: "Önemli riskler ve ödünleşimler",
    historical: "Ayrıntılı geçmiş bilgiler", noHistory: "Onaylı geçmiş bilgi mevcut değil.", historicalTag: "Geçmiş bilgi—tahmin değildir",
    sources: "Kaynak ve bilgi tarihleri", sourcesBody: "Fon bilgisi doğrulama tarihi",
    exact: "Değerler ve koşullar seçili pay sınıfı için yayımlandığı şekliyle gösterilir. Hedefler garanti edilmez.",
    trust: "Bağımsız olarak doğrulandı", auditor: "Denetçi", legalCounsel: "Hukuk müşaviri", appraiser: "Değerleme uzmanı", verified: "Doğrulama tarihi",
    share: "Pay sınıfı",
    buildingHelp: "Bir işaretçi veya kart seçin. Eksik bilgiler mevcut değil olarak gösterilir ve tahmin edilmez.",
    docsHelp: "Onaylı belgeler, kaynak ve sürümlerinin açık kalması için bu seçenekle birlikte tutulur.",
    type: "Tür", effective: "Yürürlük tarihi", version: "Sürüm", source: "Kaynak", open: "Belgeyi aç", held: "Hunter Advisory üzerinden mevcut",
    noDocs: "Onaylı belge mevcut değil.",
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
    <Panel className="mt-4 overflow-hidden rounded-xl border-border bg-secondary/40">
      <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
            <BadgePercent className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{c.commissionTitle}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{c.commissionAsPosted}</p>
          </div>
        </div>
        {status === "ready" && schedule ? (
          <div className="shrink-0 rounded-lg border border-border bg-card px-4 py-3 sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{c.commissionGross}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
              {new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", { maximumFractionDigits: 2 }).format(schedule.grossCommissionBps)} BPS
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{c.effective}: {new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-CA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${schedule.effectiveFrom}T12:00:00Z`))}</p>
          </div>
        ) : (
          <p className="shrink-0 text-sm font-medium text-muted-foreground">{status === "loading" ? c.commissionLoading : c.commissionUnavailable}</p>
        )}
      </div>
    </Panel>
  );
}

function SectionTitle({ title, help }: { title: string; help?: string }) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-foreground">
        <span className="h-4 w-[3px] shrink-0 rounded-full bg-gold" aria-hidden />
        {title}
      </h2>
      {help && <p className="mt-1.5 pl-[15px] text-sm text-muted-foreground">{help}</p>}
    </div>
  );
}

function Overview({ offering, share }: { offering: OfferingBundle; share?: ShareClass }) {
  const { lang } = useLang();
  const c = COPY[lang];

  // Fund-published facts are shown VERBATIM (never reformatted) for compliance.
  const definedFacts = [...(offering.fundDefinedFacts ?? []), ...(share?.fundDefinedFacts ?? [])].filter(
    (fact) => fact.approval !== "private" && (!fact.shareClassId || fact.shareClassId === share?.id),
  );
  const targetFacts = definedFacts.filter((fact) => fact.category === "target");
  const termFacts = definedFacts.filter((fact) => fact.category !== "target");
  const hasCategory = (category: string) => termFacts.some((fact) => fact.category === category);

  // Summary stat cards (3-up) — the clean headline row, values shown as published.
  const returnFact = targetFacts[0];
  const summaryCards = [
    returnFact ? { value: returnFact.value[lang], label: c.summaryReturns, icon: TrendingUp }
      : share?.targetReturn ? { value: share.targetReturn.value, label: c.summaryReturns, icon: TrendingUp } : null,
    offering.offeringSize ? { value: formatMoneyCompact(Number(offering.offeringSize.value), lang), label: c.offeringSize, icon: Wallet } : null,
    offering.aum ? { value: String(offering.aum.value), label: c.aum, icon: Landmark } : null,
  ].filter(Boolean) as { value: string; label: string; icon: LucideIcon }[];

  // Key facts (Parvis-style). Redemptions stay visible on the main page.
  const facts: KeyFact[] = [];
  const add = (label: string, value?: string | null, provenance?: KeyFact["provenance"]) => {
    if (value) facts.push({ label, value, provenance });
  };
  add(c.riskProfile, offering.riskProfile?.[lang]);
  add(c.minimum, share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : null, share?.minimumInvestment);
  // Fund-published target facts (return, distribution) shown verbatim; else share fallbacks.
  if (targetFacts.length) {
    targetFacts.forEach((fact) => facts.push({ label: fact.label[lang], value: fact.value[lang] }));
  } else {
    add(c.projectedReturn, share?.targetReturn?.value, share?.targetReturn);
    add(c.distribution, share?.targetDistribution?.value ?? share?.distributionPerUnit?.value ?? offering.distributionFrequency?.[lang], share?.targetDistribution ?? share?.distributionPerUnit);
  }
  add(c.unitPrice, share?.unitPrice ? formatCurrencyCad(share.unitPrice.value, lang) : null, share?.unitPrice);
  add(c.registered, share?.registeredAccountTypes.length ? share.registeredAccountTypes.join(", ") : null);
  // Fund-published term/fee/early-exit facts shown verbatim; else fallbacks.
  termFacts.forEach((fact) => facts.push({ label: fact.label[lang], value: fact.value[lang] }));
  if (!hasCategory("term")) add(c.term, share?.term?.value, share?.term);
  if (!hasCategory("fee")) add(c.managementFee, offering.managementFee?.[lang]);
  if (!hasCategory("early-exit")) add(c.redemption, share?.redemptionTerms?.[lang]);

  const funFacts = (offering.highlights ?? []).map((highlight) => highlight[lang]);
  const trailingReturns = (offering.trailingReturns ?? []).map((item) => ({ period: item.period[lang], value: item.value }));
  const trailingReturnsNote = offering.trailingReturnsNote?.[lang];
  const presentation = offering.documents.find((doc) => doc.type === "presentation" && doc.visibility !== "private");

  return (
    <div className="space-y-8">
      {summaryCards.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => <StatCard key={card.label} value={card.value} label={card.label} icon={card.icon} />)}
        </section>
      )}

      <section>
        <SectionTitle title={c.keyFacts} />
        <KeyFactsCard facts={facts} lang={lang} />
      </section>

      <section>
        <SectionTitle title={c.highlights} />
        <Highlights
          properties={offering.properties}
          funFacts={funFacts}
          copy={{ cities: c.cities, buildings: c.buildingsCount, locations: c.locations }}
        />
      </section>

      <section>
        <SectionTitle title={c.approach} />
        <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
          <p className="text-sm leading-7 text-muted-foreground">{offering.thesis[lang]}</p>
        </div>
      </section>

      {presentation && (
        <section>
          <SectionTitle title={c.presentation} />
          <PresentationCard
            document={presentation}
            coverSrc={offering.media?.banner?.src}
            lang={lang}
            copy={{ title: c.presentation, open: c.presentationOpen, unavailable: c.presentationUnavailable, version: c.presentationVersion }}
          />
        </section>
      )}

      <Accordion type="multiple" className="rounded-xl border border-border bg-card px-5">
        <AccordionItem value="historical" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">{c.historical}
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{c.historicalTag}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {trailingReturns.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {trailingReturns.map((item) => (
                  <div key={item.period} className="rounded-md bg-secondary/60 p-3">
                    <p className="text-[11px] text-muted-foreground">{item.period}</p>
                    <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">{c.noHistory}</p>}
            {trailingReturnsNote && <p className="mt-3 text-xs leading-5 text-muted-foreground">{trailingReturnsNote}</p>}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sources" className="border-0">
          <AccordionTrigger className="text-sm font-semibold text-foreground">{c.sources}</AccordionTrigger>
          <AccordionContent>
            <p className="text-xs leading-5 text-muted-foreground">{c.sourcesBody}: {offering.verifiedAt}.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <TrustStrip
        providers={offering.serviceProviders}
        verifiedAt={offering.verifiedAt}
        copy={{ heading: c.trust, auditor: c.auditor, legalCounsel: c.legalCounsel, appraiser: c.appraiser, verified: c.verified }}
      />
    </div>
  );
}

function Buildings({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang(); const c = COPY[lang];
  return (
    <div className="space-y-4">
      <SectionTitle title={c.buildings} help={c.buildingHelp} />
      <FundMapEmbed offering={offering} />
    </div>
  );
}

function Documents({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang(); const c = COPY[lang];
  const approvedDocuments = offering.documents.filter((document) => document.visibility !== "private");
  return (
    <div>
      <SectionTitle title={c.documents} help={c.docsHelp} />
      <div className="grid gap-3">
        {approvedDocuments.map((document) => (
          <Panel key={document.id} className="rounded-xl p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><FileText className="size-5" /></span>
                <div>
                  <h3 className="font-semibold text-foreground">{document.title[lang]}</h3>
                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <div><dt className="inline font-semibold">{c.type}: </dt><dd className="inline">{document.type}</dd></div>
                    <div><dt className="inline font-semibold">{c.effective}: </dt><dd className="inline">{document.effectiveDate}</dd></div>
                    <div><dt className="inline font-semibold">{c.version}: </dt><dd className="inline">{document.version}</dd></div>
                  </dl>
                </div>
              </div>
              {document.href ? (
                <a href={document.href} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">{c.open}</a>
              ) : <span className="text-xs font-semibold text-muted-foreground">{c.held}</span>}
            </div>
          </Panel>
        ))}
        {!approvedDocuments.length && <Panel className="rounded-xl p-10 text-center text-sm text-muted-foreground">{c.noDocs}</Panel>}
      </div>
    </div>
  );
}

export function ProductDetailView({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const { context, accountView } = usePortalAccess();
  const c = COPY[lang];
  const [tab, setTab] = useState<Tab>("overview");
  const [shareClassId, setShareClassId] = useState(offering.shareClasses[0]?.id ?? "");
  const share = offering.shareClasses.find((item) => item.id === shareClassId) ?? offering.shareClasses[0];
  const investor = canUseWorkspace(context, "investor");
  const professional = accountView === "professional" && canUseWorkspace(context, "professional");
  const strategyLabel = offering.strategyIds[0] ? taxonomyLabel(strategies, offering.strategyIds[0], lang) : undefined;

  return (
    <div>
      <Link href={`${NORTH_BASE}/funds`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="size-3.5" />{c.back}</Link>
      <header className="overflow-hidden rounded-xl bg-primary text-primary-foreground">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: offering.media?.banner?.src ? `url(${offering.media.banner.src})` : undefined, backgroundPosition: "center", backgroundSize: "cover" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 96%, black) 0%, color-mix(in srgb, var(--primary) 88%, transparent) 55%, color-mix(in srgb, var(--primary) 55%, transparent) 100%)" }} />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              {strategyLabel && <span className="rounded-full bg-white/12 px-3 py-1 text-white/90">{strategyLabel}</span>}
              <span className="uppercase tracking-[0.14em] text-[color:var(--gold)]">{offering.manager.name[lang]}</span>
            </div>
            <h1 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl">{offering.name[lang]}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{offering.summary[lang]}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {investor && <InvestmentRequestButton offerings={[offering]} initialOfferingId={offering.id} light />}
              {offering.shareClasses.length > 1 && (
                <label className="flex items-center gap-2 text-xs font-semibold text-white/80">{c.share}
                  <select value={shareClassId} onChange={(event) => setShareClassId(event.target.value)} className="h-10 rounded-md border border-white/25 bg-white/10 px-3 text-sm text-white">
                    {offering.shareClasses.map((item) => <option key={item.id} value={item.id} className="text-foreground">{item.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          </div>
        </div>
      </header>

      {professional && <PublishedFundCommission offeringId={offering.id} />}

      <nav aria-label={offering.shortName[lang]} className="sticky top-0 z-20 mt-4 flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
        {([{ id: "overview", label: c.overview, icon: MapPinned }, { id: "buildings", label: c.buildings, icon: Building2 }, { id: "documents", label: c.documents, icon: FileText }] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Icon className="size-4" />{label}</button>
        ))}
      </nav>
      <main className="mt-6">{tab === "overview" ? <Overview offering={offering} share={share} /> : tab === "buildings" ? <Buildings offering={offering} /> : <Documents offering={offering} />}</main>
    </div>
  );
}
