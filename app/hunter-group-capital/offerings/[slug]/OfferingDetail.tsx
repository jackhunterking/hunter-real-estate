"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Eye,
  FileText,
  Landmark,
  ListChecks,
  MapPin,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import {
  buildFundDetailViewModel,
  formatCurrencyCad,
  primaryShareClass,
} from "@/lib/capital/present";
import type { OfferingBundle } from "@/lib/capital/types";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { BuildingMapThumb } from "@/components/capital/map/BuildingMapThumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const WHATSAPP = "https://wa.me/16473913311";
const TABS = ["offer-details", "qualification", "portfolio", "documents", "contact"] as const;
type TabKey = (typeof TABS)[number];
const TAB_LABEL: Record<TabKey, "offerDetails" | "qualification" | "portfolio" | "documents" | "contact"> = {
  "offer-details": "offerDetails",
  qualification: "qualification",
  portfolio: "portfolio",
  documents: "documents",
  contact: "contact",
};

export function OfferingDetail({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const d = t.capitalApp.detail;
  const router = useRouter();
  const params = useSearchParams();
  const tab = (TABS.includes(params.get("tab") as TabKey) ? params.get("tab") : "offer-details") as TabKey;

  function setTab(next: string) {
    const p = new URLSearchParams(params.toString());
    if (next === "offer-details") p.delete("tab");
    else p.set("tab", next);
    const qs = p.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  const vm = buildFundDetailViewModel(offering, lang);
  const share = primaryShareClass(offering);
  const profileHref = `/hunter-group-capital/investor-profile?offering=${offering.slug}${share ? `&shareClass=${share.id}` : ""}`;
  const whatsappHref = `${WHATSAPP}?text=${encodeURIComponent(`Hi, I would like to learn more about ${offering.name[lang]}.`)}`;
  const whatsappLabel = lang === "tr" ? "WhatsApp'tan Yaz" : "Message on WhatsApp";
  const tabs = d.tabs as Record<(typeof TAB_LABEL)[TabKey], string>;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/hunter-group-capital" className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> {d.back}
      </Link>

      {/* Header: hero banner + identity bar */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div
          className="relative aspect-[60/13] bg-[#061725]"
          style={vm.bannerImage.src ? undefined : { backgroundImage: vm.bannerImage.gradient }}
        >
          {vm.bannerImage.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vm.bannerImage.src} alt={vm.bannerImage.alt} className="h-full w-full object-cover" />
          )}
          {/* Corner scrim so the light strategy pill stays legible over any banner artwork */}
          <div className="pointer-events-none absolute right-0 top-0 h-20 w-40 bg-gradient-to-bl from-black/30 via-black/10 to-transparent sm:h-24 sm:w-52" aria-hidden />
          <span className="absolute right-3 top-3 z-10 rounded-md bg-card/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-primary shadow-sm backdrop-blur-sm sm:right-4 sm:top-4 sm:text-[11px]">
            {taxonomyLabel(strategies, offering.strategyIds[0], lang)}
          </span>
        </div>

        <div className="flex flex-col gap-5 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-7">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:size-16"
              style={vm.logo.src ? undefined : { backgroundImage: vm.logo.gradient }}
            >
              {vm.logo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vm.logo.src} alt={vm.logo.alt} className="h-full w-full object-contain p-2" />
              ) : (
                <span className="font-serif text-lg font-semibold text-primary" aria-hidden>{vm.logo.initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{offering.name[lang]}</h1>
              <p className="mt-1 truncate text-sm text-muted-foreground">{offering.manager.name[lang]}</p>
            </div>
          </div>

          <Button asChild variant="wa" size="lg" className="w-full font-bold sm:w-auto">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden />
              {whatsappLabel}
            </a>
          </Button>
        </div>
      </section>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList className="sticky top-16 z-10 h-auto flex-wrap justify-start">
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key} className="text-sm">
              {tabs[TAB_LABEL[key]]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="offer-details"><OfferDetailsTab offering={offering} /></TabsContent>
        <TabsContent value="qualification"><InvestorQualificationGuide offering={offering} /></TabsContent>
        <TabsContent value="portfolio"><PortfolioTab offering={offering} /></TabsContent>
        <TabsContent value="documents"><DocumentsTab offering={offering} /></TabsContent>
        <TabsContent value="contact"><ContactTab profileHref={profileHref} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FundingRing({ percent, label }: { percent: number; label: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <div className="mb-1 flex items-center gap-3">
      <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 32 32)" />
      </svg>
      <div className="flex flex-col">
        <strong className="text-xl font-bold leading-none text-foreground">{percent}%</strong>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

const CARD = "rounded-xl border border-border bg-card p-6";
const H2 = "font-serif text-lg font-semibold text-foreground";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";
const CHOICE =
  "rounded-md border px-3 py-2 text-center text-sm font-semibold transition-colors hover:border-primary/60";
const CHOICE_LG =
  "rounded-lg border px-4 py-4 text-center text-[15px] font-semibold transition-colors hover:border-primary/60";

const STAT_ICONS: Record<string, LucideIcon> = {
  return: TrendingUp,
  distribution: CircleDollarSign,
  aum: Landmark,
};

/** Consistent institutional section header: gold hairline tick + muted icon + serif title. */
function SectionHead({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="h-4 w-[3px] shrink-0 rounded-full bg-gold" aria-hidden />
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      <h2 className={H2}>{children}</h2>
    </div>
  );
}

function OfferDetailsTab({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const d = t.capitalApp.detail;
  const vm = buildFundDetailViewModel(offering, lang);
  const fields = d.fields as Record<string, string>;
  const managerLogo = vm.logo;

  return (
    <div className="flex flex-col gap-7">
      {vm.summaryTiles.length > 0 && (
        <dl className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border border-t-2 border-t-gold bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {vm.summaryTiles.map((tile) => {
            const Icon = STAT_ICONS[tile.key] ?? BarChart3;
            return (
              <div key={tile.key} className="flex flex-col gap-3.5 px-6 py-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <dt className={EYEBROW}>{tile.label}</dt>
                </div>
                <dd className="text-[2.35rem] font-semibold leading-none tracking-tight text-foreground tabular-nums">
                  {tile.value}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      <section className={CARD}>
        <SectionHead icon={ListChecks} className="mb-5">{d.fundDetailsHeading}</SectionHead>
        <dl className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {vm.fundDetails.map((r) => (
            <div key={r.key} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
              <dt className="text-[13px] leading-snug text-muted-foreground">{fields[r.key] ?? r.key}</dt>
              <dd className="shrink-0 text-right text-[15px] font-semibold text-foreground tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {vm.trailingReturns.length > 0 && (
        <section className={CARD}>
          <SectionHead icon={TrendingUp} className="mb-4">{d.trailingReturns}</SectionHead>
          <PerformanceTable rows={vm.trailingReturns} />
        </section>
      )}

      {vm.providers.length > 0 && (
        <section className={CARD}>
          <SectionHead icon={Building2} className="mb-5">{d.providersHeading}</SectionHead>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vm.providers.map((r) => (
              <div key={r.key} className="rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:border-gold-line">
                <dt className={cn(EYEBROW, "mb-1.5")}>{fields[r.key] ?? r.key}</dt>
                <dd className="text-[15px] font-semibold text-foreground">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                      {r.value}
                      <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden />
                    </a>
                  ) : (
                    r.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {vm.lastUpdated && (
        <p className="text-xs text-muted-foreground">{d.lastUpdated}: {vm.lastUpdated}</p>
      )}

      <section className={CARD}>
        <SectionHead icon={Building2} className="mb-4">{d.aboutManager}</SectionHead>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="grid h-20 w-36 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white shadow-sm"
            style={managerLogo.src ? undefined : { backgroundImage: managerLogo.gradient }}
          >
            {managerLogo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={managerLogo.src} alt={managerLogo.alt} className="h-full w-full object-contain p-3" />
            ) : (
              <span className="font-serif text-xl font-semibold text-primary" aria-hidden>{managerLogo.initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground">
              {offering.manager.website ? (
                <a href={offering.manager.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                  {offering.manager.name[lang]}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              ) : (
                offering.manager.name[lang]
              )}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{offering.manager.officeAddress?.[lang] ?? `${offering.manager.headquarters.city}, ${offering.manager.headquarters.province}`}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

type GuideState = {
  investorType: "personal" | "entity" | "institution";
  household: "alone" | "spouse";
  income: "under75" | "over75" | "over200";
  householdIncome: "under125" | "over125" | "over300";
  netAssets: "under400" | "over400" | "over5m";
  financialAssets: "under1m" | "over1m";
  relationship: "no" | "yes";
  intendedAmount: string;
  priorAmount: string;
};

const CATEGORY_SUMMARIES = [
  {
    title: "Accredited Investor",
    requirements: ["Financial assets over $1M", "Net assets of $5M+", "Income over $200k, or $300k with spouse"],
    access: "Higher investment amounts may be available",
  },
  {
    title: "Eligible Investor",
    requirements: ["Net assets over $400k", "Annual income over $75k", "Household income over $125k"],
    access: "Around $30k, or up to $100k depending on review",
  },
  {
    title: "Non-Eligible Investor",
    requirements: ["Does not meet the accredited or eligible thresholds"],
    access: "Around $10k",
  },
  {
    title: "Family, Friend, or Business Associate",
    requirements: ["Qualifying relationship with the issuer or key people connected to it"],
    access: "Depends on the relationship type",
  },
  {
    title: "Corporation, Trust, or Institution",
    requirements: ["Investing through an entity instead of personally"],
    access: "Entity review required",
  },
];

const GUIDE_QUESTIONS: {
  key: Exclude<keyof GuideState, "intendedAmount" | "priorAmount">;
  testId: string;
  label: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "investorType",
    testId: "investor-type",
    label: "How are you investing?",
    options: [
      { value: "personal", label: "Personally" },
      { value: "entity", label: "Corporation / trust" },
      { value: "institution", label: "Institution" },
    ],
  },
  {
    key: "household",
    testId: "household",
    label: "Are you including a spouse?",
    options: [
      { value: "alone", label: "No" },
      { value: "spouse", label: "Yes" },
    ],
  },
  {
    key: "income",
    testId: "income",
    label: "Your annual income",
    options: [
      { value: "under75", label: "Under $75k" },
      { value: "over75", label: "$75k+" },
      { value: "over200", label: "$200k+" },
    ],
  },
  {
    key: "householdIncome",
    testId: "household-income",
    label: "Household income",
    options: [
      { value: "under125", label: "Under $125k" },
      { value: "over125", label: "$125k+" },
      { value: "over300", label: "$300k+" },
    ],
  },
  {
    key: "netAssets",
    testId: "net-assets",
    label: "Net assets",
    options: [
      { value: "under400", label: "Under $400k" },
      { value: "over400", label: "$400k+" },
      { value: "over5m", label: "$5M+" },
    ],
  },
  {
    key: "financialAssets",
    testId: "financial-assets",
    label: "Financial assets",
    options: [
      { value: "under1m", label: "Under $1M" },
      { value: "over1m", label: "$1M+" },
    ],
  },
  {
    key: "relationship",
    testId: "relationship",
    label: "Close relationship with the issuer?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
];

function InvestorQualificationGuide({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const share = primaryShareClass(offering);
  const fundMinimum = share?.minimumInvestment?.value ?? null;
  const [step, setStep] = useState(0);
  const [guide, setGuide] = useState<GuideState>({
    investorType: "personal",
    household: "alone",
    income: "under75",
    householdIncome: "under125",
    netAssets: "under400",
    financialAssets: "under1m",
    relationship: "no",
    intendedAmount: "",
    priorAmount: "0",
  });

  // Personal investors answer every question; entity/institution short-circuit to the result.
  const isPersonal = guide.investorType === "personal";
  const questionCount = isPersonal ? GUIDE_QUESTIONS.length : 1;
  const amountStep = isPersonal ? questionCount : -1;
  const resultStep = questionCount + (isPersonal ? 1 : 0);
  const totalSteps = resultStep + 1;
  const current = Math.min(Math.max(step, 0), totalSteps - 1);
  const pct = Math.round(((current + 1) / totalSteps) * 100);

  function update<K extends keyof GuideState>(key: K, value: GuideState[K]) {
    setGuide((prev) => ({ ...prev, [key]: value }));
  }

  function answer(key: keyof GuideState, value: string) {
    setGuide((prev) => ({ ...prev, [key]: value } as GuideState));
    setStep(current + 1);
  }

  const result = classifyGuide(guide);
  const intendedAmount = moneyToNumber(guide.intendedAmount);
  const priorAmount = moneyToNumber(guide.priorAmount);
  const availableEstimate = typeof result.baseMax === "number" ? Math.max(result.baseMax - priorAmount, 0) : null;
  const amountForComparison = intendedAmount || fundMinimum || 0;
  const minimumLabel = fundMinimum ? formatCurrencyCad(fundMinimum, lang) : "Review required";
  const estimatedLabel = availableEstimate !== null ? formatCurrencyCad(availableEstimate, lang) : result.access;

  let fitMessage: string;
  if (result.kind === "manual") {
    fitMessage = result.access;
  } else if (fundMinimum && availableEstimate !== null && fundMinimum > availableEstimate) {
    fitMessage = "This fund may be above your current estimated limit.";
  } else if (availableEstimate !== null && intendedAmount > availableEstimate) {
    fitMessage = "Your amount may be above your current estimated limit.";
  } else if (fundMinimum && amountForComparison < fundMinimum) {
    fitMessage = "Your amount is below this fund's minimum.";
  } else {
    fitMessage = "This fund may fit your current estimate.";
  }

  const question = current < questionCount ? GUIDE_QUESTIONS[current] : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Qualification</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground">Check your fit</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Answer a few simple questions and compare the result with this fund&apos;s minimum.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <header className="flex flex-col gap-2 border-b border-border px-5 py-4">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Step {current + 1} of {totalSteps}</span>
            <b className="text-primary">{pct}%</b>
          </div>
          <Progress value={pct} className="h-1.5" />
        </header>

        <div className="p-5 sm:p-6">
          {question && (
            <div className="flex flex-col gap-5">
              <div>
                <p className={EYEBROW}>Question {current + 1}</p>
                <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">{question.label}</h3>
              </div>
              <div className={cn("grid gap-2.5", question.options.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={`${question.testId}-${option.value}`}
                    className={cn(
                      CHOICE_LG,
                      guide[question.key] === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
                    )}
                    onClick={() => answer(question.key, option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current === amountStep && (
            <div className="flex flex-col gap-5">
              <div>
                <p className={EYEBROW}>Almost done</p>
                <h3 className="mt-2 flex items-center gap-2 font-serif text-2xl font-semibold leading-tight text-foreground">
                  <CircleDollarSign className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  Compare the amount
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Optional — this helps estimate how much you may be able to invest.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Amount you are considering</span>
                  <Input inputMode="numeric" placeholder="$25,000" value={guide.intendedAmount} onChange={(event) => update("intendedAmount", event.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Similar private offerings in last 12 months</span>
                  <Input inputMode="numeric" placeholder="$0" value={guide.priorAmount} onChange={(event) => update("priorAmount", event.target.value)} />
                </label>
              </div>
            </div>
          )}

          {current === resultStep && (
            <div className="flex flex-col gap-4">
              <div data-testid="qualification-result" className="overflow-hidden rounded-lg border border-border border-t-2 border-t-gold bg-card">
                <div className="px-4 pt-4 pb-3.5">
                  <p className={EYEBROW}>Your status</p>
                  <h3 className="mt-1.5 text-2xl font-bold leading-tight text-foreground">{result.title}</h3>
                </div>

                <dl className="divide-y divide-border border-y border-border">
                  <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                    <dt className="shrink-0 text-[13px] text-muted-foreground">Fund minimum</dt>
                    <dd className="text-right text-[15px] font-semibold text-foreground tabular-nums">{minimumLabel}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                    <dt className="shrink-0 text-[13px] text-muted-foreground">Estimated access</dt>
                    <dd className="text-right text-[15px] font-semibold text-foreground tabular-nums">{estimatedLabel}</dd>
                  </div>
                </dl>

                <p className="m-4 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold leading-snug text-primary-foreground">
                  {fitMessage}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setStep(0)}>Edit answers</Button>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-border px-5 py-4">
          <Button type="button" variant="outline" disabled={current === 0} onClick={() => setStep(current - 1)}>
            ← Back
          </Button>
          {current === amountStep && (
            <Button type="button" onClick={() => setStep(current + 1)}>See result →</Button>
          )}
        </footer>
      </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Reference</p>
          <h3 className="mt-1 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
            <ClipboardList className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
            Investor type requirements
          </h3>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {CATEGORY_SUMMARIES.map((item) => (
            <article key={item.title} className="grid gap-3 p-4 transition-colors hover:bg-secondary/20 md:grid-cols-[210px_minmax(0,1fr)_190px] md:items-start">
              <h4 className="text-[15px] font-bold leading-tight text-foreground">{item.title}</h4>
              <ul className="flex flex-col gap-1.5">
                {item.requirements.map((requirement) => (
                  <li key={requirement} className="text-sm leading-snug text-muted-foreground">
                    {requirement}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold leading-snug text-primary">{item.access}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function classifyGuide(guide: GuideState): { title: string; access: string; baseMax: number | null; kind: "limited" | "manual" } {
  if (guide.investorType === "institution") {
    return { title: "Corporation, Trust, or Institution", access: "Entity review required", baseMax: null, kind: "manual" };
  }
  if (guide.investorType === "entity") {
    return { title: "Corporation, Trust, or Institution", access: "Entity review required", baseMax: null, kind: "manual" };
  }
  if (guide.financialAssets === "over1m" || guide.netAssets === "over5m" || guide.income === "over200" || guide.householdIncome === "over300") {
    return { title: "Accredited Investor", access: "Higher investment amounts may be available", baseMax: null, kind: "manual" };
  }
  if (guide.relationship === "yes") {
    return { title: "Family, Friend, or Business Associate", access: "Access depends on the relationship type", baseMax: null, kind: "manual" };
  }
  if (guide.netAssets === "over400" || guide.income === "over75" || guide.householdIncome === "over125") {
    return { title: "Eligible Investor", access: "Around $30k, or up to $100k depending on review", baseMax: 30000, kind: "limited" };
  }
  return { title: "Non-Eligible Investor", access: "Around $10k", baseMax: 10000, kind: "limited" };
}

function moneyToNumber(value: string): number {
  const clean = value.replace(/[^0-9.]/g, "");
  if (!clean) return 0;
  const amount = Number(clean);
  return Number.isFinite(amount) ? amount : 0;
}

function PerformanceTable({ rows }: { rows: { period: string; value: string; note: string | null }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] table-fixed overflow-hidden rounded-lg border border-border text-left">
        <thead>
          <tr className="divide-x divide-border border-b border-border bg-secondary/40">
            {rows.map((row) => (
              <th key={row.period} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {row.period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="divide-x divide-border">
            {rows.map((row) => (
              <td key={row.period} className="px-4 py-3.5 text-xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {row.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PortfolioTab({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const p = t.capitalApp.portfolio;
  return (
    <div className="flex flex-col gap-5">
      <FundMapEmbed offering={offering} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offering.properties.map((property) => (
          <article
            key={property.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50"
          >
            <BuildingMapThumb
              latitude={property.latitude}
              longitude={property.longitude}
              label={property.name[lang]}
            />
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-serif text-[15px] font-semibold leading-snug text-foreground">
                {property.name[lang]}
              </h3>
              <small className="mt-1 flex items-center gap-1 text-[12.5px] text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {property.city}, {property.province}
              </small>
              {property.listingUrl && (
                <a
                  href={property.listingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 self-start text-[13px] font-semibold text-primary hover:underline"
                >
                  {p.viewListing}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DocumentsTab({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const dc = t.capitalApp.documents;
  if (!offering.documents.length) return <p className="py-8 text-center text-muted-foreground">{dc.empty}</p>;
  const headClass = "h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-secondary/40 hover:bg-secondary/40">
            <TableHead className={headClass}>{dc.colName}</TableHead>
            <TableHead className={headClass}>{dc.colType}</TableHead>
            <TableHead className={headClass}>{dc.colDate}</TableHead>
            <TableHead className={headClass}>{dc.colAccess}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offering.documents.map((doc) => {
            const isPublic = doc.visibility === "public";
            return (
              <TableRow key={doc.id} className="border-border hover:bg-secondary/20">
                <TableCell className="px-4 py-3.5">
                  <div className="flex items-start gap-2.5">
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{doc.title[lang]}</span>
                      {doc.description && <small className="text-xs text-muted-foreground">{doc.description[lang]}</small>}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-muted-foreground">{dc.types[doc.type]}</TableCell>
                <TableCell className="px-4 py-3.5 text-muted-foreground tabular-nums">{doc.effectiveDate}</TableCell>
                <TableCell className="px-4 py-3.5">
                  {isPublic && doc.href ? (
                    <a href={doc.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                      <Eye className="size-3.5" aria-hidden />
                      {dc.download}
                    </a>
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{isPublic ? dc.public : dc.approvedInvestor}</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ContactTab({ profileHref }: { profileHref: string }) {
  const { t } = useLang();
  const c = t.capitalApp.detail.contact;
  const d = t.capitalApp.detail;
  return (
    <div className="max-w-xl rounded-xl border border-border bg-card p-6">
      <SectionHead icon={MessageCircle} className="mb-3">{c.heading}</SectionHead>
      <p className="mb-5 text-[14.5px] leading-relaxed text-muted-foreground">{c.body}</p>
      <div className="flex flex-wrap gap-2.5">
        <Button asChild><Link href={profileHref}>{d.invest}</Link></Button>
        <Button asChild variant="wa"><a href={WHATSAPP} target="_blank" rel="noreferrer">{c.cta}</a></Button>
      </div>
    </div>
  );
}
