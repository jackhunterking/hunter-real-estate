"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  historicalEarnings,
  type FundComparable,
  type FundPeriod,
} from "@/lib/capital/compare-investments";
import { alignFundPeriods, belowMinimum, inceptionYear, type AlignedPeriod } from "@/lib/capital/compare-funds";
import type { Lang, LocalizedText } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { Panel, money } from "@/components/capital/north/PortalUI";
import { DisclosureBar } from "@/components/capital/north/DisclosureBar";
import { FundSelect, HeroCashFlow, PrimaryAmountField, ToolHeader } from "@/components/capital/north/CompareUI";

const BLUE = "#0a4b72";
const GREEN = "#1d6a4f";

const COPY = {
  en: {
    title: "Passive vs. Passive",
    description: "One fund against another, on the same cash. Every figure is a return the fund published — nothing here is a projection.",
    tooFewFunds: "At least two investments with published history are needed to compare.",
    amountLabel: "Amount invested",
    amountHelp: "The same cash is placed in each fund, so the two sides are directly comparable.",
    fundA: "First investment",
    fundB: "Second investment",
    perMonth: "/mo",
    invested: "invested",
    notPublished: "Not published",
    noFigure: "no figure for this period",
    belowMinimum: "Below this fund's minimum of",
    asOf: "As of",
    viewFund: "Investment details",
    colPeriod: "Period",
    colReturn: "Return",
    colPerMonth: "Earned / mo",
    sinceInception: "Since inception",
    averageOfYears: "Average of published years",
    since: "since",
    derivedTag: "avg.",
    derivedNote: "avg. — our average of the years this fund published, not a since-inception figure the fund itself publishes.",
    tableCaption: "Published returns by period — tap a row to compare it",
    termsTitle: "Published terms",
    terms: {
      minimum: "Minimum investment",
      targetReturn: "Target return",
      targetDistribution: "Target distribution",
      distributionFrequency: "Distribution frequency",
      term: "Investment term",
      redemption: "Redemptions",
      managementFee: "Management fee",
      riskProfile: "Risk profile",
      registered: "Registered accounts",
      aum: "Assets under management",
    },
    diff: "On {amount}, the {period} published returns differ by {difference} / mo.",
    onlyOne: "Only {fund} published a return for {period}.",
    noPrediction: "Past returns are not a prediction of future results. Educational information only — not advice.",
  },
  tr: {
    title: "Pasif ve Pasif",
    description: "Aynı nakitle iki fonun karşılaştırması. Her rakam fonun yayımladığı bir getiridir — burada öngörü yoktur.",
    tooFewFunds: "Karşılaştırma için yayımlanmış geçmişi olan en az iki yatırım gerekir.",
    amountLabel: "Yatırılan tutar",
    amountHelp: "Aynı nakit her iki fona da yerleştirilir; böylece iki taraf doğrudan karşılaştırılabilir.",
    fundA: "Birinci yatırım",
    fundB: "İkinci yatırım",
    perMonth: "/ay",
    invested: "yatırıldı",
    notPublished: "Yayımlanmadı",
    noFigure: "bu dönem için rakam yok",
    belowMinimum: "Bu fonun minimumunun altında:",
    asOf: "Veri tarihi",
    viewFund: "Yatırım detayları",
    colPeriod: "Dönem",
    colReturn: "Getiri",
    colPerMonth: "Aylık kazanç",
    sinceInception: "Kuruluştan bu yana",
    averageOfYears: "Yayımlanan yılların ortalaması",
    since: "başlangıç",
    derivedTag: "ort.",
    derivedNote: "ort. — bu fonun yayımladığı yılların bizim hesapladığımız ortalamasıdır; fonun kendi yayımladığı kuruluştan bu yana getirisi değildir.",
    tableCaption: "Döneme göre yayımlanan getiriler — karşılaştırmak için bir satıra dokunun",
    termsTitle: "Yayımlanan koşullar",
    terms: {
      minimum: "Minimum yatırım",
      targetReturn: "Hedef getiri",
      targetDistribution: "Hedef dağıtım",
      distributionFrequency: "Dağıtım sıklığı",
      term: "Yatırım süresi",
      redemption: "Para çekme",
      managementFee: "Yönetim ücreti",
      riskProfile: "Risk profili",
      registered: "Kayıtlı hesaplar",
      aum: "Yönetilen varlıklar",
    },
    diff: "{amount} üzerinden, {period} dönemi için yayımlanan getiriler arasındaki fark aylık {difference}.",
    onlyOne: "{period} dönemi için yalnızca {fund} getiri yayımladı.",
    noPrediction: "Geçmiş getiriler gelecekteki sonuçların göstergesi değildir. Yalnızca eğitim amaçlıdır; tavsiye değildir.",
  },
} as const;

