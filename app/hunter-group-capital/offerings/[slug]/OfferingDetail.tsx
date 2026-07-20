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
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { assessOntarioInvestor } from "@/lib/capital/ontario-investor-assessment";
import { READINESS_RULESET } from "@/lib/capital/readiness-rules";
import { strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import {
  buildFundDetailViewModel,
  formatCurrencyCad,
  primaryShareClass,
} from "@/lib/capital/present";
import type { OfferingBundle } from "@/lib/capital/types";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const profileHref = `/hunter-advisory/sign-up?offering=${offering.slug}${share ? `&shareClass=${share.id}` : ""}`;
  const whatsappHref = `${WHATSAPP}?text=${encodeURIComponent(`Hi, I would like to learn more about ${offering.name[lang]}.`)}`;
  const whatsappLabel = lang === "tr" ? "WhatsApp'tan Yaz" : "Message on WhatsApp";
  const tabs = d.tabs as Record<(typeof TAB_LABEL)[TabKey], string>;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/hunter-advisory" className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
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
  aum: Landmark,
  buildings: Building2,
  units: CircleDollarSign,
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
        <dl className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border border-t-2 border-t-gold bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
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
            <div key={r.key} className={cn("flex items-baseline justify-between gap-4 border-b border-border py-2.5", r.key === "redemption" && "items-start sm:col-span-2 lg:col-span-3")}>
              <dt className="whitespace-nowrap text-[13px] leading-snug text-muted-foreground">{fields[r.key] ?? r.key}</dt>
              <dd className="shrink-0 text-right text-[15px] font-semibold text-foreground tabular-nums">
                {r.key === "redemption" ? (
                  <span className="grid gap-1">
                    {r.value.split(";").map((term) => <span key={term}>{term.trim()}</span>)}
                  </span>
                ) : r.value}
              </dd>
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
};

type GuideQuestionKey = keyof GuideState;

// Question order + option value keys; all display copy comes from the i18n dictionary (detail.guide).
const GUIDE_QUESTIONS: { key: GuideQuestionKey; testId: string; options: string[] }[] = [
  { key: "investorType", testId: "investor-type", options: ["personal", "entity", "institution"] },
  { key: "household", testId: "household", options: ["alone", "spouse"] },
  { key: "income", testId: "income", options: ["under75", "over75", "over200"] },
  { key: "householdIncome", testId: "household-income", options: ["under125", "over125", "over300"] },
  { key: "netAssets", testId: "net-assets", options: ["under400", "over400", "over5m"] },
  { key: "financialAssets", testId: "financial-assets", options: ["under1m", "over1m"] },
  { key: "relationship", testId: "relationship", options: ["no", "yes"] },
];

const REFERENCE_CATEGORY_KEYS = ["accredited", "eligible", "nonEligible", "relationship", "entity"] as const;
type ReferenceCategoryKey = (typeof REFERENCE_CATEGORY_KEYS)[number];
type InvestorReferenceCopy = ReturnType<typeof useLang>["t"]["capitalApp"]["detail"]["guide"]["reference"];

