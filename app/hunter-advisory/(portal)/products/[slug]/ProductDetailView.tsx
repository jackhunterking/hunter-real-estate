"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, ChevronRight, ExternalLink, FileText, MapPinned, TrendingUp } from "lucide-react";
import type { FundCommissionSchedule, Lang, OfferingBundle, ShareClass, TrailingReturn } from "@/lib/capital/types";
import { formatCurrencyCad, primaryShareClass } from "@/lib/capital/present";
import { buildEssentialKeyFacts, documentTermGroups } from "@/lib/capital/key-facts";
import { riskLevel, tightRange } from "@/components/capital/OfferingSummaryCard";
import { taxonomyLabel } from "@/lib/capital/taxonomies";
import { useTaxonomies } from "@/components/capital/north/TaxonomyProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { InvestmentRequestButton } from "@/components/capital/north/InvestmentRequestButton";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { Panel } from "@/components/capital/north/PortalUI";
import { usePortalAccess } from "@/components/capital/north/PortalAccessProvider";
import { canUseWorkspace } from "@/lib/capital/portal-access";
import {
  DocumentTermsDisclosure,
  type KeyFact,
  KeyFactsCard,
  PresentationCard,
  ServiceProvidersCard,
} from "@/components/capital/offering-ui";

type Tab = "overview" | "performance" | "buildings" | "documents";