type Copy = (typeof COPY)["en"] | (typeof COPY)["tr"];

const DEFAULT_AMOUNT = 100000;

function periodTitle(row: AlignedPeriod, c: Copy): string {
  if (row.kind === "year") return String(row.year);
  // "Since inception" only when at least one side actually published one.
  const published = (row.a && !row.a.derived) || (row.b && !row.b.derived);
  return published ? c.sinceInception : c.averageOfYears;
}

/** The newest row both funds published — the most defensible default. */
function defaultRowKey(rows: AlignedPeriod[]): string {
  return (rows.find((row) => row.a && row.b) ?? rows[0])?.key ?? "";
}

export function CompareFunds({ funds }: { funds: FundComparable[] }) {
  const { lang } = useLang();
  const c = pick(COPY, lang) as Copy;
  const posthog = usePostHog();

  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [aId, setAId] = useState(funds[0]?.id ?? "");
  const [bId, setBId] = useState(funds[1]?.id ?? "");

  const fundA = funds.find((f) => f.id === aId) ?? funds[0];
  const fundB = funds.find((f) => f.id === bId) ?? funds[1];

  const rows = useMemo(
    () => (fundA && fundB ? alignFundPeriods(fundA, fundB) : []),
    [fundA, fundB],
  );

  const [rowKey, setRowKey] = useState(() => defaultRowKey(rows));
  const row = rows.find((r) => r.key === rowKey) ?? rows[0];

  /** Picking the fund already shown on the other side swaps them rather than duplicating. */
  function selectFund(side: "a" | "b", id: string) {
    const otherId = side === "a" ? bId : aId;
    let nextA = aId;
    let nextB = bId;
    if (id === otherId) {
      nextA = bId;
      nextB = aId;
    } else if (side === "a") {
      nextA = id;
    } else {
      nextB = id;
    }
    setAId(nextA);
    setBId(nextB);

    // The new pair may not publish the period that was selected; fall back to
    // the newest period they share rather than leaving an empty comparison.
    const a = funds.find((f) => f.id === nextA);
    const b = funds.find((f) => f.id === nextB);
    if (a && b) {
      const next = alignFundPeriods(a, b);
      if (!next.some((r) => r.key === rowKey)) setRowKey(defaultRowKey(next));
    }

    posthog?.capture("hnc_fund_compare_fund_selected", {
      language: lang,
      slug: funds.find((f) => f.id === id)?.slug,
      side,
    });
  }

  function selectRow(key: string) {
    setRowKey(key);
    posthog?.capture("hnc_fund_compare_period_selected", { language: lang, period_key: key });
  }

  if (!fundA || !fundB || !row) {
    return (
      <div>
        <ToolHeader title={c.title} subtitle={c.description} />
        <Panel className="p-8 text-center text-sm text-[#75818a]">{c.tooFewFunds}</Panel>
      </div>
    );
  }

  const earnA = row.a ? historicalEarnings(amount, row.a.pct) : null;
  const earnB = row.b ? historicalEarnings(amount, row.b.pct) : null;
  const period = periodTitle(row, c);

  const verdict = earnA && earnB
    ? c.diff
        .replace("{amount}", money(amount, lang))
        .replace("{period}", period)
        .replace("{difference}", money(Math.abs(earnB.monthly - earnA.monthly), lang))
    : c.onlyOne
        .replace("{fund}", tx((earnA ? fundA : fundB).shortName, lang))
        .replace("{period}", period);

  return (
    <div>
      <ToolHeader title={c.title} subtitle={c.description} />

      <div className="space-y-4">
        <Panel className="overflow-hidden">
          {/* ── Shared invested amount — drives both sides at once ── */}
          <div className="border-b border-[#e2e8eb] bg-[#f8fafb] px-5 py-4">
            <PrimaryAmountField label={c.amountLabel} help={c.amountHelp} value={amount} onChange={setAmount} />
          </div>

          {/* ── The two funds, side by side on the same cash ── */}
          <div className="grid gap-px bg-[#e6ebee] md:grid-cols-2">
            <FundColumn
              fund={fundA}
              funds={funds}
              onSelect={(id) => selectFund("a", id)}
              label={c.fundA}
              accent={BLUE}
              earnings={earnA}
              period={row.a}
              amount={amount}
              lang={lang}
              c={c}
            />
            <FundColumn
              fund={fundB}
              funds={funds}
              onSelect={(id) => selectFund("b", id)}
              label={c.fundB}
              accent={GREEN}
              earnings={earnB}
              period={row.b}
              amount={amount}
              lang={lang}
              c={c}
            />
          </div>

          {/* ── Aligned periods. A fund that didn't publish a period shows a dash. ── */}
          <div className="border-t border-[#e2e8eb] px-5 py-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8291a0]">{c.tableCaption}</p>
            <AlignedTable
              rows={rows}
              selectedKey={row.key}
              onSelect={selectRow}
              fundA={fundA}
              fundB={fundB}
              amount={amount}
              lang={lang}
              c={c}
            />
          </div>

          {/* Neutral statement of the gap — this portal distributes both products. */}
          <div className="border-t border-[#e2e8eb] bg-[#f8fafb] px-5 py-3 text-center">
            <p className="text-sm font-semibold text-[#0a2d46]">{verdict}</p>
            <p className="mt-1 text-[11px] leading-4 text-[#8291a0]">{c.noPrediction}</p>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <h2 className="border-b border-[#e2e8eb] bg-[#f8fafb] px-5 py-3 text-sm font-semibold text-[#233947]">{c.termsTitle}</h2>
          <TermsTable fundA={fundA} fundB={fundB} lang={lang} c={c} />
        </Panel>

        <DisclosureBar coBrand={false} className="px-1" />
      </div>
    </div>
  );
}

