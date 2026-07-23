"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/capital/types";
import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink, FileText, MapPinned, TrendingUp } from "lucide-react";
import type { FundCommissionSchedule, OfferingBundle, ShareClass, TrailingReturn } from "@/lib/capital/types";
import { formatCurrencyCad, formatDate, formatMoneyCompact } from "@/lib/capital/present";
import { taxonomyLabel } from "@/lib/capital/taxonomies";
import { useTaxonomies } from "@/components/capital/north/TaxonomyProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { InvestmentRequestButton } from "@/components/capital/north/InvestmentRequestButton";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { Panel } from "@/components/capital/north/PortalUI";
import { usePortalAccess } from "@/components/capital/north/PortalAccessProvider";
import { OfferingVisual } from "../ProductsExplorer";
import { canUseWorkspace } from "@/lib/capital/portal-access";
import {
  type KeyFact,
  KeyFactsCard,
  PresentationCard,
  TrustStrip,
} from "@/components/capital/offering-ui";

type Tab = "overview" | "performance" | "buildings" | "documents";

const COPY = {
  en: {
    back: "Back to Discover", overview: "Overview", performance: "Performance", buildings: "Buildings", documents: "Documents", managed: "Managed by",
    available: "Available", paused: "Paused", closed: "Closed", coming: "Coming soon",
    realEstate: "The real estate", realEstateHelp: "Verified underlying properties connected to this offering — not direct ownership by an investor.",
    summaryReturns: "Projected returns", offeringSize: "Offering size", aum: "Assets under management",
    keyFacts: "Key facts", inception: "Inception date", riskProfile: "Risk profile", minimum: "Minimum investment", projectedReturn: "Projected return",
    unitPrice: "Unit price", term: "Investment term", distribution: "Distribution", registered: "Registered accounts",
    redemption: "Redemptions", managementFee: "Management fee", commission: "Published commission",
    highlights: "Highlights", cities: "Cities", buildingsCount: "Buildings", locations: "Locations",
    presentation: "Presentation", presentationOpen: "Open presentation",
    presentationVersion: "Version", presentationUnavailable: "Available through Hunter & Hunter Investment Advisors",
    risks: "Material risks and trade-offs",
    historical: "Historical performance", historicalHelp: "Published returns for this investment, shown exactly as provided.", noHistory: "No approved historical information is available.", historicalTag: "Historical—not a forecast",
    period: "Period", returnValue: "Return",
    exact: "Values and conditions are shown as published for the selected share class. Targets are not guaranteed.",
    aboutManager: "About the company", headquarters: "Headquarters", fundStructure: "Structure", companyWebsite: "Company website",
    trust: "Independently verified", auditor: "Auditor", legalCounsel: "Legal counsel", appraiser: "Appraiser", verified: "Verified",
    share: "Share class",
    buildingHelp: "The real, rentable buildings this investment owns — on the map and below. Select a marker or card to view information; missing facts are shown as unavailable and are not inferred.",
    docsHelp: "Approved documents are kept with this offering so their source and version remain clear.",
    type: "Type", effective: "Effective date", version: "Version", source: "Source", open: "Open document", held: "Available through Hunter & Hunter Investment Advisors",
    noDocs: "No approved documents are available.",
  },
  tr: {
    back: "Keşfet'e dön", overview: "Genel Bakış", performance: "Performans", buildings: "Binalar", documents: "Belgeler", managed: "Yönetici",
    available: "Mevcut", paused: "Duraklatıldı", closed: "Kapalı", coming: "Yakında",
    realEstate: "Gayrimenkul", realEstateHelp: "Bu seçenekle bağlantılı doğrulanmış dayanak mülkler — yatırımcının doğrudan mülk sahipliği anlamına gelmez.",
    summaryReturns: "Öngörülen getiri", offeringSize: "Teklif büyüklüğü", aum: "Yönetilen varlıklar",
    keyFacts: "Temel bilgiler", inception: "Yatırım aracı başlangıç tarihi", riskProfile: "Risk profili", minimum: "Minimum yatırım", projectedReturn: "Öngörülen getiri",
    unitPrice: "Birim fiyatı", term: "Yatırım süresi", distribution: "Dağıtım", registered: "Kayıtlı hesaplar",
    redemption: "Para çekme", managementFee: "Yönetim ücreti", commission: "Yayımlanan komisyon",
    highlights: "Öne çıkanlar", cities: "Şehir", buildingsCount: "Bina", locations: "Konum",
    presentation: "Sunum", presentationOpen: "Sunumu aç",
    presentationVersion: "Sürüm", presentationUnavailable: "Hunter & Hunter Investment Advisors üzerinden mevcut",
    risks: "Önemli riskler ve ödünleşimler",
    historical: "Geçmiş performans", historicalHelp: "Bu yatırım için yayımlanan getiriler, sağlandığı şekliyle gösterilir.", noHistory: "Onaylı geçmiş bilgi mevcut değil.", historicalTag: "Geçmiş bilgi—tahmin değildir",
    period: "Dönem", returnValue: "Getiri",
    exact: "Değerler ve koşullar seçili pay sınıfı için yayımlandığı şekliyle gösterilir. Hedefler garanti edilmez.",
    aboutManager: "Şirket hakkında", headquarters: "Merkez", fundStructure: "Yapı", companyWebsite: "Şirket web sitesi",
    trust: "Bağımsız olarak doğrulandı", auditor: "Denetçi", legalCounsel: "Hukuk müşaviri", appraiser: "Değerleme uzmanı", verified: "Doğrulama tarihi",
    share: "Pay sınıfı",
    buildingHelp: "Bu yatırımın sahip olduğu gerçek, kiralık binalar — haritada ve aşağıda. Bilgileri görmek için bir işaretçi veya kart seçin; eksik bilgiler mevcut değil olarak gösterilir ve tahmin edilmez.",
    docsHelp: "Onaylı belgeler, kaynak ve sürümlerinin açık kalması için bu seçenekle birlikte tutulur.",
    type: "Tür", effective: "Yürürlük tarihi", version: "Sürüm", source: "Kaynak", open: "Belgeyi aç", held: "Hunter & Hunter Investment Advisors üzerinden mevcut",
    noDocs: "Onaylı belge mevcut değil.",
  },
} as const;

