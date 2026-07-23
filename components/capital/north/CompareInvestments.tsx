"use client";

import { useMemo, useState } from "react";
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
    description: "The monthly cash flow of a rental vs. what the same cash actually earned in a fund.",
    condo: "Condo",
    house: "House",
    reset: "Reset",
    noFunds: "No fund is available to compare right now.",
    investLabel: "How much to invest",
    investHelp: "Property price — everything below is pre-filled with typical GTA figures.",
    adjustDetails: "Adjust details",
    fields: {
      purchasePrice: "Purchase price",
      downPaymentPct: "Down payment",
      monthlyRent: "Monthly rent",
      mortgageRatePct: "Mortgage rate",
      condoFeeMonthly: "Condo fee / mo",
    },
    amountInvested: "Amount invested",
    monthlyCashFlow: "Monthly cash flow",
    rental: "Rental property",
    fundLabel: "Fund",
    perMonth: "/mo",
    perYear: "/yr",
    invested: "invested",
    returnOnCash: "return on cash",
    sameCash: "Same cash as the property",
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
      rent: "Rent",
      mortgage: "Mortgage",
      condo: "Condo fee",
      maintenance: "Maintenance",
      tax: "Property tax",
      insurance: "Insurance",
      management: "Management",
    },
    verdictFund: "paid",
    verdictMore: "more per month",
    verdictRental: "Rental nets",
    verdictTie: "About the same each month",
    viewFund: "Fund details",
  },
  tr: {
    title: "Yatırımları Karşılaştır",
    description: "Bir kiralığın aylık nakit akışı ile aynı nakdin bir fonda gerçekte kazandığı.",
    condo: "Condo",
    house: "Ev",
    reset: "Sıfırla",
    noFunds: "Şu anda karşılaştırılacak bir fon yok.",
    investLabel: "Ne kadar yatırım",
    investHelp: "Mülk fiyatı — aşağıdaki her şey tipik GTA değerleriyle dolduruldu.",
    adjustDetails: "Detayları düzenle",
    fields: {
      purchasePrice: "Satın alma fiyatı",
      downPaymentPct: "Peşinat",
      monthlyRent: "Aylık kira",
      mortgageRatePct: "Mortgage faizi",
      condoFeeMonthly: "Aidat / ay",
    },
    amountInvested: "Yatırılan tutar",
    monthlyCashFlow: "Aylık nakit akışı",
    rental: "Kiralık mülk",
    fundLabel: "Fon",
    perMonth: "/ay",
    perYear: "/yıl",
    invested: "yatırıldı",
    returnOnCash: "nakit getirisi",
    sameCash: "Mülkle aynı nakit",
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
      rent: "Kira",
      mortgage: "Mortgage",
      condo: "Aidat",
      maintenance: "Bakım",
      tax: "Emlak vergisi",
      insurance: "Sigorta",
      management: "Yönetim",
    },
    verdictFund: "aylık",
    verdictMore: "daha fazla ödedi",
    verdictRental: "Kiralık aylık",
    verdictTie: "Aylık olarak yaklaşık aynı",
    viewFund: "Fon detayları",
  },
} as const;

type Copy = (typeof COPY)["en"] | (typeof COPY)["tr"];

type Inputs = Omit<CashFlowInputs, "propertyType">;

/**
 * Sensible present-tense defaults for the general GTA market, so the tool is
 * useful at a glance with no tuning. Switching property type reloads that
 * type's defaults; each field can still be adjusted under "Adjust details".
 */
