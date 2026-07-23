"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { ArrowRight, Building2, ChevronDown, Home, RotateCcw } from "lucide-react";
import {
  computeCashFlow,
  historicalEarnings,
  type CashFlowInputs,
  type FundComparable,
  type FundPeriod,
  type PropertyType,
} from "@/lib/capital/compare-investments";
import type { Lang } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel, money } from "@/components/capital/north/PortalUI";

const NAVY = "#0a2d46";
const GREEN = "#1d6a4f";
const RED = "#a24a3f";

const COPY = {
  en: {
    title: "Compare Investments",
    description: "The monthly cash flow of a rental vs. what the same cash actually earned in an investment.",
    condo: "Condo",
    house: "House",
    reset: "Reset",
    noFunds: "No investment is available to compare right now.",
    investLabel: "Property price",
    investHelp: "Paid in cash by default — this whole amount is what's invested on both sides. Add a mortgage below to finance instead.",
    adjustDetails: "Adjust details",
    showPerformance: "Historical return by year",
    financeMortgage: "Finance with a mortgage",
    payingAllCash: "Paying all cash",
    financingOn: "Financing on",
    fields: {
      downPaymentPct: "Down payment",
      downPaymentAmount: "Down payment ($)",
      monthlyRent: "Monthly rent",
      vacancyPct: "Vacancy / bad debt",
      repairsPct: "Repairs",
      mortgageRatePct: "Mortgage rate",
      condoFeeMonthly: "Condo fee / mo",
      propertyTaxPct: "Property tax",
      insuranceMonthly: "Insurance / mo",
      managementPct: "Management",
      miscMonthly: "Miscellaneous / mo",
      closingCostPct: "Closing cost",
    },
    rental: "Rental property",
    fundLabel: "Investment",
    perMonth: "/mo",
    invested: "invested",
    returnOnCash: "return on cash",
    bestCase: "Always rented · best case",
    lastYear: "Last year",
    yearBefore: "Year before",
    sinceInception: "Since inception",
    historical: "historical return",
    colYear: "Year",
    colReturn: "Return",
    colPerMonth: "Earned / mo",
    pickYear: "Historical return by year — tap to compare",
    cf: {
      rent: "Gross rent",
      vacancy: "Vacancy / bad debt",
      repairs: "Repairs",
      management: "Management",
      condo: "Condo fee",
      tax: "Property tax",
      insurance: "Insurance",
      misc: "Miscellaneous",
      noi: "Net operating income",
      mortgage: "Mortgage",
    },
    verdictFund: "paid",
    verdictMore: "more per month",
    verdictRental: "Rental nets",
    verdictTie: "About the same each month",
    viewFund: "Investment details",
  },
  tr: {
    title: "Yatırımları Karşılaştır",
    description: "Bir kiralığın aylık nakit akışı ile aynı nakdin bir yatırımda gerçekte kazandığı.",
    condo: "Condo",
    house: "Ev",
    reset: "Sıfırla",
    noFunds: "Şu anda karşılaştırılacak bir yatırım yok.",
    investLabel: "Mülk fiyatı",
    investHelp: "Varsayılan olarak nakit ödenir — bu tutarın tamamı her iki tarafta da yatırılır. Finanse etmek için aşağıdan mortgage ekleyin.",
    adjustDetails: "Detayları düzenle",
    showPerformance: "Yıla göre geçmiş getiri",
    financeMortgage: "Mortgage ile finanse et",
    payingAllCash: "Tamamı nakit",
    financingOn: "Finansman açık",
    fields: {
      downPaymentPct: "Peşinat",
      downPaymentAmount: "Peşinat ($)",
      monthlyRent: "Aylık kira",
      vacancyPct: "Boşluk / tahsilat kaybı",
      repairsPct: "Onarımlar",
      mortgageRatePct: "Mortgage faizi",
      condoFeeMonthly: "Aidat / ay",
      propertyTaxPct: "Emlak vergisi",
      insuranceMonthly: "Sigorta / ay",
      managementPct: "Yönetim",
      miscMonthly: "Diğer / ay",
      closingCostPct: "Kapanış masrafı",
    },
    rental: "Kiralık mülk",
    fundLabel: "Yatırım",
    perMonth: "/ay",
    invested: "yatırıldı",
    returnOnCash: "nakit getirisi",
    bestCase: "Her zaman kirada · en iyi senaryo",
    lastYear: "Geçen yıl",
    yearBefore: "Önceki yıl",
    sinceInception: "Kuruluştan bu yana",
    historical: "geçmiş getiri",
    colYear: "Yıl",
    colReturn: "Getiri",
    colPerMonth: "Aylık kazanç",
    pickYear: "Yıla göre geçmiş getiri — karşılaştırmak için dokunun",
    cf: {
      rent: "Brüt kira",
      vacancy: "Boşluk / tahsilat kaybı",
      repairs: "Onarımlar",
      management: "Yönetim",
      condo: "Aidat",
      tax: "Emlak vergisi",
      insurance: "Sigorta",
      misc: "Diğer",
      noi: "Net işletme geliri",
      mortgage: "Mortgage",
    },
    verdictFund: "aylık",
    verdictMore: "daha fazla ödedi",
    verdictRental: "Kiralık aylık",
    verdictTie: "Aylık olarak yaklaşık aynı",
    viewFund: "Yatırım detayları",
  },
} as const;

