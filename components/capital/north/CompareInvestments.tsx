"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { ArrowRight, Building2, ChevronDown, Home, RotateCcw, SlidersHorizontal } from "lucide-react";
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
    advanced: "More assumptions",
    noFunds: "No fund is available to compare right now.",
    fields: {
      purchasePrice: "Purchase price",
      downPaymentPct: "Down payment",
      monthlyRent: "Monthly rent",
      mortgageRatePct: "Mortgage rate",
      amortizationYears: "Amortization",
      propertyTaxPct: "Property tax / yr",
      insuranceAnnual: "Insurance / yr",
      propertyMgmtPct: "Management",
      condoFeeMonthly: "Condo fee / mo",
      maintenanceReservePct: "Maintenance / yr",
      closingCostPct: "Closing costs",
    },
    years: "yrs",
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
    tradeoffs: "Trade-offs",
    tradDownsides: ["One property, one location.", "Slow to sell; repairs and vacancies are on you.", "Big buying and selling costs."],
    fundDownsides: ["Past returns, not guaranteed.", "You don't pick the properties.", "Hold periods and fees apply."],
    viewFund: "Fund details",
  },
  tr: {
    title: "Yatırımları Karşılaştır",
    description: "Bir kiralığın aylık nakit akışı ile aynı nakdin bir fonda gerçekte kazandığı.",
    condo: "Condo",
    house: "Ev",
    reset: "Sıfırla",
    advanced: "Diğer varsayımlar",
    noFunds: "Şu anda karşılaştırılacak bir fon yok.",
    fields: {
      purchasePrice: "Satın alma fiyatı",
      downPaymentPct: "Peşinat",
      monthlyRent: "Aylık kira",
      mortgageRatePct: "Mortgage faizi",
      amortizationYears: "Amortisman",
      propertyTaxPct: "Emlak vergisi / yıl",
      insuranceAnnual: "Sigorta / yıl",
      propertyMgmtPct: "Yönetim",
      condoFeeMonthly: "Aidat / ay",
      maintenanceReservePct: "Bakım / yıl",
      closingCostPct: "Kapanış masrafı",
    },
    years: "yıl",
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
    tradeoffs: "Dengeler",
    tradDownsides: ["Tek konumda tek mülk.", "Satışı yavaş; onarım ve boşluklar size ait.", "Yüksek alım-satım masrafları."],
    fundDownsides: ["Geçmiş getiri, garanti değil.", "Mülkleri siz seçmezsiniz.", "Bekleme süreleri ve ücretler geçerli."],
    viewFund: "Fon detayları",
  },
} as const;

type Copy = (typeof COPY)["en"] | (typeof COPY)["tr"];