const DEFAULTS_BY_TYPE: Record<PropertyType, Inputs> = {
  condo: {
    purchasePrice: 650000,
    downPaymentPct: 20,
    closingCostPct: 1.5,
    mortgageRatePct: 5,
    amortizationYears: 25,
    monthlyRent: 2600,
    propertyTaxPct: 0.7,
    insuranceAnnual: 700,
    propertyMgmtPct: 8,
    condoFeeMonthly: 650,
    maintenanceReservePct: 1,
  },
  house: {
    purchasePrice: 900000,
    downPaymentPct: 20,
    closingCostPct: 1.5,
    mortgageRatePct: 5,
    amortizationYears: 25,
    monthlyRent: 3300,
    propertyTaxPct: 0.8,
    insuranceAnnual: 1400,
    propertyMgmtPct: 8,
    condoFeeMonthly: 0,
    maintenanceReservePct: 1,
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
  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [periodKey, setPeriodKey] = useState(funds[0]?.periods[0]?.key ?? "");

  const fund = funds.find((f) => f.id === fundId) ?? funds[0];
  const period = fund?.periods.find((p) => p.key === periodKey) ?? fund?.periods[0];

  const set = (key: keyof Inputs) => (value: number) =>
    setValues((current) => ({ ...current, [key]: value }));

  function selectType(next: PropertyType) {
    setPropertyType(next);
    setValues(DEFAULTS_BY_TYPE[next]);
  }

  function reset() {
    setValues(DEFAULTS_BY_TYPE[propertyType]);
    posthog?.capture("hnc_compare_reset", { language: lang });
  }

  function selectFund(id: string) {
    setFundId(id);
    setPeriodKey(funds.find((f) => f.id === id)?.periods[0]?.key ?? "");
  }

  const cf = useMemo(() => computeCashFlow({ ...values, propertyType }), [values, propertyType]);
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
                  <p className="mb-2.5 text-[11px] font-medium text-[#93a0a9]">{c.pickYear}</p>
                  <PerformanceTable fund={fund} selectedKey={period.key} onSelect={setPeriodKey} initialCash={cf.initialCash} lang={lang} c={c} />
                </div>
                <div className="mt-auto flex justify-end pt-4">
                  <Link href={`${NORTH_BASE}/funds/${fund.slug}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a4b72]">
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

                {/* Primary input — the one number most people set; the rest is pre-filled and tucked away */}
                <div className="mt-4">
                  <PrimaryAmountField label={c.investLabel} help={c.investHelp} value={values.purchasePrice} step={10000} onChange={set("purchasePrice")} />
                </div>

                {/* Everything else defaults to GTA norms and stays collapsed until the user wants to fine-tune */}
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
                      <NumberField label={c.fields.downPaymentPct} suffix="%" value={values.downPaymentPct} step={1} onChange={set("downPaymentPct")} />
                      <NumberField label={c.fields.monthlyRent} prefix="$" value={values.monthlyRent} step={100} onChange={set("monthlyRent")} />
                      <NumberField label={c.fields.mortgageRatePct} suffix="%" value={values.mortgageRatePct} step={0.1} onChange={set("mortgageRatePct")} />
                      {propertyType === "condo" && <NumberField label={c.fields.condoFeeMonthly} prefix="$" value={values.condoFeeMonthly} step={25} onChange={set("condoFeeMonthly")} />}
                    </div>
                  )}
                </div>
                <dl className="mt-4 space-y-1.5 border-t border-[#eef2f4] pt-3 text-sm">
                  <CashRow label={c.cf.rent} value={`+ ${money(cf.grossRent, lang)}`} />
                  <CashRow label={c.cf.mortgage} value={`− ${money(cf.mortgage, lang)}`} muted />
                  {propertyType === "condo" && <CashRow label={c.cf.condo} value={`− ${money(cf.condoFee, lang)}`} muted />}
                  {propertyType === "house" && <CashRow label={c.cf.maintenance} value={`− ${money(cf.maintenance, lang)}`} muted />}
                  <CashRow label={c.cf.tax} value={`− ${money(cf.propertyTax, lang)}`} muted />
                  <CashRow label={c.cf.insurance} value={`− ${money(cf.insurance, lang)}`} muted />
                  <CashRow label={c.cf.management} value={`− ${money(cf.management, lang)}`} muted />
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
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={min}
          max={max}
          // Select the whole value on focus so the first keystroke replaces it
          // (no more typing to the right of a stranded 0).
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const next = e.target.value === "" ? 0 : Number(e.target.value);
            if (!Number.isFinite(next)) return;
            let clamped = Math.max(min, next);
            if (typeof max === "number") clamped = Math.min(max, clamped);
            onChange(clamped);
          }}
          // 16px keeps iOS Safari from zooming in when the field is focused.
          className="h-9 w-full bg-transparent px-1.5 text-right text-[16px] text-[#263f4f] outline-none"
        />
        {suffix && <span className="pr-2.5 text-xs text-[#93a0a9]">{suffix}</span>}
      </span>
    </label>
  );
}

/** The one headline input — property price — shown large and clearly primary. */
function PrimaryAmountField({
  label,
  help,
  value,
  onChange,
  step = 1000,
}: {
  label: string;
  help?: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8291a0]">{label}</span>
      <span className="mt-1.5 flex items-center rounded-lg border border-[#cfd9df] bg-white px-3 focus-within:border-[#0a4b72] focus-within:ring-2 focus-within:ring-[#0a4b72]/15">
        <span className="text-base text-[#93a0a9]">$</span>
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={0}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const next = e.target.value === "" ? 0 : Number(e.target.value);
            if (!Number.isFinite(next)) return;
            onChange(Math.max(0, next));
          }}
          // 17px (≥16) keeps iOS Safari from zooming on focus.
          className="h-11 w-full bg-transparent px-2 text-right text-[17px] font-semibold tabular-nums text-[#0a2d46] outline-none"
        />
      </span>
      {help && <span className="mt-1.5 block text-[11px] leading-4 text-[#93a0a9]">{help}</span>}
    </label>
  );
}

function CashRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[#67757f]">{label}</dt>
      <dd className={muted ? "text-[#7c8891]" : "font-medium text-[#40515e]"}>{value}</dd>
    </div>
  );
}

