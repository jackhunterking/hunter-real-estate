"use client";

/**
 * A funded position, stated as a sum: what the holding pays you, plus the
 * growth it targets, equals its target total.
 *
 * The opportunity card answers "should I invest?" — minimum investment, risk
 * meter, AUM, the fund summary. Once an investor holds the fund those facts are
 * spent, so a funded position gets its own card answering "what does this pay
 * me?" instead. Everything about what they *hold* (committed amount, units,
 * share of portfolio) drops to one quiet line at the base.
 *
 * The "+" and "=" are a claim that the figures add up, so they must: the total
 * is derived from the rounded parts in `roundedIncome`, never rounded on its
 * own. A fund publishing no target return has no growth term, and the sum
 * collapses to the cash figure alone rather than showing "+ $0".
 */

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Lang, OfferingBundle } from "@/lib/capital/types";
import { formatCurrencyCad, paymentCadenceLabel, paymentsPerYear, primaryShareClass, tightRange } from "@/lib/capital/present";
import { positionIncome, roundedIncome } from "@/lib/capital/performance";
import { unitPriceOf } from "@/lib/capital/shares";
import { tx } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";
import { NORTH_BASE } from "./NorthBrand";

export type IncomePeriod = "year" | "month";

const STAT_LABEL = "text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]";

export type PositionCardCopy = {
  paysYou: string;
  growth: string;
  growthNote: string;
  targetTotal: string;
  perYear: string;
  perMonth: string;
  average: string;
  invested: string;
  units: string;
  ofPortfolio: string;
  view: string;
};

/** Whole dollars, no "CAD" suffix — the equation cells are tight and already in context. */
function dollars(value: number, lang: Lang): string {
  const grouped = new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", { maximumFractionDigits: 0 }).format(value);
  return lang === "tr" ? grouped : `$${grouped}`;
}

/** A unit price keeps its cents — rounding $4.75 to $5 misstates what was paid. */
function unitPrice(value: number, lang: Lang): string {
  const grouped = new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return lang === "tr" ? grouped : `$${grouped}`;
}