const DEFAULTS: Omit<CashFlowInputs, "propertyType"> = {
  purchasePrice: 500000,
  downPaymentPct: 20,
  closingCostPct: 1.5,
  mortgageRatePct: 5,
  amortizationYears: 25,
  monthlyRent: 2500,
  propertyTaxPct: 0.8,
  insuranceAnnual: 900,
  propertyMgmtPct: 8,
  condoFeeMonthly: 550,
  maintenanceReservePct: 1,
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
  const [values, setValues] = useState(DEFAULTS);
  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [periodKey, setPeriodKey] = useState(funds[0]?.periods[0]?.key ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fund = funds.find((f) => f.id === fundId) ?? funds[0];
  const period = fund?.periods.find((p) => p.key === periodKey) ?? fund?.periods[0];

  const set = (key: keyof typeof DEFAULTS) => (value: number) =>
    setValues((current) => ({ ...current, [key]: value }));

  function reset() {
    setValues(DEFAULTS);
    setPropertyType("condo");
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
            {/* ── Summary band: identity, amount invested, monthly cash flow (aligned rows) ── */}
            <div className="grid gap-px bg-[#e6ebee] md:grid-cols-2">
              {/* Rental */}
              <div className="bg-white px-5 py-5">
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
              </div>

              {/* Fund */}
              <div className="bg-white px-5 py-5">
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
              </div>
            </div>

            {/* ── Detail band: rental controls | fund performance ── */}
            <div className="grid gap-px border-t border-[#e2e8eb] bg-[#e6ebee] md:grid-cols-2">
              {/* Rental controls + breakdown */}
              <section className="flex flex-col bg-white px-5 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <TypeChoice active={propertyType === "condo"} onClick={() => setPropertyType("condo")} icon={<Building2 className="size-4" />} title={c.condo} />
                  <TypeChoice active={propertyType === "house"} onClick={() => setPropertyType("house")} icon={<Home className="size-4" />} title={c.house} />
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607480] hover:text-[#0a2d46]">
                    <RotateCcw className="size-3.5" />
                    {c.reset}
                  </button>
                </div>
                <div className="mt-1 space-y-2.5">
                  <NumberField label={c.fields.purchasePrice} prefix="$" value={values.purchasePrice} step={10000} onChange={set("purchasePrice")} />
                  <NumberField label={c.fields.downPaymentPct} suffix="%" value={values.downPaymentPct} step={1} onChange={set("downPaymentPct")} />
                  <NumberField label={c.fields.monthlyRent} prefix="$" value={values.monthlyRent} step={100} onChange={set("monthlyRent")} />
                  <NumberField label={c.fields.mortgageRatePct} suffix="%" value={values.mortgageRatePct} step={0.1} onChange={set("mortgageRatePct")} />
                  {propertyType === "condo" && <NumberField label={c.fields.condoFeeMonthly} prefix="$" value={values.condoFeeMonthly} step={25} onChange={set("condoFeeMonthly")} />}
                </div>
                <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4b72]">
                  <SlidersHorizontal className="size-3.5" />
                  {c.advanced}
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-2.5 border-t border-[#e6ebee] pt-3">
                    <NumberField label={c.fields.amortizationYears} suffix={c.years} value={values.amortizationYears} step={1} min={1} max={35} onChange={set("amortizationYears")} />
                    <NumberField label={c.fields.propertyTaxPct} suffix="%" value={values.propertyTaxPct} step={0.05} onChange={set("propertyTaxPct")} />
                    <NumberField label={c.fields.insuranceAnnual} prefix="$" value={values.insuranceAnnual} step={100} onChange={set("insuranceAnnual")} />
                    <NumberField label={c.fields.propertyMgmtPct} suffix="%" value={values.propertyMgmtPct} step={0.5} onChange={set("propertyMgmtPct")} />
                    {propertyType === "house" && <NumberField label={c.fields.maintenanceReservePct} suffix="%" value={values.maintenanceReservePct} step={0.25} onChange={set("maintenanceReservePct")} />}
                    <NumberField label={c.fields.closingCostPct} suffix="%" value={values.closingCostPct} step={0.25} onChange={set("closingCostPct")} />
                  </div>
                )}
                <dl className="mt-4 space-y-1.5 border-t border-[#eef2f4] pt-3 text-sm">
                  <CashRow label={c.cf.rent} value={`+ ${money(cf.grossRent, lang)}`} />
                  <CashRow label={c.cf.mortgage} value={`− ${money(cf.mortgage, lang)}`} muted />
                  {propertyType === "condo" && <CashRow label={c.cf.condo} value={`− ${money(cf.condoFee, lang)}`} muted />}
                  {propertyType === "house" && <CashRow label={c.cf.maintenance} value={`− ${money(cf.maintenance, lang)}`} muted />}
                  <CashRow label={c.cf.tax} value={`− ${money(cf.propertyTax, lang)}`} muted />
                  <CashRow label={c.cf.insurance} value={`− ${money(cf.insurance, lang)}`} muted />
                  <CashRow label={c.cf.management} value={`− ${money(cf.management, lang)}`} muted />
                </dl>
                <TradeOffs className="mt-auto pt-4" label={c.tradeoffs} items={c.tradDownsides} tone="property" />
              </section>

              {/* Fund performance */}
              <section className="flex flex-col bg-white px-5 py-4">
                <p className="text-[11px] font-medium text-[#93a0a9]">{c.pickYear}</p>
                <PerformanceSelector fund={fund} selectedKey={period.key} onSelect={setPeriodKey} initialCash={cf.initialCash} lang={lang} c={c} />
                <TradeOffs
                  className="mt-auto pt-4"
                  label={c.tradeoffs}
                  items={c.fundDownsides}
                  tone="fund"
                  action={
                    <Link href={`${NORTH_BASE}/funds/${fund.slug}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a4b72]">
                      {c.viewFund}
                      <ArrowRight className="size-3" />
                    </Link>
                  }
                />
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
  return (
    <label className="relative flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-[#cfd9df] bg-white pl-3 pr-8 text-sm font-semibold text-[#233947] outline-none focus:border-[#1d6a4f] focus:ring-2 focus:ring-[#1d6a4f]/15"
      >
        {funds.map((f) => (
          <option key={f.id} value={f.id}>
            {tx(f.shortName, lang)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#93a0a9]" />
    </label>
  );
}

function PerformanceSelector({
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
  const years = fund.periods.filter((p) => p.role !== "inception");
  const inception = fund.periods.find((p) => p.role === "inception");
  const maxPct = Math.max(...years.map((p) => p.pct), 1);

  return (
    <div className="mt-2.5">
      <div className="flex items-end gap-1">
        {years.map((p) => {
          const active = p.key === selectedKey;
          const height = 14 + (Math.max(p.pct, 0) / maxPct) * 46;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect(p.key)}
              title={`${p.year}: +${p.pct.toFixed(1)}% · ${money(historicalEarnings(initialCash, p.pct).monthly, lang)}${c.perMonth}`}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span className={`text-[10px] font-semibold ${active ? "text-[#1d6a4f]" : "text-transparent group-hover:text-[#9aa5ae]"}`}>
                {p.pct.toFixed(1)}%
              </span>
              <span className="w-full rounded-t transition" style={{ height, backgroundColor: active ? GREEN : "#d5e4dc" }} />
              <span className={`text-[10px] ${active ? "font-semibold text-[#233947]" : "text-[#93a0a9]"}`}>{p.year}</span>
            </button>
          );
        })}
      </div>
      {inception && (
        <button
          type="button"
          onClick={() => onSelect(inception.key)}
          className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
            inception.key === selectedKey ? "border-[#1d6a4f] bg-[#eaf3ee] text-[#1d6a4f]" : "border-[#d9e1e6] text-[#67757f] hover:border-[#b8cbd6]"
          }`}
        >
          {c.sinceInception} · +{inception.pct.toFixed(1)}%
        </button>
      )}
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
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const next = e.target.value === "" ? 0 : Number(e.target.value);
            if (!Number.isFinite(next)) return;
            let clamped = Math.max(min, next);
            if (typeof max === "number") clamped = Math.min(max, clamped);
            onChange(clamped);
          }}
          className="h-9 w-full bg-transparent px-1.5 text-right text-sm text-[#263f4f] outline-none"
        />
        {suffix && <span className="pr-2.5 text-xs text-[#93a0a9]">{suffix}</span>}
      </span>
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

function TradeOffs({
  label,
  items,
  tone,
  className = "",
  action,
}: {
  label: string;
  items: readonly string[];
  tone: "property" | "fund";
  className?: string;
  action?: React.ReactNode;
}) {
  const dot = tone === "property" ? NAVY : GREEN;
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93a0a9]">{label}</p>
        {action}
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-4 text-[#6b7883]">
            <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