function usePublishedFundCommissionValue(offeringId: string, enabled: boolean, lang: Lang) {
  const [commission, setCommission] = useState("");
  useEffect(() => {
    if (!enabled) {
      setCommission("");
      return;
    }

    let active = true;
    setCommission("");
    fetch(`/api/hnc-fund-commission-schedules?offeringId=${encodeURIComponent(offeringId)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { data?: FundCommissionSchedule[] };
        if (!response.ok) throw new Error("Schedule unavailable");
        return result.data?.[0];
      })
      .then((item) => {
        if (!active) return;
        setCommission(item ? `${new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", { maximumFractionDigits: 2 }).format(item.grossCommissionBps)} BPS` : "");
      })
      .catch(() => {
        if (active) setCommission("");
      });
    return () => { active = false; };
  }, [enabled, lang, offeringId]);

  return commission;
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

function Overview({ offering, share, professional }: { offering: OfferingBundle; share?: ShareClass; professional: boolean }) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const commission = usePublishedFundCommissionValue(offering.id, professional, lang);
  const companyLogo = offering.media?.logo;

  // Fund-published facts are shown VERBATIM (never reformatted) for compliance.
  const definedFacts = [...(offering.fundDefinedFacts ?? []), ...(share?.fundDefinedFacts ?? [])].filter(
    (fact) => fact.approval !== "private" && (!fact.shareClassId || fact.shareClassId === share?.id),
  );
  const targetFacts = definedFacts.filter((fact) => fact.category === "target");
  const termFacts = definedFacts.filter((fact) => fact.category !== "target");
  const hasCategory = (category: string) => termFacts.some((fact) => fact.category === category);

  // Key facts keep the former headline metrics visible without a separate card row.
  const facts: KeyFact[] = [];
  const add = (label: string, value?: string | null, provenance?: KeyFact["provenance"]) => {
    if (value) facts.push({ label, value, provenance });
  };
  add(c.aum, offering.aum ? String(offering.aum.value) : null, offering.aum);
  add(c.inception, offering.inceptionDate ? formatDate(offering.inceptionDate, lang) : null);
  add(c.offeringSize, offering.offeringSize ? formatMoneyCompact(Number(offering.offeringSize.value), lang) : null, offering.offeringSize);
  add(c.riskProfile, tx(offering.riskProfile, lang));
  add(c.minimum, share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : null, share?.minimumInvestment);
  // Fund-published target facts (return, distribution) shown verbatim; else share fallbacks.
  if (targetFacts.length) {
    targetFacts.forEach((fact) => facts.push({ label: tx(fact.label, lang), value: tx(fact.value, lang) }));
  } else {
    add(c.projectedReturn, share?.targetReturn?.value, share?.targetReturn);
    add(c.distribution, share?.targetDistribution?.value ?? share?.distributionPerUnit?.value ?? tx(offering.distributionFrequency, lang), share?.targetDistribution ?? share?.distributionPerUnit);
  }
  add(c.unitPrice, share?.unitPrice ? formatCurrencyCad(share.unitPrice.value, lang) : null, share?.unitPrice);
  add(c.registered, share?.registeredAccountTypes.length ? share.registeredAccountTypes.join(", ") : null);
  // Fund-published term/fee/early-exit facts shown verbatim; else fallbacks.
  termFacts.forEach((fact) => facts.push({ label: tx(fact.label, lang), value: tx(fact.value, lang) }));
  if (!hasCategory("term")) add(c.term, share?.term?.value, share?.term);
  if (!hasCategory("fee")) add(c.managementFee, tx(offering.managementFee, lang));
  if (!hasCategory("early-exit")) add(c.redemption, tx(share?.redemptionTerms, lang));
  if (professional && commission) facts.push({ label: c.commission, value: commission });

  const presentation = offering.documents.find((doc) => doc.type === "presentation" && doc.visibility !== "private");

  return (
    <div className="space-y-8">

      <section>
        <SectionTitle title={c.keyFacts} />
        <KeyFactsCard facts={facts} lang={lang} />
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

      <section>
        <SectionTitle title={c.aboutManager} />
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
            {companyLogo?.src && (
              <div className="flex h-24 w-full max-w-48 items-center justify-center rounded-lg border border-border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={companyLogo.src} alt={tx(companyLogo.alt, lang) ?? tx(offering.manager.name, lang)} className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-serif text-2xl font-semibold text-foreground">{tx(offering.manager.name, lang)}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{tx(offering.manager.description, lang)}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{c.headquarters}</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">
                {tx(offering.manager.officeAddress, lang) ?? `${offering.manager.headquarters.city}, ${offering.manager.headquarters.province}, ${offering.manager.headquarters.country}`}
              </dd>
            </div>
            {tx(offering.fundType, lang) && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{c.fundStructure}</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{tx(offering.fundType, lang)}</dd>
              </div>
            )}
            {offering.manager.website && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{c.companyWebsite}</dt>
                <dd className="mt-1">
                  <a href={offering.manager.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    {offering.manager.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <TrustStrip
        providers={offering.serviceProviders}
        verifiedAt={offering.verifiedAt}
        copy={{ heading: c.trust, auditor: c.auditor, legalCounsel: c.legalCounsel, appraiser: c.appraiser, verified: c.verified }}
      />
    </div>
  );
}

type LocalizedPerformanceRow = {
  period: string;
  value: string;
  note?: string;
};

function Performance({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const rows: LocalizedPerformanceRow[] = (offering.trailingReturns ?? []).map((item: TrailingReturn) => ({
    period: tx(item.period, lang),
    value: item.value,
    note: tx(item.note, lang),
  }));
  const note = tx(offering.trailingReturnsNote, lang);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <SectionTitle title={c.historical} help={c.historicalHelp} />
        <span className="w-fit shrink-0 rounded bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {c.historicalTag}
        </span>
      </div>

      {rows.length ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-secondary/40">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">{c.period}</th>
                  {rows.map((row, index) => (
                    <th key={`${row.period}-${index}`} scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">
                      {row.period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th scope="row" className="px-4 py-3 text-sm font-medium text-foreground sm:px-5">{c.returnValue}</th>
                  {rows.map((row, index) => (
                    <td key={`${row.period}-${index}`} className="px-4 py-3 text-right text-base font-semibold tabular-nums text-foreground sm:px-5">
                      {row.value}
                      {row.note && <span className="mt-0.5 block text-xs font-normal leading-5 text-muted-foreground">{row.note}</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {note && <p className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs leading-5 text-muted-foreground">{note}</p>}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">{c.noHistory}</div>
      )}
    </div>
  );
}

function Buildings({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang(); const c = pick(COPY, lang);
  return (
    <div className="space-y-4">
      <SectionTitle title={t.capitalApp.map.portfolioBuildings} help={c.buildingHelp} />
      <FundMapEmbed offering={offering} />
    </div>
  );
}

function Documents({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang(); const c = pick(COPY, lang);
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
                  <h3 className="font-semibold text-foreground">{tx(document.title, lang)}</h3>
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
  const { strategies } = useTaxonomies();
  const { context, accountView } = usePortalAccess();
  const c = pick(COPY, lang);
  const [tab, setTab] = useState<Tab>("overview");
  const [shareClassId, setShareClassId] = useState(offering.shareClasses[0]?.id ?? "");
  const share = offering.shareClasses.find((item) => item.id === shareClassId) ?? offering.shareClasses[0];
  const investor = canUseWorkspace(context, "investor");
  const professional = accountView === "professional" && canUseWorkspace(context, "professional");
  const strategyLabel = offering.strategyIds[0] ? taxonomyLabel(strategies, offering.strategyIds[0], lang) : undefined;

  return (
    <div>
      <Link href={`${NORTH_BASE}/investments`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="size-3.5" />{c.back}</Link>
      <header className="overflow-hidden rounded-xl border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
        <OfferingVisual offering={offering} lang={lang} />
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              {strategyLabel && <span className="rounded-full bg-secondary px-3 py-1 text-primary">{strategyLabel}</span>}
              <span className="uppercase tracking-[0.14em] text-[color:var(--gold-foreground)]">{tx(offering.manager.name, lang)}</span>
            </div>
            <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{tx(offering.name, lang)}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{tx(offering.summary, lang)}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {investor && <InvestmentRequestButton offerings={[offering]} initialOfferingId={offering.id} />}
              {offering.shareClasses.length > 1 && (
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">{c.share}
                  <select value={shareClassId} onChange={(event) => setShareClassId(event.target.value)} className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground">
                    {offering.shareClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav aria-label={tx(offering.shortName, lang)} className="sticky top-0 z-20 mt-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-sm">
        {([{ id: "overview", label: c.overview, icon: MapPinned }, { id: "performance", label: c.performance, icon: TrendingUp }, { id: "buildings", label: c.buildings, icon: Building2 }, { id: "documents", label: c.documents, icon: FileText }] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`flex min-h-10 min-w-[8.25rem] flex-1 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold sm:min-w-0 ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Icon className="size-4" />{label}</button>
        ))}
      </nav>
      <main className="mt-6">{tab === "overview" ? <Overview offering={offering} share={share} professional={professional} /> : tab === "performance" ? <Performance offering={offering} /> : tab === "buildings" ? <Buildings offering={offering} /> : <Documents offering={offering} />}</main>
    </div>
  );
}