const COPY = {
  en: {
    back: "Back to Discover", overview: "Overview", performance: "Performance", buildings: "Buildings", documents: "Documents", managed: "Managed by", moreTabs: "More sections",
    available: "Available", paused: "Paused", closed: "Closed", coming: "Coming soon",
    realEstate: "The real estate", realEstateHelp: "Verified underlying properties connected to this offering — not direct ownership by an investor.",
    summaryReturns: "Projected returns", offeringSize: "Offering size", aum: "Assets under management",
    keyFacts: "Key facts", inception: "Inception date", riskProfile: "Risk profile", minimum: "Minimum investment", projectedReturn: "Projected return",
    targetReturn: "Target return",
    unitPrice: "Unit price", term: "Investment term", distribution: "Distribution", registered: "Registered accounts",
    redemption: "Redemptions", managementFee: "Management fee", commission: "Published commission",
    highlights: "Highlights", cities: "Cities", buildingsCount: "Buildings", locations: "Locations",
    presentation: "Presentation", presentationOpen: "Open presentation",
    presentationVersion: "Version", presentationUnavailable: "Available through Hunter & Hunter Investment Advisors",
    risks: "Material risks and trade-offs",
    historical: "Historical performance", historicalHelp: "Published returns for this investment, shown exactly as provided.", noHistory: "No approved historical information is available.", historicalTag: "Historical—not a forecast",
    period: "Period", returnValue: "Return",
    aboutManager: "About the company", headquarters: "Headquarters", fundStructure: "Structure", companyWebsite: "Company website",
    trust: "Service providers", auditor: "Auditor", legalCounsel: "Legal counsel", appraiser: "Appraiser",
    buildingHelp: "The real, rentable buildings this investment owns — on the map and below. Select a marker or card to view information; missing facts are shown as unavailable and are not inferred.",
    docsHelp: "Approved documents are kept with this offering so their source and version remain clear.",
    type: "Type", effective: "Effective date", version: "Version", source: "Source", open: "Open document", held: "Available through Hunter & Hunter Investment Advisors",
    noDocs: "No approved documents are available.",
    docTerms: "What this document sets out", docPage: "p.",
  },
  tr: {
    back: "Keşfet'e dön", overview: "Genel Bakış", performance: "Performans", buildings: "Binalar", documents: "Belgeler", managed: "Yönetici", moreTabs: "Diğer bölümler",
    available: "Mevcut", paused: "Duraklatıldı", closed: "Kapalı", coming: "Yakında",
    realEstate: "Gayrimenkul", realEstateHelp: "Bu seçenekle bağlantılı doğrulanmış dayanak mülkler — yatırımcının doğrudan mülk sahipliği anlamına gelmez.",
    summaryReturns: "Öngörülen getiri", offeringSize: "Teklif büyüklüğü", aum: "Yönetilen varlıklar",
    keyFacts: "Temel bilgiler", inception: "Yatırım aracı başlangıç tarihi", riskProfile: "Risk profili", minimum: "Minimum yatırım", projectedReturn: "Öngörülen getiri",
    targetReturn: "Hedeflenen getiri",
    unitPrice: "Birim fiyatı", term: "Yatırım süresi", distribution: "Dağıtım", registered: "Kayıtlı hesaplar",
    redemption: "Para çekme", managementFee: "Yönetim ücreti", commission: "Yayımlanan komisyon",
    highlights: "Öne çıkanlar", cities: "Şehir", buildingsCount: "Bina", locations: "Konum",
    presentation: "Sunum", presentationOpen: "Sunumu aç",
    presentationVersion: "Sürüm", presentationUnavailable: "Hunter & Hunter Investment Advisors üzerinden mevcut",
    risks: "Önemli riskler ve ödünleşimler",
    historical: "Geçmiş performans", historicalHelp: "Bu yatırım için yayımlanan getiriler, sağlandığı şekliyle gösterilir.", noHistory: "Onaylı geçmiş bilgi mevcut değil.", historicalTag: "Geçmiş bilgi—tahmin değildir",
    period: "Dönem", returnValue: "Getiri",
    aboutManager: "Şirket hakkında", headquarters: "Merkez", fundStructure: "Yapı", companyWebsite: "Şirket web sitesi",
    trust: "Hizmet sağlayıcıları", auditor: "Denetçi", legalCounsel: "Hukuk müşaviri", appraiser: "Değerleme uzmanı",
    buildingHelp: "Bu yatırımın sahip olduğu gerçek, kiralık binalar — haritada ve aşağıda. Bilgileri görmek için bir işaretçi veya kart seçin; eksik bilgiler mevcut değil olarak gösterilir ve tahmin edilmez.",
    docsHelp: "Onaylı belgeler, kaynak ve sürümlerinin açık kalması için bu seçenekle birlikte tutulur.",
    type: "Tür", effective: "Yürürlük tarihi", version: "Sürüm", source: "Kaynak", open: "Belgeyi aç", held: "Hunter & Hunter Investment Advisors üzerinden mevcut",
    noDocs: "Onaylı belge mevcut değil.",
    docTerms: "Bu belgenin belirlediği koşullar", docPage: "s.",
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

  // Key facts is a fixed list of eight — see lib/capital/key-facts.ts for why
  // the fund's other published terms live under their document instead. The
  // ninth row is Hunter's OWN published schedule, shown only to an active
  // professional: it is what the advisor is paid, not a fund disclosure.
  const facts: KeyFact[] = buildEssentialKeyFacts(offering, share, lang, c);
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
            {/* The one-line legal form. The full statement — including its
                securities-law caveat — is a term of the Offering Memorandum and
                is shown there, under the document. */}
            {tx(offering.structureLabel ?? offering.fundType, lang) && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{c.fundStructure}</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{tx(offering.structureLabel ?? offering.fundType, lang)}</dd>
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

      {/* Named on the fund's own fact sheet — not a Hunter endorsement, so it
          reads as a plain section like the others, not a verification badge. */}
      <section>
        <SectionTitle title={c.trust} />
        <ServiceProvidersCard
          providers={offering.serviceProviders}
          copy={{ auditor: c.auditor, legalCounsel: c.legalCounsel, appraiser: c.appraiser }}
        />
      </section>
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

function Documents({ offering, share }: { offering: OfferingBundle; share?: ShareClass }) {
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
            {/* The terms this document sets out — the fund-published facts that
                cite it, filed where their provenance is self-evident. */}
            <DocumentTermsDisclosure
              groups={documentTermGroups(offering, share, document)}
              lang={lang}
              copy={{ summary: c.docTerms, page: c.docPage }}
            />
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
  const tabsRef = useRef<HTMLElement>(null);
  const [tabsScrollable, setTabsScrollable] = useState(false);
  // Only one class is on offer, so the page always reads the primary class and
  // never asks the investor to pick one.
  const share = primaryShareClass(offering);
  const investor = canUseWorkspace(context, "investor");
  const professional = accountView === "professional" && canUseWorkspace(context, "professional");
  const strategyLabel = offering.strategyIds[0] ? taxonomyLabel(strategies, offering.strategyIds[0], lang) : undefined;
  const bannerImage = offering.media?.card ?? offering.media?.banner;

  // Masthead terms — derived exactly like the summary card's facts, from the
  // same primary class the Key facts table reads, so header and table agree.
  const headerTargetReturn = share?.targetReturn ? tightRange(share.targetReturn.value) : undefined;
  const headerRiskText = tx(offering.riskProfile, lang);
  const headerRisk = headerRiskText ? { label: headerRiskText, level: riskLevel(headerRiskText) } : undefined;
  // The white bar under the banner. AUM is not repeated here — it sits on the
  // frosted strip with target return and risk. Published terms stay VERBATIM,
  // exactly as in the Key facts table; only the numeric minimum is formatted.
  const headerFacts = ([
    { label: c.minimum, value: share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : null },
    { label: c.distribution, value: share?.targetDistribution?.value ?? share?.distributionPerUnit?.value ?? tx(offering.distributionFrequency, lang) },
    { label: c.term, value: share?.term?.value ?? null },
  ] as { label: string; value: string | null }[]).filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const sync = () => setTabsScrollable(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [lang]);

  return (
    <div>
      <Link href={`${NORTH_BASE}/investments`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="size-3.5" />{c.back}</Link>
      {/* Masthead: identity over the banner, then a frosted strip carrying the
          three figures that decide interest (target return, AUM, risk) so the
          photograph and the numbers read as one object. Remaining terms and the
          CTA sit on the white bar below. Labels, figures and the 1–5 meter
          mirror the OfferingSummaryCard stat panel so the detail page reads as
          the same object the investor clicked on Discover. */}
      <header className="relative overflow-hidden rounded-xl border border-[#dbe1e5] bg-white shadow-[0_1px_2px_rgba(10,28,43,0.04)]">
        {/* Banner is the card's banner, unchanged: same 60/13 crop, same
            left-to-right scrim, logo plate bottom-left, strategy top-right —
            only the plate scales with the wider frame. */}
        <div className="relative aspect-[60/13] overflow-hidden bg-[#0d2d43]">
          {bannerImage?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerImage.src} alt={tx(bannerImage.alt, lang) ?? tx(offering.shortName, lang)} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/75 via-[#071c2c]/15 to-transparent" />
          {offering.media?.logo?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offering.media.logo.src} alt="" className="absolute bottom-3 left-3 h-9 max-w-24 rounded bg-white object-contain p-1.5 shadow-sm sm:bottom-4 sm:left-4 sm:h-12 sm:max-w-32 lg:h-14 lg:max-w-40 lg:p-2.5" />
          )}
          {strategyLabel && (
            <span className="absolute right-2.5 top-2.5 inline-flex max-w-[55%] truncate rounded border border-white/25 bg-[#071c2c]/65 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm sm:right-4 sm:top-4 sm:px-2.5">
              {strategyLabel}
            </span>
          )}
        </div>

        {/* Name, company, summary — the card's block, at page scale. The CTA
            sits on the same row, flush to the right edge of the white block and
            aligned to the top of the name, so the identity and the action read
            as one line rather than the action trailing the whole header. */}
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold leading-snug text-[#152b3b] sm:text-[1.75rem]">{tx(offering.name, lang)}</h1>
            <p className="mt-1.5 text-sm text-[#75818a]">{tx(offering.manager.name, lang)}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6d78] sm:text-[15px]">{tx(offering.summary, lang)}</p>
          </div>
          {investor && (
            <div className="shrink-0 sm:pt-0.5">
              <InvestmentRequestButton offerings={[offering]} initialOfferingId={offering.id} className="min-h-11 w-full sm:w-auto" />
            </div>
          )}
        </div>

        {/* Stat panel — the card's own treatment at page scale: #f4f7f9 ground,
            grey micro-label above a navy figure, navy meter on #dde4e8. */}
        <dl className="grid grid-cols-1 bg-[#f4f7f9] sm:grid-cols-3">
          {headerTargetReturn && (
            <div className="min-w-0 border-b border-[#e2e8ec] px-5 py-4 sm:border-b-0 sm:px-7 sm:py-5">
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">{c.targetReturn}</dt>
              <dd className="mt-2 font-serif text-[1.75rem] font-semibold leading-none text-[#0a2d46] sm:text-3xl">{headerTargetReturn}</dd>
            </div>
          )}
          {offering.aum && (
            <div className="min-w-0 border-b border-[#e2e8ec] px-5 py-4 sm:border-b-0 sm:border-l sm:px-7 sm:py-5">
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">{c.aum}</dt>
              <dd className="mt-2 text-lg font-semibold leading-tight text-[#0a2d46] sm:text-xl">{String(offering.aum.value)}</dd>
            </div>
          )}
          {headerRisk && (
            <div className="min-w-0 px-5 py-4 sm:border-l sm:border-[#e2e8ec] sm:px-7 sm:py-5">
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">{c.riskProfile}</dt>
              <dd className="mt-2 text-sm font-semibold leading-tight text-[#0a2d46]">{headerRisk.label}</dd>
              {headerRisk.level > 0 && (
                <div className="mt-2.5 flex gap-1" aria-hidden>
                  {[1, 2, 3, 4, 5].map((step) => (
                    <span key={step} className={`h-1 flex-1 rounded-full ${step <= headerRisk.level ? "bg-[#0a2d46]" : "bg-[#dde4e8]"}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </dl>

        {/* Remaining published terms, in the card's tiled fact treatment. */}
        {headerFacts.length > 0 && (
          <dl className="grid grid-cols-1 gap-px border-t border-[#e2e7ea] bg-[#e2e7ea] sm:grid-cols-3">
            {headerFacts.map((fact) => (
              <div key={fact.label} className="min-w-0 bg-[#fbfcfc] px-5 py-4 sm:px-7">
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">{fact.label}</dt>
                <dd className="mt-2 text-sm font-semibold leading-snug text-[#172d3d]">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* No closing band: the auditor is named in full under Service
            providers, so repeating it here only restated a fact the page
            already carries below. */}
      </header>

      <div className="sticky top-0 z-20 mt-4">
        <nav ref={tabsRef} aria-label={tx(offering.shortName, lang)} className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 pr-9 shadow-sm [scrollbar-width:none] sm:pr-1 [&::-webkit-scrollbar]:hidden">
          {([{ id: "overview", label: c.overview, icon: MapPinned }, { id: "performance", label: c.performance, icon: TrendingUp }, { id: "buildings", label: c.buildings, icon: Building2 }, { id: "documents", label: c.documents, icon: FileText }] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`flex min-h-10 min-w-[8.25rem] flex-1 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold sm:min-w-0 ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Icon className="size-4" />{label}</button>
          ))}
        </nav>
        {tabsScrollable && (
          <button type="button" aria-label={c.moreTabs} onClick={() => tabsRef.current?.scrollBy({ left: Math.round((tabsRef.current.clientWidth || 0) * 0.7), behavior: "smooth" })} className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"><ChevronRight className="size-4" /></button>
        )}
      </div>
      <main className="mt-6">{tab === "overview" ? <Overview offering={offering} share={share} professional={professional} /> : tab === "performance" ? <Performance offering={offering} /> : tab === "buildings" ? <Buildings offering={offering} /> : <Documents offering={offering} share={share} />}</main>
    </div>
  );
}
