"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { assetClasses, strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import {
  buildFundDetailViewModel,
  formatCurrencyCad,
  formatUnits,
  localizeStatus,
  localizeVerification,
  primaryShareClass,
} from "@/lib/capital/present";
import type { OfferingBundle } from "@/lib/capital/types";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
const CHOICE =
  "rounded-md border px-3 py-2 text-center text-sm font-semibold transition-colors hover:border-primary/60";

function OfferDetailsTab({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const d = t.capitalApp.detail;
  const vm = buildFundDetailViewModel(offering, lang);
  const fields = d.fields as Record<string, string>;
  const managerLogo = vm.logo;

  return (
    <div className="flex flex-col gap-7">
      {vm.summaryTiles.length > 0 && (
        <dl className="grid gap-4 sm:grid-cols-3">
          {vm.summaryTiles.map((tile) => (
            <div key={tile.key} className="grid min-h-36 place-items-center rounded-xl border border-border bg-card px-5 py-7 text-center">
              <div className="flex min-h-20 flex-col items-center justify-center">
                <dd className="text-4xl font-extrabold leading-none tracking-normal text-foreground tabular-nums sm:text-[2.6rem]">
                  {tile.value}
                </dd>
                <dt className="mt-3 text-sm font-medium leading-tight text-muted-foreground">
                  {tile.label}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      )}

      <section className={CARD}>
        <h2 className={cn(H2, "mb-4")}>{d.fundDetailsHeading}</h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {vm.fundDetails.map((r) => (
            <div key={r.key}>
              <dt className="mb-0.5 text-xs text-muted-foreground">{fields[r.key] ?? r.key}</dt>
              <dd className="border-b border-border pb-2 text-[15px] font-semibold text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {vm.trailingReturns.length > 0 && (
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className={H2}>{d.trailingReturns}</h2>
          </div>
          <PerformanceTable rows={vm.trailingReturns} />
        </section>
      )}

      {vm.providers.length > 0 && (
        <section className={CARD}>
          <h2 className={cn(H2, "mb-4")}>{d.providersHeading}</h2>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {vm.providers.map((r) => (
              <div key={r.key} className="rounded-lg border border-border bg-secondary/25 p-4">
                <dt className="mb-0.5 text-xs text-muted-foreground">{fields[r.key] ?? r.key}</dt>
                <dd className="text-[15px] font-semibold text-foreground">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                      {r.value}
                      <ArrowUpRight className="size-3.5" aria-hidden />
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
        <h2 className={cn(H2, "mb-3")}>{d.aboutManager}</h2>
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

function InvestorQualificationGuide({ offering }: { offering: OfferingBundle }) {
  const { lang } = useLang();
  const share = primaryShareClass(offering);
  const fundMinimum = share?.minimumInvestment?.value ?? null;
  const [hasStarted, setHasStarted] = useState(false);
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

  const result = hasStarted ? classifyGuide(guide) : { title: "Not Yet Determined", access: "Complete the guide to see where you may fit.", baseMax: null, kind: "pending" as const };
  const intendedAmount = moneyToNumber(guide.intendedAmount);
  const priorAmount = moneyToNumber(guide.priorAmount);
  const availableEstimate = typeof result.baseMax === "number" ? Math.max(result.baseMax - priorAmount, 0) : null;
  const amountForComparison = intendedAmount || fundMinimum || 0;
  const minimumLabel = fundMinimum ? formatCurrencyCad(fundMinimum, lang) : "Review required";
  const estimatedLabel = availableEstimate !== null ? formatCurrencyCad(availableEstimate, lang) : result.access;

  let fitMessage = "Complete the guide to see where you may fit.";
  if (result.kind === "pending") {
    fitMessage = "Not yet determined.";
  } else if (result.kind === "manual") {
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

  function update<K extends keyof GuideState>(key: K, value: GuideState[K]) {
    setHasStarted(true);
    setGuide((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-32">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Qualification</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">Check your fit</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Answer a few simple questions and compare the result with this fund's minimum.
        </p>

        <div data-testid="qualification-result" className="mt-5 rounded-lg border border-primary/20 bg-secondary/40 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Your status</p>
          <h3 className="mt-1 text-2xl font-bold leading-tight text-foreground">{result.title}</h3>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="rounded-md bg-card p-3">
              <dt className="text-xs font-semibold text-muted-foreground">Fund minimum</dt>
              <dd className="mt-1 text-lg font-bold text-foreground">{minimumLabel}</dd>
            </div>
            <div className="rounded-md bg-card p-3">
              <dt className="text-xs font-semibold text-muted-foreground">Estimated access</dt>
              <dd className="mt-1 text-lg font-bold text-foreground">{estimatedLabel}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-md bg-primary px-3 py-2 text-sm font-bold leading-snug text-primary-foreground">
            {fitMessage}
          </p>
        </div>
      </aside>

      <div className="flex flex-col gap-5">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Step 1</p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">Tell us the basics</h3>
          </div>

          <div className="grid gap-5">
            <ChoiceGroup
              testId="investor-type"
              label="How are you investing?"
              value={guide.investorType}
              options={[
                { value: "personal", label: "Personally" },
                { value: "entity", label: "Corporation / trust" },
                { value: "institution", label: "Institution" },
              ]}
              onChange={(value) => update("investorType", value as GuideState["investorType"])}
            />

            {guide.investorType === "personal" && (
              <>
                <ChoiceGroup
                  testId="household"
                  label="Are you including a spouse?"
                  value={guide.household}
                  options={[
                    { value: "alone", label: "No" },
                    { value: "spouse", label: "Yes" },
                  ]}
                  onChange={(value) => update("household", value as GuideState["household"])}
                />
                <ChoiceGroup
                  testId="income"
                  label="Your annual income"
                  value={guide.income}
                  options={[
                    { value: "under75", label: "Under $75k" },
                    { value: "over75", label: "$75k+" },
                    { value: "over200", label: "$200k+" },
                  ]}
                  onChange={(value) => update("income", value as GuideState["income"])}
                />
                <ChoiceGroup
                  testId="household-income"
                  label="Household income"
                  value={guide.householdIncome}
                  options={[
                    { value: "under125", label: "Under $125k" },
                    { value: "over125", label: "$125k+" },
                    { value: "over300", label: "$300k+" },
                  ]}
                  onChange={(value) => update("householdIncome", value as GuideState["householdIncome"])}
                />
                <ChoiceGroup
                  testId="net-assets"
                  label="Net assets"
                  value={guide.netAssets}
                  options={[
                    { value: "under400", label: "Under $400k" },
                    { value: "over400", label: "$400k+" },
                    { value: "over5m", label: "$5M+" },
                  ]}
                  onChange={(value) => update("netAssets", value as GuideState["netAssets"])}
                />
                <ChoiceGroup
                  testId="financial-assets"
                  label="Financial assets"
                  value={guide.financialAssets}
                  options={[
                    { value: "under1m", label: "Under $1M" },
                    { value: "over1m", label: "$1M+" },
                  ]}
                  onChange={(value) => update("financialAssets", value as GuideState["financialAssets"])}
                />
                <ChoiceGroup
                  testId="relationship"
                  label="Close relationship with the issuer?"
                  value={guide.relationship}
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes" },
                  ]}
                  onChange={(value) => update("relationship", value as GuideState["relationship"])}
                />
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Step 2</p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">Compare the amount</h3>
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
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Reference</p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">Investor type requirements</h3>
          </div>

          <div className="divide-y divide-border rounded-lg border border-border">
            {CATEGORY_SUMMARIES.map((item) => (
              <article key={item.title} className="grid gap-3 p-4 md:grid-cols-[210px_minmax(0,1fr)_190px] md:items-start">
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
    </div>
  );
}

function ChoiceGroup({
  testId,
  label,
  value,
  options,
  onChange,
}: {
  testId: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-testid={`${testId}-${option.value}`}
            className={cn(
              CHOICE,
              option.value === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
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
      <table className="w-full min-w-[520px] table-fixed rounded-lg bg-secondary/25 text-left">
        <thead>
          <tr>
            {rows.map((row) => (
              <th key={row.period} className="px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {row.period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {rows.map((row) => (
              <td key={row.period} className="px-3 pb-2.5 pt-0 text-lg font-bold leading-tight text-foreground">
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
  return (
    <div className="flex flex-col gap-5">
      <FundMapEmbed offering={offering} />
      <div className="flex flex-col gap-2.5">
        {offering.properties.map((property) => {
          const size = formatUnits(property, lang);
          return (
            <article key={property.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-3.5">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">{property.name[lang]}</h3>
                <small className="text-[12.5px] text-muted-foreground">{property.city}, {property.province}</small>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-muted-foreground">
                <span>{taxonomyLabel(assetClasses, property.assetClassId, lang)}</span>
                {size && <span>{size}</span>}
                <span>{localizeStatus(property.status, lang)}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    property.verificationStatus === "verified" && "bg-ok-bg text-ok",
                    property.verificationStatus === "partial" && "bg-warn-bg text-warn",
                    property.verificationStatus === "pending" && "bg-muted text-muted-foreground",
                  )}
                >
                  {localizeVerification(property.verificationStatus, lang)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DocumentsTab({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const dc = t.capitalApp.documents;
  if (!offering.documents.length) return <p className="py-8 text-center text-muted-foreground">{dc.empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{dc.colName}</TableHead>
            <TableHead>{dc.colType}</TableHead>
            <TableHead>{dc.colDate}</TableHead>
            <TableHead>{dc.colAccess}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offering.documents.map((doc) => {
            const isPublic = doc.visibility === "public";
            return (
              <TableRow key={doc.id}>
                <TableCell>
                  <span className="block font-semibold text-foreground">{doc.title[lang]}</span>
                  {doc.description && <small className="text-xs text-muted-foreground">{doc.description[lang]}</small>}
                </TableCell>
                <TableCell className="text-muted-foreground">{dc.types[doc.type]}</TableCell>
                <TableCell className="text-muted-foreground">{doc.effectiveDate}</TableCell>
                <TableCell>
                  {isPublic && doc.href ? (
                    <a href={doc.href} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">{dc.download}</a>
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
      <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">{c.heading}</h2>
      <p className="mb-5 text-[14.5px] leading-relaxed text-muted-foreground">{c.body}</p>
      <div className="flex flex-wrap gap-2.5">
        <Button asChild><Link href={profileHref}>{d.invest}</Link></Button>
        <Button asChild variant="wa"><a href={WHATSAPP} target="_blank" rel="noreferrer">{c.cta}</a></Button>
      </div>
    </div>
  );
}