function FundColumn({
  fund,
  funds,
  onSelect,
  label,
  accent,
  earnings,
  period,
  amount,
  lang,
  c,
}: {
  fund: FundComparable;
  funds: FundComparable[];
  onSelect: (id: string) => void;
  label: string;
  accent: string;
  earnings: { monthly: number } | null;
  period: FundPeriod | null;
  amount: number;
  lang: Lang;
  c: Copy;
}) {
  const under = belowMinimum(fund, amount);
  return (
    <section className="flex flex-col bg-white px-5 py-5">
      <div className="flex min-h-9 items-center gap-2">
        <FundSelect
          funds={funds}
          value={fund.id}
          onChange={onSelect}
          lang={lang}
          label={label}
          focusClass={accent === BLUE ? "focus:border-[#0a4b72] focus:ring-2 focus:ring-[#0a4b72]/15" : "focus:border-[#1d6a4f] focus:ring-2 focus:ring-[#1d6a4f]/15"}
          activeClass={accent === BLUE ? "bg-[#eef4f7] font-semibold text-[#0a4b72]" : "bg-[#eaf3ee] font-semibold text-[#1d6a4f]"}
        />
      </div>

      {earnings && period ? (
        <HeroCashFlow
          value={money(earnings.monthly, lang)}
          unit={c.perMonth}
          color={accent}
          invested={money(amount, lang)}
          investedLabel={c.invested}
          metricValue={`${period.pct >= 0 ? "+" : ""}${period.pct.toFixed(1)}%`}
          metricLabel={c.colReturn.toLowerCase()}
        />
      ) : (
        <div className="mt-5">
          <p className="font-serif text-[2.75rem] font-semibold leading-[0.95] tracking-tight text-[#b3bec5]">{c.notPublished}</p>
          <p className="mt-2.5 text-[13px] leading-snug text-[#8f9aa2]">
            {tx(fund.shortName, lang)} — {c.noFigure}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#eef2f4] pt-3">
        {fund.dataPeriodLabel && (
          <span className="rounded-full bg-[#f1f5f7] px-2 py-0.5 text-[10px] font-medium text-[#7a8790]">
            {c.asOf} {fund.dataPeriodLabel}
          </span>
        )}
        {under && fund.minimumInvestment !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf2ec] px-2 py-0.5 text-[10px] font-semibold text-[#a24a3f]">
            <AlertTriangle className="size-3" />
            {c.belowMinimum} {money(fund.minimumInvestment, lang)}
          </span>
        )}
        <Link
          href={`${NORTH_BASE}/investments/${fund.slug}`}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a4b72]"
        >
          {c.viewFund}
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}

function AlignedTable({
  rows,
  selectedKey,
  onSelect,
  fundA,
  fundB,
  amount,
  lang,
  c,
}: {
  rows: AlignedPeriod[];
  selectedKey: string;
  onSelect: (key: string) => void;
  fundA: FundComparable;
  fundB: FundComparable;
  amount: number;
  lang: Lang;
  c: Copy;
}) {
  const aStart = inceptionYear(fundA);
  const bStart = inceptionYear(fundB);
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8eb] bg-white">
      <table className="w-full min-w-[520px] text-left">
        <thead className="border-b border-[#e2e8eb] bg-[#f6f9fa]">
          <tr>
            <th scope="col" rowSpan={2} className="px-3 py-2 align-bottom text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">
              {c.colPeriod}
            </th>
            <th scope="colgroup" colSpan={2} className="border-l border-[#e2e8eb] px-3 pt-2 text-[11px] font-semibold" style={{ color: BLUE }}>
              {tx(fundA.shortName, lang)}
            </th>
            <th scope="colgroup" colSpan={2} className="border-l border-[#e2e8eb] px-3 pt-2 text-[11px] font-semibold" style={{ color: GREEN }}>
              {tx(fundB.shortName, lang)}
            </th>
          </tr>
          <tr>
            <th scope="col" className="border-l border-[#e2e8eb] px-3 pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">{c.colReturn}</th>
            <th scope="col" className="px-3 pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">{c.colPerMonth}</th>
            <th scope="col" className="border-l border-[#e2e8eb] px-3 pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">{c.colReturn}</th>
            <th scope="col" className="px-3 pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]">{c.colPerMonth}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f4]">
          {rows.map((row) => {
            const active = row.key === selectedKey;
            return (
              <tr
                key={row.key}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => onSelect(row.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(row.key);
                  }
                }}
                className={`cursor-pointer transition ${active ? "bg-[#f2f6f8]" : "hover:bg-[#f6f9fa]"}`}
              >
                <th scope="row" className={`px-3 py-2 text-sm font-medium ${active ? "text-[#0a2d46]" : "text-[#40515e]"}`}>
                  {periodTitle(row, c)}
                </th>
                <PeriodCells period={row.a} amount={amount} lang={lang} color={BLUE} startYear={row.kind === "inception" ? aStart : null} c={c} />
                <PeriodCells period={row.b} amount={amount} lang={lang} color={GREEN} startYear={row.kind === "inception" ? bStart : null} c={c} />
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.some((row) => row.a?.derived || row.b?.derived) && (
        <p className="border-t border-[#eef2f4] px-3 py-2 text-[11px] leading-4 text-[#8291a0]">{c.derivedNote}</p>
      )}
    </div>
  );
}