type Copy = (typeof COPY)["en"] | (typeof COPY)["tr"];

/**
 * The primary input is the property price. All-cash by default, so the price is
 * exactly the cash invested on both sides. `mortgageEnabled` is UI state (the
 * financing section being open), not stored here.
 */
type Inputs = Omit<CashFlowInputs, "propertyType" | "mortgageEnabled">;

/**
 * Sensible present-tense defaults for the general GTA market, underwritten like
 * a real deal, so the tool is useful at a glance with no tuning. Switching
 * property type reloads that type's defaults; each field can still be adjusted
 * under "Adjust details".
 */
const DEFAULTS_BY_TYPE: Record<PropertyType, Inputs> = {
  condo: {
    purchasePrice: 650000,
    downPaymentPct: 20,
    closingCostPct: 1.5,
    mortgageRatePct: 5,
    amortizationYears: 25,
    monthlyRent: 2600,
    vacancyPct: 5,
    repairsPct: 4,
    propertyTaxPct: 0.7,
    insuranceAnnual: 700,
    propertyMgmtPct: 8,
    condoFeeMonthly: 650,
    miscMonthly: 0,
  },
  house: {
    purchasePrice: 900000,
    downPaymentPct: 20,
    closingCostPct: 1.5,
    mortgageRatePct: 5,
    amortizationYears: 25,
    monthlyRent: 3300,
    vacancyPct: 5,
    repairsPct: 8,
    propertyTaxPct: 0.8,
    insuranceAnnual: 1400,
    propertyMgmtPct: 8,
    condoFeeMonthly: 0,
    miscMonthly: 0,
  },
};

function periodLabel(p: FundPeriod, c: Copy): string {
  if (p.role === "last") return p.year ? `${c.lastYear} · ${p.year}` : c.lastYear;
  if (p.role === "prior") return p.year ? `${c.yearBefore} · ${p.year}` : c.yearBefore;
  if (p.role === "inception") return c.sinceInception;
  return p.year ? String(p.year) : c.sinceInception;
}

