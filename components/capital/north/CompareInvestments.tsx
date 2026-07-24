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
import { Panel, money } from "@/components/capital/north/PortalUI";
import {
  FundSelect,
  HeroCashFlow,
  NumberField,
  PrimaryAmountField,
  ToolHeader,
} from "@/components/capital/north/CompareUI";

const NAVY = "#0a2d46";
const GREEN = "#1d6a4f";
const RED = "#a24a3f";

const COPY = {
  en: {
    title: "Passive vs. Active",
    description: "An investment fund vs. rental property — the monthly cash flow of a rental against what the same cash actually earned in a fund.",
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
    averageOfYears: "Average of published years",
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
    title: "Pasif ve Aktif",
    description: "Yatırım fonu ile kiralık mülk — bir kiralığın aylık nakit akışı ile aynı nakdin bir fonda gerçekte kazandığı.",
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
    averageOfYears: "Yayımlanan yılların ortalaması",
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
  if (p.role === "inception") return p.derived ? c.averageOfYears : c.sinceInception;
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
      <ToolHeader title={c.title} subtitle={c.description} />

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

function rowLabel(p: FundPeriod, c: Copy): string {
  if (p.role === "inception") return p.derived ? c.averageOfYears : c.sinceInception;
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