/** One fund's pair of cells for a period: its return, and what that paid monthly. */
function PeriodCells({
  period,
  amount,
  lang,
  color,
  startYear,
  c,
}: {
  period: FundPeriod | null;
  amount: number;
  lang: Lang;
  color: string;
  /** Inception rows only — the two funds start from different years. */
  startYear: number | null;
  c: Copy;
}) {
  if (!period) {
    return (
      <>
        <td className="border-l border-[#eef2f4] px-3 py-2 text-right text-sm text-[#b3bec5]">—</td>
        <td className="px-3 py-2 text-right text-sm text-[#b3bec5]">—</td>
      </>
    );
  }
  return (
    <>
      <td className="border-l border-[#eef2f4] px-3 py-2 text-right text-sm font-semibold tabular-nums" style={{ color }}>
        {period.pct >= 0 ? "+" : ""}
        {period.pct.toFixed(1)}%
        {startYear && <span className="ml-1 text-[10px] font-medium text-[#93a0a9]">{c.since} {startYear}</span>}
        {period.derived && <span className="ml-1 text-[10px] font-semibold text-[#a2704a]">{c.derivedTag}</span>}
      </td>
      <td className="px-3 py-2 text-right text-sm tabular-nums text-[#67757f]">
        {money(historicalEarnings(amount, period.pct).monthly, lang)}
      </td>
    </>
  );
}