function InvestorQualificationGuide({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const g = t.capitalApp.detail.guide;
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
  });

  // Personal investors answer every question; entity/institution short-circuit to the result.
  const isPersonal = guide.investorType === "personal";
  const questionCount = isPersonal ? GUIDE_QUESTIONS.length : 1;
  // Public pages explain a possible Ontario classification only. Exact OM
  // capacity belongs to the licensed workflow, where the product and rolling
  // acquisition-cost history can be verified.
  const resultStep = questionCount;
  const totalSteps = resultStep + 1;
  const current = Math.min(Math.max(step, 0), totalSteps - 1);
  const pct = Math.round(((current + 1) / totalSteps) * 100);

  function answer(key: keyof GuideState, value: string) {
    setGuide((prev) => ({ ...prev, [key]: value } as GuideState));
    setStep(current + 1);
  }

  const classification = classifyGuide(guide, offering);
  const resultCopy = g.results[classification.category];
  const minimumLabel = fundMinimum ? formatCurrencyCad(fundMinimum, lang) : g.result.reviewRequired;
  const estimatedLabel = resultCopy.access;
  const fitMessage = resultCopy.access;

  const question = current < questionCount ? GUIDE_QUESTIONS[current] : null;
  const questionCopy = question ? g.questions[question.key] : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{g.eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground">{g.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{g.intro}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <header className="flex flex-col gap-2 border-b border-border px-5 py-4">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{g.stepLabel} {current + 1} / {totalSteps}</span>
            <b className="text-primary">{pct}%</b>
          </div>
          <Progress value={pct} className="h-1.5" />
        </header>

        <div className="p-5 sm:p-6">
          {question && questionCopy && (
            <div className="flex flex-col gap-5">
              <div>
                <p className={EYEBROW}>{g.questionLabel} {current + 1}</p>
                <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">{questionCopy.label}</h3>
              </div>
              <div className={cn("grid gap-2.5", question.options.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                {question.options.map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-testid={`${question.testId}-${value}`}
                    className={cn(
                      CHOICE_LG,
                      guide[question.key] === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
                    )}
                    onClick={() => answer(question.key, value)}
                  >
                    {(questionCopy.options as Record<string, string>)[value]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current === resultStep && (
            <div className="flex flex-col gap-4">
              <div data-testid="qualification-result" className="overflow-hidden rounded-lg border border-border border-t-2 border-t-gold bg-card">
                <div className="px-4 pt-4 pb-3.5">
                  <p className={EYEBROW}>{g.result.statusEyebrow}</p>
                  <h3 className="mt-1.5 text-2xl font-bold leading-tight text-foreground">{resultCopy.title}</h3>
                </div>

                <dl className="divide-y divide-border border-y border-border">
                  <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                    <dt className="shrink-0 text-[13px] text-muted-foreground">{g.result.fundMinimum}</dt>
                    <dd className="text-right text-[15px] font-semibold text-foreground tabular-nums">{minimumLabel}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                    <dt className="shrink-0 text-[13px] text-muted-foreground">{g.result.estimatedAccess}</dt>
                    <dd className="text-right text-[15px] font-semibold text-foreground tabular-nums">{estimatedLabel}</dd>
                  </div>
                </dl>

                <p className="m-4 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold leading-snug text-primary-foreground">
                  {fitMessage}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setStep(0)}>{g.result.editAnswers}</Button>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-border px-5 py-4">
          <Button type="button" variant="outline" disabled={current === 0} onClick={() => setStep(current - 1)}>
            ← {g.back}
          </Button>
        </footer>
      </div>
      </div>

      <InvestorReferenceDialog offering={offering} lang={lang} copy={g.reference} />
    </div>
  );
}

function InvestorReferenceDialog({
  offering,
  lang,
  copy,
}: {
  offering: OfferingBundle;
  lang: "en" | "tr";
  copy: InvestorReferenceCopy;
}) {
  const formatAmount = (value: number) => formatCurrencyCad(value, lang);
  const limits: Record<ReferenceCategoryKey, string> = {
    accredited: copy.limits.accredited,
    eligible: copy.limits.eligible
      .replace("{base}", formatAmount(READINESS_RULESET.omLimits.eligible))
      .replace("{advised}", formatAmount(READINESS_RULESET.omLimits.eligibleWithAdvice)),
    nonEligible: copy.limits.nonEligible.replace(
      "{base}",
      formatAmount(READINESS_RULESET.omLimits.nonEligible),
    ),
    relationship: copy.limits.relationship,
    entity: copy.limits.entity,
  };
  const rows = REFERENCE_CATEGORY_KEYS.map((key) => ({
    key,
    ...copy.categories[key],
    limit: limits[key],
  }));
  const offeringWarning = offering.complianceProfile.isInvestmentFund
    ? copy.investmentFundWarning
    : !offering.complianceProfile.reviewedAt
      || !offering.complianceProfile.approvedOntarioExemptions.includes("offering-memorandum")
      ? copy.unapprovedWarning
      : null;

  return (
    <Dialog>
      <section className="mx-auto w-full max-w-xl rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
              <ClipboardList className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{copy.eyebrow}</p>
              <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-foreground">{copy.triggerTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.triggerBody}</p>
            </div>
          </div>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto">
              {copy.open}
            </Button>
          </DialogTrigger>
        </div>
      </section>

      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-5 py-5 pr-12 sm:px-7 sm:py-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{copy.eyebrow}</p>
          <DialogTitle className="font-serif text-2xl leading-tight">{copy.modalTitle}</DialogTitle>
          <DialogDescription className="max-w-3xl leading-relaxed">{copy.modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          {offeringWarning && (
            <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
              {offeringWarning}
            </div>
          )}

          <div className="space-y-3">
            <article className="rounded-lg border border-border bg-secondary/30 p-4">
              <h4 className="font-semibold text-foreground">{copy.omTitle}</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.omDefinition}</p>
            </article>
            <article className="rounded-lg border border-border bg-secondary/30 p-4">
              <h4 className="font-semibold text-foreground">{copy.emdTitle}</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.emdDefinition}</p>
            </article>
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-border md:block">
            <table className="w-full table-fixed text-left">
              <thead className="border-b border-border bg-secondary/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="w-[18%] px-4 py-3">{copy.categoryHeading}</th>
                  <th className="w-[31%] px-4 py-3">{copy.qualificationHeading}</th>
                  <th className="w-[23%] px-4 py-3">{copy.limitHeading}</th>
                  <th className="w-[28%] px-4 py-3">{copy.reviewHeading}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.key} className="align-top">
                    <th className="px-4 py-4 text-sm font-bold leading-5 text-foreground">{row.title}</th>
                    <td className="px-4 py-4">
                      <ul className="space-y-1.5">
                        {row.requirements.map((requirement) => (
                          <li key={requirement} className="text-sm leading-5 text-muted-foreground">• {requirement}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold leading-6 text-primary">{row.limit}</td>
                    <td className="px-4 py-4 text-sm leading-6 text-muted-foreground">{row.access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <article key={row.key} className="rounded-lg border border-border p-4">
                <h4 className="font-bold text-foreground">{row.title}</h4>
                <div className="mt-4 space-y-4">
                  <ReferenceField label={copy.qualificationHeading}>
                    <ul className="space-y-1.5">
                      {row.requirements.map((requirement) => (
                        <li key={requirement} className="text-sm leading-5 text-muted-foreground">• {requirement}</li>
                      ))}
                    </ul>
                  </ReferenceField>
                  <ReferenceField label={copy.limitHeading}>
                    <p className="text-sm font-semibold leading-6 text-primary">{row.limit}</p>
                  </ReferenceField>
                  <ReferenceField label={copy.reviewHeading}>
                    <p className="text-sm leading-6 text-muted-foreground">{row.access}</p>
                  </ReferenceField>
                </div>
              </article>
            ))}
          </div>

          <p className="rounded-lg bg-primary px-4 py-3 text-sm font-medium leading-6 text-primary-foreground">
            {copy.rollingNote}
          </p>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs leading-5 text-muted-foreground">
            {copy.sourceIntro}{" "}
            <a href="https://www.parvisinvest.com/insights/what-is-a-non-accredited-investor" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{copy.parvisSource}</a>
            {" · "}
            <a href={READINESS_RULESET.sources[0]} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{copy.oscSource}</a>
          </p>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="shrink-0">{copy.close}</Button>
          </DialogClose>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function ReferenceField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

type GuideCategory = "entity" | "accredited" | "relationship" | "eligible" | "nonEligible";

// Returns a public, possible-category indicator. Product routes and investment
// amounts are deliberately kept out of this educational guide.
function classifyGuide(guide: GuideState, offering: OfferingBundle): { category: GuideCategory; baseMax: number | null; kind: "manual" } {
  if (guide.investorType === "institution" || guide.investorType === "entity") {
    return { category: "entity", baseMax: null, kind: "manual" };
  }
  const answered = (value: boolean) => value ? "yes" as const : "no" as const;
  const assessment = assessOntarioInvestor({
    jurisdiction: "ontario",
    accountType: "individual",
    answers: {
      "individual-registration": "no",
      "individual-financial-assets": answered(guide.financialAssets === "over1m"),
      "individual-income": answered(guide.income === "over200"),
      "individual-spousal-income": answered(guide.household === "spouse" && guide.householdIncome === "over300"),
      "individual-net-assets": answered(guide.netAssets === "over5m"),
      "eligible-net-assets": answered(guide.netAssets === "over400" || guide.netAssets === "over5m"),
      "eligible-income": answered(guide.income === "over75" || guide.income === "over200"),
      "eligible-spousal-income": answered(guide.household === "spouse" && (guide.householdIncome === "over125" || guide.householdIncome === "over300")),
    },
    offeringCompliance: offering.complianceProfile,
    relationshipClaimed: guide.relationship === "yes",
    relationshipVerified: false,
  });
  if (assessment.result === "potentially-accredited") return { category: "accredited", baseMax: null, kind: "manual" };
  if (assessment.result === "potentially-eligible") return { category: "eligible", baseMax: null, kind: "manual" };
  if (assessment.result === "potentially-non-eligible") return { category: "nonEligible", baseMax: null, kind: "manual" };
  return { category: "relationship", baseMax: null, kind: "manual" };
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
  return (
    <div className="flex flex-col gap-5">
      <FundMapEmbed offering={offering} />
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