export function CompareInvestments({ funds }: { funds: FundComparable[] }) {
  const { lang } = useLang();
  const c = pick(COPY, lang) as Copy;
  const posthog = usePostHog();

  const [propertyType, setPropertyType] = useState<PropertyType>("condo");
  const [values, setValues] = useState<Inputs>(DEFAULTS_BY_TYPE.condo);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(false);
  // A mortgage applies only while the financing section is open; closed = all cash.
  const [mortgageOpen, setMortgageOpen] = useState(false);
  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [periodKey, setPeriodKey] = useState(funds[0]?.periods[0]?.key ?? "");

  const fund = funds.find((f) => f.id === fundId) ?? funds[0];
  const period = fund?.periods.find((p) => p.key === periodKey) ?? fund?.periods[0];

  const set = (key: keyof Inputs) => (value: number) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Down payment can also be entered as a dollar amount; both derive from price.
  const downPaymentAmount = Math.round(values.purchasePrice * (values.downPaymentPct / 100));
  const setDownPaymentAmount = (amount: number) =>
    setValues((current) => ({
      ...current,
      downPaymentPct: current.purchasePrice > 0 ? Math.min(100, (amount / current.purchasePrice) * 100) : 0,
    }));

  function selectType(next: PropertyType) {
    setPropertyType(next);
    setValues(DEFAULTS_BY_TYPE[next]);
  }

  function reset() {
    setValues(DEFAULTS_BY_TYPE[propertyType]);
    setMortgageOpen(false);
    posthog?.capture("hnc_compare_reset", { language: lang });
  }

  function selectFund(id: string) {
    setFundId(id);
    setPeriodKey(funds.find((f) => f.id === id)?.periods[0]?.key ?? "");
  }

  const cf = useMemo(
    () => computeCashFlow({ ...values, propertyType, mortgageEnabled: mortgageOpen }),
    [values, propertyType, mortgageOpen],
  );
  // Both sides invest the same cash (cf.initialCash): all-cash it's the price +
  // closing; financed it's the down payment + closing. The fund earns on it.
  const earn = period ? historicalEarnings(cf.initialCash, period.pct) : null;

  const diffMonthly = earn ? earn.monthly - cf.netMonthly : 0;
  const tie = Math.abs(diffMonthly) < 25;
  const fundLeads = diffMonthly > 0;
  const positive = cf.netMonthly >= 0;

  const verdict = tie
    ? c.verdictTie
    : fundLeads
      ? `${tx(fund?.shortName, lang)} ${c.verdictFund} ${money(Math.abs(diffMonthly), lang)} ${c.verdictMore}`
      : `${c.verdictRental} ${money(Math.abs(diffMonthly), lang)} ${c.verdictMore}`;

  return (
    <div>
      <PageHeader title={c.title} description={c.description} />

      {!fund || !earn || !period ? (
        <Panel className="p-8 text-center text-sm text-[#75818a]">{c.noFunds}</Panel>
      ) : (
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            {/* ── Shared invest amount — sits above both cards and drives them together ── */}
            <div className="border-b border-[#e2e8eb] bg-[#f8fafb] px-5 py-4">
              <PrimaryAmountField label={c.investLabel} help={c.investHelp} value={values.purchasePrice} onChange={set("purchasePrice")} />
            </div>

            {/* ── Two aligned columns: investment/fund (left · top) | house · condo (right · bottom) ── */}
            <div className="grid gap-px bg-[#e6ebee] md:grid-cols-2">
              {/* Investment / Fund — leads on the left and on top so the inputs below read as the property's */}
              <section className="flex flex-col bg-white px-5 py-5">
                <div className="flex min-h-9 items-center gap-2">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: GREEN }}>
                    <Building2 className="size-4" />
                  </span>
                  <FundSelect funds={funds} value={fund.id} onChange={selectFund} lang={lang} label={c.fundLabel} />
                </div>
                <HeroCashFlow
                  value={money(earn.monthly, lang)}
                  unit={c.perMonth}
                  color={GREEN}
                  invested={money(cf.initialCash, lang)}
                  investedLabel={c.invested}
                  metricValue={`+${period.pct.toFixed(1)}%`}
                  metricLabel={periodLabel(period, c)}
                />
                <div className="mt-4 border-t border-[#eef2f4] pt-3">
                  <button
                    type="button"
                    onClick={() => setPerfOpen((open) => !open)}
                    aria-expanded={perfOpen}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#40515e] hover:text-[#0a2d46]"
                  >
                    <ChevronDown className={`size-4 transition-transform ${perfOpen ? "rotate-180" : ""}`} />
                    {c.showPerformance}
                  </button>
                  {perfOpen && (
                    <div className="mt-3">
                      <PerformanceTable fund={fund} selectedKey={period.key} onSelect={setPeriodKey} initialCash={cf.initialCash} lang={lang} c={c} />
                    </div>
                  )}
                </div>
                <div className="mt-auto flex justify-end pt-4">
                  <Link href={`${NORTH_BASE}/investments/${fund.slug}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a4b72]">
                    {c.viewFund}
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </section>

              {/* House · Condo — summary then the inputs that drive it, so the controls clearly belong here */}
              <section className="flex flex-col bg-white px-5 py-5">
                <div className="flex min-h-9 items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: NAVY }}>
                    <Home className="size-4" />
                  </span>
                  <p className="text-sm font-semibold text-[#233947]">{c.rental}</p>
                  <span className="ml-auto rounded-full bg-[#f1f5f7] px-2 py-0.5 text-[10px] font-medium text-[#8291a0]">{c.bestCase}</span>
                </div>
                <HeroCashFlow
                  value={money(cf.netMonthly, lang)}
                  unit={c.perMonth}
                  color={positive ? NAVY : RED}
                  invested={money(cf.initialCash, lang)}
                  investedLabel={c.invested}
                  metricValue={`${cf.cashOnCashPct.toFixed(1)}%`}
                  metricLabel={c.returnOnCash}
                />
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#eef2f4] pt-3">
                  <TypeChoice active={propertyType === "condo"} onClick={() => selectType("condo")} icon={<Building2 className="size-4" />} title={c.condo} />
                  <TypeChoice active={propertyType === "house"} onClick={() => selectType("house")} icon={<Home className="size-4" />} title={c.house} />
                </div>

                {/* Underwriting inputs — collapsed until the user wants to fine-tune the deal */}
                <div className="mt-4 border-t border-[#eef2f4] pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDetailsOpen((open) => !open)}
                      aria-expanded={detailsOpen}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#40515e] hover:text-[#0a2d46]"
                    >
                      <ChevronDown className={`size-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
                      {c.adjustDetails}
                    </button>
                    <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607480] hover:text-[#0a2d46]">
                      <RotateCcw className="size-3.5" />
                      {c.reset}
                    </button>
                  </div>
                  {detailsOpen && (
                    <div className="mt-3 space-y-2.5">
                      <NumberField label={c.fields.monthlyRent} prefix="$" value={values.monthlyRent} step={100} onChange={set("monthlyRent")} />
                      <NumberField label={c.fields.vacancyPct} suffix="%" value={values.vacancyPct} step={0.5} max={100} onChange={set("vacancyPct")} />
                      <NumberField label={c.fields.repairsPct} suffix="%" value={values.repairsPct} step={0.5} max={100} onChange={set("repairsPct")} />
                      <NumberField label={c.fields.managementPct} suffix="%" value={values.propertyMgmtPct} step={0.5} max={100} onChange={set("propertyMgmtPct")} />
                      {propertyType === "condo" && <NumberField label={c.fields.condoFeeMonthly} prefix="$" value={values.condoFeeMonthly} step={25} onChange={set("condoFeeMonthly")} />}
                      <NumberField label={c.fields.propertyTaxPct} suffix="%" value={values.propertyTaxPct} step={0.1} max={100} onChange={set("propertyTaxPct")} />
                      <NumberField label={c.fields.insuranceMonthly} prefix="$" value={Math.round(values.insuranceAnnual / 12)} step={10} onChange={(v) => set("insuranceAnnual")(Math.round(v * 12))} />
                      <NumberField label={c.fields.miscMonthly} prefix="$" value={values.miscMonthly} step={25} onChange={set("miscMonthly")} />
                      <NumberField label={c.fields.closingCostPct} suffix="%" value={values.closingCostPct} step={0.1} max={100} onChange={set("closingCostPct")} />
                    </div>
                  )}
                </div>

                {/* Financing — optional toggle. Off = all cash; on = reveal fields and apply a mortgage. */}
                <div className="mt-4 border-t border-[#eef2f4] pt-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={mortgageOpen}
                    onClick={() => setMortgageOpen((open) => !open)}
                    className="flex w-full items-center gap-2.5"
                  >
                    <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${mortgageOpen ? "bg-[#1d6a4f]" : "bg-[#cfd9df]"}`}>
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${mortgageOpen ? "translate-x-4" : "translate-x-0.5"}`} />
                    </span>
                    <span className="text-xs font-semibold text-[#40515e]">{c.financeMortgage}</span>
                    <span className={`ml-auto text-[11px] font-medium ${mortgageOpen ? "text-[#1d6a4f]" : "text-[#93a0a9]"}`}>
                      {mortgageOpen ? c.financingOn : c.payingAllCash}
                    </span>
                  </button>
                  {mortgageOpen && (
                    <div className="mt-3 space-y-2.5">
                      <NumberField label={c.fields.downPaymentPct} suffix="%" value={values.downPaymentPct} step={1} max={100} onChange={set("downPaymentPct")} />
                      <NumberField label={c.fields.downPaymentAmount} prefix="$" value={downPaymentAmount} step={5000} onChange={setDownPaymentAmount} />
                      <NumberField label={c.fields.mortgageRatePct} suffix="%" value={values.mortgageRatePct} step={0.1} onChange={set("mortgageRatePct")} />
                    </div>
                  )}
                </div>

                {/* Underwriting statement: income → operating expenses → NOI → debt service */}
                <dl className="mt-4 space-y-1.5 border-t border-[#eef2f4] pt-3 text-sm">
                  <CashRow label={c.cf.rent} value={`+ ${money(cf.grossRent, lang)}`} />
                  {cf.vacancy > 0 && <CashRow label={c.cf.vacancy} value={`− ${money(cf.vacancy, lang)}`} muted />}
                  {cf.repairs > 0 && <CashRow label={c.cf.repairs} value={`− ${money(cf.repairs, lang)}`} muted />}
                  <CashRow label={c.cf.management} value={`− ${money(cf.management, lang)}`} muted />
                  {propertyType === "condo" && <CashRow label={c.cf.condo} value={`− ${money(cf.condoFee, lang)}`} muted />}
                  <CashRow label={c.cf.tax} value={`− ${money(cf.propertyTax, lang)}`} muted />
                  <CashRow label={c.cf.insurance} value={`− ${money(cf.insurance, lang)}`} muted />
                  {cf.misc > 0 && <CashRow label={c.cf.misc} value={`− ${money(cf.misc, lang)}`} muted />}
                  {mortgageOpen && (
                    <>
                      <CashRow label={c.cf.noi} value={money(cf.noi, lang)} strong />
                      <CashRow label={c.cf.mortgage} value={`− ${money(cf.mortgage, lang)}`} muted />
                    </>
                  )}
                </dl>
              </section>
            </div>

            {/* Shared verdict */}
            <div className="border-t border-[#e2e8eb] bg-[#f8fafb] px-5 py-3 text-center text-sm font-semibold text-[#0a2d46]">
              {verdict}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function HeroCashFlow({
  value,
  unit,
  color,
  invested,
  investedLabel,
  metricValue,
  metricLabel,
}: {
  value: string;
  unit: string;
  color: string;
  invested: string;
  investedLabel: string;
  metricValue: string;
  metricLabel: string;
}) {
  return (
    <div className="mt-5">
      <p className="font-serif text-[2.75rem] font-semibold leading-[0.95] tracking-tight" style={{ color }}>
        {value}
        <span className="ml-1 text-xl font-semibold text-[#9aa5ae]">{unit}</span>
      </p>
      <p className="mt-2.5 text-[13px] leading-snug text-[#6b7883]">
        <span className="font-semibold text-[#40515e]">{invested}</span> {investedLabel}
        <span className="mx-1.5 text-[#c4ced4]">·</span>
        <span className="font-semibold text-[#40515e]">{metricValue}</span> {metricLabel}
      </p>
    </div>
  );
}

/** Small brand logo, matched to the height of the text it sits beside. */
function FundLogo({ src, className = "" }: { src?: string; className?: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`w-auto max-w-9 shrink-0 rounded-[3px] bg-white object-contain ${className}`} />;
}

/**
 * Custom fund picker — a native <select> can't render a logo inside its
 * options, so this lightweight listbox shows each fund's brand mark beside its
 * name, sized to match the title text.
 */
function FundSelect({
  funds,
  value,
  onChange,
  lang,
  label,
}: {
  funds: FundComparable[];
  value: string;
  onChange: (id: string) => void;
  lang: Lang;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = funds.find((f) => f.id === value) ?? funds[0];

  return (
    <div className="relative flex-1">
      <span className="sr-only">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-[#cfd9df] bg-white pl-2.5 pr-8 text-left outline-none focus:border-[#1d6a4f] focus:ring-2 focus:ring-[#1d6a4f]/15"
      >
        <FundLogo src={selected?.logoSrc} className="h-[1.15em]" />
        <span className="truncate text-sm font-semibold text-[#233947]">{tx(selected?.shortName, lang)}</span>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#93a0a9]" />
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute left-0 top-[calc(100%+4px)] z-20 max-h-64 w-full min-w-[200px] overflow-auto rounded-md border border-[#cfd9df] bg-white py-1 shadow-lg"
          >
            {funds.map((f) => {
              const active = f.id === value;
              return (
                <li key={f.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(f.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm ${
                      active ? "bg-[#eaf3ee] font-semibold text-[#1d6a4f]" : "text-[#233947] hover:bg-[#f3f6f8]"
                    }`}
                  >
                    <FundLogo src={f.logoSrc} className="h-[1.15em]" />
                    <span className="truncate">{tx(f.shortName, lang)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function rowLabel(p: FundPeriod, c: Copy): string {
  if (p.role === "inception") return c.sinceInception;
  return p.year ? String(p.year) : c.sinceInception;
}

/**
 * Year-by-year historical returns as a table — the same annual-performance
 * table used on the fund page, so the two surfaces read as one. Each row is a
 * selectable period that drives the comparison above.
 */
function PerformanceTable({
  fund,
  selectedKey,
  onSelect,
  initialCash,
  lang,
  c,
}: {
  fund: FundComparable;
  selectedKey: string;
  onSelect: (key: string) => void;
  initialCash: number;
  lang: Lang;
  c: Copy;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8eb] bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-[#e2e8eb] bg-[#f6f9fa]">
          <tr>
            <th scope="col" className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">{c.colYear}</th>
            <th scope="col" className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">{c.colReturn}</th>
            <th scope="col" className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">{c.colPerMonth}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f4]">
          {fund.periods.map((p) => {
            const active = p.key === selectedKey;
            const monthly = historicalEarnings(initialCash, p.pct).monthly;
            return (
              <tr
                key={p.key}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => onSelect(p.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(p.key);
                  }
                }}
                className={`cursor-pointer transition ${active ? "bg-[#eaf3ee]" : "hover:bg-[#f6f9fa]"}`}
              >
                <th scope="row" className={`px-3 py-2 text-sm font-medium ${active ? "text-[#1d6a4f]" : "text-[#40515e]"}`}>
                  {rowLabel(p, c)}
                </th>
                <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums" style={{ color: active ? GREEN : "#40515e" }}>
                  +{p.pct.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right text-sm tabular-nums text-[#67757f]">{money(monthly, lang)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TypeChoice({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition ${
        active ? "border-[#0a4b72] bg-[#eef4f7] text-[#0a2d46] ring-1 ring-[#0a4b72]/20" : "border-[#d9e1e6] bg-white text-[#40515e] hover:border-[#b8cbd6]"
      }`}
    >
      {icon}
      {title}
    </button>
  );
}

/* ── Comma-grouped numeric input ─────────────────────────────────────────────
 * Native <input type="number"> can't show thousands separators, so these are
 * text inputs that group the integer part with commas as you type. The caret is
 * restored by counting digits from the right, which is stable under grouping. */

/** Group the integer part of a plain numeric string with commas. */
function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a stored number for display (commas, up to a few decimals). */
function formatNumber(value: number, allowDecimal: boolean): string {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", { maximumFractionDigits: allowDecimal ? 4 : 0, useGrouping: true });
}

/** Turn raw keystrokes into a grouped display string + the parsed number. */
function parseInput(raw: string, allowDecimal: boolean): { formatted: string; num: number } {
  let s = raw.replace(/,/g, "");
  s = allowDecimal ? s.replace(/[^\d.]/g, "") : s.replace(/[^\d]/g, "");
  if (allowDecimal) {
    const dot = s.indexOf(".");
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  }
  if (s === "" || s === ".") return { formatted: s, num: 0 };
  const dot = allowDecimal ? s.indexOf(".") : -1;
  const intPart = (dot === -1 ? s : s.slice(0, dot)).replace(/^0+(?=\d)/, "");
  const decPart = dot === -1 ? "" : s.slice(dot);
  return { formatted: group(intPart) + decPart, num: Number(s) };
}

const digitsAfter = (s: string, from: number): number => {
  let n = 0;
  for (let i = from; i < s.length; i++) if (s[i] >= "0" && s[i] <= "9") n++;
  return n;
};

/** Position whose right side holds exactly `digits` digits (caret restore). */
function caretForDigits(s: string, digits: number): number {
  if (digits <= 0) return s.length;
  let count = 0;
  for (let p = s.length - 1; p >= 0; p--) {
    if (s[p] >= "0" && s[p] <= "9" && ++count === digits) return p;
  }
  return 0;
}

function CommaInput({
  value,
  onChange,
  allowDecimal = false,
  min = 0,
  max,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
  className: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const editing = useRef(false);
  const caretTarget = useRef<number | null>(null);
  const [text, setText] = useState(() => formatNumber(value, allowDecimal));

  // Re-sync from the outside only when the field isn't being edited (e.g. reset,
  // property-type switch, or rent scaling driven by the invested amount).
  useEffect(() => {
    if (!editing.current) setText(formatNumber(value, allowDecimal));
  }, [value, allowDecimal]);

  useLayoutEffect(() => {
    if (caretTarget.current === null || !ref.current) return;
    const pos = caretForDigits(text, caretTarget.current);
    ref.current.setSelectionRange(pos, pos);
    caretTarget.current = null;
  }, [text]);

  return (
    <input
      ref={ref}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={text}
      onFocus={() => {
        editing.current = true;
      }}
      onBlur={() => {
        editing.current = false;
        setText(formatNumber(value, allowDecimal));
      }}
      onChange={(e) => {
        const el = e.target;
        caretTarget.current = digitsAfter(el.value, el.selectionStart ?? el.value.length);
        const { formatted, num } = parseInput(el.value, allowDecimal);
        setText(formatted);
        if (!Number.isFinite(num)) return;
        let clamped = Math.max(min, num);
        if (typeof max === "number") clamped = Math.min(max, clamped);
        onChange(clamped);
      }}
      className={className}
    />
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs text-[#526976]">{label}</span>
      <span className="flex w-[128px] shrink-0 items-center rounded-md border border-[#cfd9df] bg-white pl-2.5 focus-within:border-[#0a4b72] focus-within:ring-2 focus-within:ring-[#0a4b72]/15">
        {prefix && <span className="text-xs text-[#93a0a9]">{prefix}</span>}
        <CommaInput
          value={value}
          onChange={onChange}
          allowDecimal={step % 1 !== 0}
          min={min}
          max={max}
          // 16px keeps iOS Safari from zooming in when the field is focused.
          className="h-9 w-full bg-transparent px-1.5 text-right text-[16px] tabular-nums text-[#263f4f] outline-none"
        />
        {suffix && <span className="pr-2.5 text-xs text-[#93a0a9]">{suffix}</span>}
      </span>
    </label>
  );
}

/** The one headline input — the invested amount — shown large and clearly primary. */
function PrimaryAmountField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8291a0]">{label}</span>
      <span className="mt-1.5 flex items-center rounded-lg border border-[#cfd9df] bg-white px-3 focus-within:border-[#0a4b72] focus-within:ring-2 focus-within:ring-[#0a4b72]/15">
        <span className="text-base text-[#93a0a9]">$</span>
        <CommaInput
          value={value}
          onChange={onChange}
          // 17px (≥16) keeps iOS Safari from zooming on focus.
          className="h-11 w-full bg-transparent px-2 text-right text-[17px] font-semibold tabular-nums text-[#0a2d46] outline-none"
        />
      </span>
      {help && <span className="mt-1.5 block text-[11px] leading-4 text-[#93a0a9]">{help}</span>}
    </label>
  );
}

function CashRow({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  if (strong) {
    return (
      <div className="mt-1 flex items-center justify-between border-t border-dashed border-[#dbe2e6] pt-2.5">
        <dt className="font-semibold text-[#233947]">{label}</dt>
        <dd className="font-bold text-[#233947]">{value}</dd>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[#67757f]">{label}</dt>
      <dd className={muted ? "text-[#7c8891]" : "font-medium text-[#40515e]"}>{value}</dd>
    </div>
  );
}