function TermsTable({ fundA, fundB, lang, c }: { fundA: FundComparable; fundB: FundComparable; lang: Lang; c: Copy }) {
  const text = (value: LocalizedText | undefined) => {
    const resolved = tx(value, lang);
    return resolved ? resolved : null;
  };
  const rows: { label: string; a: string | null; b: string | null }[] = [
    {
      label: c.terms.minimum,
      a: fundA.minimumInvestment !== undefined ? money(fundA.minimumInvestment, lang) : null,
      b: fundB.minimumInvestment !== undefined ? money(fundB.minimumInvestment, lang) : null,
    },
    { label: c.terms.targetReturn, a: fundA.terms?.targetReturn ?? null, b: fundB.terms?.targetReturn ?? null },
    { label: c.terms.targetDistribution, a: fundA.terms?.targetDistribution ?? null, b: fundB.terms?.targetDistribution ?? null },
    { label: c.terms.distributionFrequency, a: text(fundA.terms?.distributionFrequency), b: text(fundB.terms?.distributionFrequency) },
    { label: c.terms.term, a: fundA.terms?.term ?? null, b: fundB.terms?.term ?? null },
    { label: c.terms.redemption, a: text(fundA.terms?.redemptionTerms), b: text(fundB.terms?.redemptionTerms) },
    { label: c.terms.managementFee, a: text(fundA.terms?.managementFee), b: text(fundB.terms?.managementFee) },
    { label: c.terms.riskProfile, a: text(fundA.terms?.riskProfile), b: text(fundB.terms?.riskProfile) },
    {
      label: c.terms.registered,
      a: fundA.terms?.registeredAccountTypes?.length ? fundA.terms.registeredAccountTypes.join(", ") : null,
      b: fundB.terms?.registeredAccountTypes?.length ? fundB.terms.registeredAccountTypes.join(", ") : null,
    },
    { label: c.terms.aum, a: fundA.terms?.aum ?? null, b: fundB.terms?.aum ?? null },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead className="border-b border-[#e2e8eb]">
          <tr>
            <th scope="col" className="w-[28%] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8291a0]" />
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold" style={{ color: BLUE }}>{tx(fundA.shortName, lang)}</th>
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold" style={{ color: GREEN }}>{tx(fundB.shortName, lang)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f4]">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="px-5 py-2.5 align-top text-xs font-medium text-[#67757f]">{r.label}</th>
              <td className="px-3 py-2.5 align-top text-sm text-[#40515e]">{r.a ?? "—"}</td>
              <td className="px-3 py-2.5 align-top text-sm text-[#40515e]">{r.b ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