export function PositionCard({
  fund,
  lang,
  period,
  amount,
  shares,
  portfolioShare,
  strategyLabel,
  c,
}: {
  fund: OfferingBundle;
  lang: Lang;
  period: IncomePeriod;
  amount: number;
  shares: number;
  /** 0–1 share of the investor's total committed capital. */
  portfolioShare: number;
  strategyLabel?: string;
  c: PositionCardCopy;
}) {
  const shareClass = primaryShareClass(fund);
  const distribution = shareClass?.targetDistribution?.value ?? shareClass?.distributionPerUnit?.value;
  const targetReturn = shareClass?.targetReturn?.value;
  const income = positionIncome(amount, distribution, targetReturn);

  const divisor = period === "year" ? 1 : 12;
  const figures = income ? roundedIncome(income, divisor) : null;
  const periodLabel = period === "year" ? c.perYear : c.perMonth;

  // The per-payment figure is the same in both views — it is what actually
  // lands, and that does not depend on the period being looked at.
  const perYear = distribution ? paymentsPerYear(distribution) : null;
  const cadence = distribution ? paymentCadenceLabel(distribution, lang) : null;
  const perPayment = income && perYear ? Math.round(income.annualCash / perYear) : null;
  // A quarterly payer's monthly number is a twelfth of the year, not a payment.
  const isAverage = period === "month" && perYear != null && perYear !== 12;

  const logo = fund.media?.logo?.src;
  const price = unitPriceOf(fund);
  const range = targetReturn ? tightRange(targetReturn) : null;

  return (
    <article className="overflow-hidden rounded-xl border border-[#e2e7ea] bg-white">
      <div className="flex items-center gap-2.5 p-3">
        {logo && (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e2e7ea] bg-white p-1">
            <Image src={logo} alt="" width={32} height={32} className="h-auto max-h-full w-auto max-w-full" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-[#102638]">{tx(fund.shortName, lang)}</p>
          <span className="text-[11.5px] text-[#7a8790]">{tx(fund.manager.name, lang)}</span>
        </span>
        {strategyLabel && (
          <span className="whitespace-nowrap rounded border border-[#e2e7ea] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-[#5c6b76]">
            {strategyLabel}
          </span>
        )}
      </div>

      {figures ? (
        <div
          className={cn(
            "relative grid border-y border-[#eef1f3] bg-[#f4f7f9]",
            // Operators are spans and sort before the cells, so the first cell
            // never picks up a divider.
            "[&>div+div]:border-l [&>div+div]:border-[#e2e7ea]",
            income?.hasGrowth ? "grid-cols-3" : "grid-cols-1",
          )}
        >
          {income?.hasGrowth && (
            <>
              <Operator className="left-1/3">+</Operator>
              <Operator className="left-2/3">=</Operator>
            </>
          )}

          <Cell label={c.paysYou} swatch="#0a4b72" value={dollars(figures.cash, lang)}>
            {perPayment != null && cadence ? (
              <>
                {isAverage && <span className="font-bold text-[#996c26]">{c.average}</span>}
                {isAverage && " · "}
                <b className="font-semibold tabular-nums text-[#5c6b76]">{dollars(perPayment, lang)}</b> {cadence}
              </>
            ) : (
              periodLabel
            )}
          </Cell>

          {income?.hasGrowth && (
            <>
              <Cell label={c.growth} swatch="#996c26" value={dollars(figures.growth, lang)}>
                {c.growthNote}
              </Cell>
              <Cell label={c.targetTotal} value={dollars(figures.total, lang)} emphasis>
                {periodLabel}
                {range ? ` · ${range}` : ""}
              </Cell>
            </>
          )}
        </div>
      ) : (
        <div className="border-y border-[#eef1f3] bg-[#f4f7f9] px-3 py-3.5">
          <p className={STAT_LABEL}>{c.invested}</p>
          <p className="mt-2 font-serif text-xl font-semibold tabular-nums text-[#0a2d46]">{formatCurrencyCad(Math.round(amount), lang)}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3">
        <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[11.5px] tabular-nums text-[#7a8790]">
          {figures && (
            <span>
              <b className="font-semibold text-[#5c6b76]">{dollars(Math.round(amount), lang)}</b> {c.invested}
            </span>
          )}
          {shares > 0 && (
            <span>
              <b className="font-semibold text-[#5c6b76]">{shares.toLocaleString(lang === "tr" ? "tr-TR" : "en-CA")}</b> {c.units}
              {price != null ? ` @ ${unitPrice(price, lang)}` : ""}
            </span>
          )}
          <span>
            <b className="font-semibold text-[#5c6b76]">{Math.round(portfolioShare * 100)}%</b> {c.ofPortfolio}
          </span>
        </p>
        <Link
          href={`${NORTH_BASE}/investments/${fund.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline"
        >
          {c.view}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

/**
 * The "+" and "=" sit on the dividers rather than in columns of their own, so
 * all three cells stay a true third — which matters at phone widths, where
 * every pixel of number space counts.
 */
function Operator({ children, className }: { children: string; className: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1/2 z-[2] grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center",
        "rounded-full border border-[#e2e7ea] bg-white font-serif text-xs font-bold leading-none text-[#5c6b76]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Cell({
  label,
  value,
  swatch,
  emphasis,
  children,
}: {
  label: string;
  value: string;
  swatch?: string;
  emphasis?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("min-h-[98px] px-2.5 py-3", emphasis && "bg-[#eef2f5]")}>
      <p className={cn(STAT_LABEL, "flex items-center gap-1.5 leading-tight")}>
        {swatch && <i className="size-1.5 shrink-0 rounded-sm not-italic" style={{ backgroundColor: swatch }} />}
        {label}
      </p>
      <p className={cn("mt-2 font-serif font-semibold leading-none tabular-nums text-[#0a2d46]", emphasis ? "text-[21px]" : "text-[19px]")}>
        {value}
      </p>
      {children && <p className="mt-1.5 text-[10.5px] leading-snug text-[#7a8790]">{children}</p>}
    </div>
  );
}
