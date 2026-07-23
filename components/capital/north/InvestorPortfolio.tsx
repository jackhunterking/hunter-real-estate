"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Clock3, Compass, Landmark, MapPinned, WalletCards } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { buildMapProperties, formatMoneyCompact } from "@/lib/capital/present";
import { requestStage } from "@/lib/capital/investment-requests";
import { taxonomyLabel } from "@/lib/capital/taxonomies";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { FundMap } from "@/components/capital/map/FundMap";
import { TrustStrip } from "@/components/capital/offering-ui";
import { NORTH_BASE } from "./NorthBrand";
import { PageHeader, Panel } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";
import { useTaxonomies } from "./TaxonomyProvider";
import { InvestmentRequestButton } from "./InvestmentRequestButton";

const COPY = {
  en: {
    eyebrow: "Your real-asset portfolio",
    title: "Portfolio",
    description: "Track your funded exposure and requests in review, see the assets and locations behind them, and add funds to available opportunities. Amounts shown are funded exposure—not live market value or direct property ownership.",
    funded: "Funded exposure",
    inReview: "In review",
    held: "Offerings held",
    locations: "Locations",
    positionsTitle: "Your positions",
    reviewBadge: "In review",
    fundedBadge: "Funded",
    startTitle: "Start your portfolio",
    startBody: "You have no positions yet. Explore the available opportunities below, review the assets and locations behind each, and add funds to begin.",
    moreTitle: "More opportunities",
    moreBody: "Available offerings you can add to your portfolio.",
    addFunds: "Add funds",
    viewOffering: "View details",
    buildings: "buildings",
    allocationTitle: "Asset mix",
    geographyTitle: "Geography",
    couldHold: "What you could hold",
    couldHoldNote: "Based on the opportunities below—shown for illustration, not owned.",
    mapHeld: "Where your assets are located",
    mapOpp: "Where these opportunities are located",
    mapHelp: "Select a marker or building card to see verified property information.",
    trust: "Independently verified", auditor: "Auditor", legalCounsel: "Legal counsel", appraiser: "Appraiser", verified: "Verified",
  },
  tr: {
    eyebrow: "Gayrimenkul varlık portföyünüz",
    title: "Portföy",
    description: "Fonlanan maruziyetinizi ve incelemedeki taleplerinizi takip edin, arkalarındaki varlıkları ve konumları görün ve mevcut fırsatlara fon ekleyin. Gösterilen tutarlar canlı piyasa değeri veya doğrudan mülk sahipliği değil, fonlanan maruziyettir.",
    funded: "Fonlanan tutar",
    inReview: "İncelemede",
    held: "Sahip olunan seçenekler",
    locations: "Konumlar",
    positionsTitle: "Pozisyonlarınız",
    reviewBadge: "İncelemede",
    fundedBadge: "Fonlandı",
    startTitle: "Portföyünüzü oluşturun",
    startBody: "Henüz pozisyonunuz yok. Aşağıdaki mevcut fırsatları inceleyin, her birinin arkasındaki varlıkları ve konumları görün ve başlamak için fon ekleyin.",
    moreTitle: "Diğer fırsatlar",
    moreBody: "Portföyünüze ekleyebileceğiniz mevcut yatırım seçenekleri.",
    addFunds: "Fon ekle",
    viewOffering: "Detayları gör",
    buildings: "bina",
    allocationTitle: "Varlık dağılımı",
    geographyTitle: "Coğrafya",
    couldHold: "Neler edinebilirsiniz",
    couldHoldNote: "Aşağıdaki fırsatlara dayanır—örnek amaçlıdır, sahip olunmaz.",
    mapHeld: "Varlıklarınızın konumları",
    mapOpp: "Bu fırsatların konumları",
    mapHelp: "Doğrulanmış mülk bilgilerini görmek için bir işaretçi veya bina kartı seçin.",
    trust: "Bağımsız olarak doğrulandı", auditor: "Denetçi", legalCounsel: "Hukuk müşaviri", appraiser: "Değerleme uzmanı", verified: "Doğrulama tarihi",
  },
} as const;

const FUND_COLORS = ["#0f5b78", "#996c26", "#4f6d45", "#764d68", "#4f5f86"];

type Aggregated = { position: { id: string; amount: number; status: string }; fund: OfferingBundle };

/** Group a user's positions by offering, summing amounts. */
function aggregate(offerings: OfferingBundle[], positions: { id: string; offeringId: string; amount: number; status: string }[]): Aggregated[] {
  return offerings.flatMap((fund) => {
    const held = positions.filter((position) => position.offeringId === fund.id);
    if (!held.length) return [];
    return [{
      position: { id: held[0].id, amount: held.reduce((sum, p) => sum + p.amount, 0), status: held[0].status },
      fund,
    }];
  });
}

export function InvestorPortfolio({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, dataset } = usePortalAccess();
  const { assetClasses } = useTaxonomies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const c = pick(COPY, lang);

  const mine = dataset.investments.filter((investment) => investment.userId === currentUser.id);
  const heldFunds = aggregate(offerings, mine.filter((i) => i.status === "funded"));
  const reviewFunds = aggregate(offerings, mine.filter((i) => requestStage(i.status) === "in-review"));

  const engagedIds = new Set([...heldFunds, ...reviewFunds].map(({ fund }) => fund.id));
  const opportunities = offerings.filter((offering) => offering.status === "available" && !engagedIds.has(offering.id));

  // Buildings drive the map + allocation: real holdings when present, else the
  // opportunities shown below (clearly captioned as illustrative).
  const usingHeld = heldFunds.length > 0;
  const visualFunds = usingHeld ? heldFunds.map(({ fund }) => fund) : opportunities;

  const properties = useMemo(
    () => visualFunds.flatMap((fund, index) => buildMapProperties(fund, lang, assetClasses).map((property) => ({
      ...property,
      id: `${fund.id}:${property.id}`,
      accent: FUND_COLORS[index % FUND_COLORS.length],
      offeringName: tx(fund.shortName, lang),
    }))),
    [visualFunds, lang, assetClasses],
  );

  const buildings = visualFunds.flatMap((fund) => fund.properties);
  const fundedAmount = heldFunds.reduce((sum, item) => sum + item.position.amount, 0);
  const locationCount = new Set(buildings.map((b) => `${b.city}:${b.province}`)).size;

  const assetMix = groupCount(buildings.map((b) => b.assetClassId)).map(({ key, count }) => ({
    label: taxonomyLabel(assetClasses, key, lang), count,
  }));
  const geography = groupCount(buildings.map((b) => b.province)).map(({ key, count }) => ({ label: key, count }));

  const metrics = [
    { label: c.funded, value: formatMoneyCompact(fundedAmount, lang), icon: WalletCards },
    { label: c.inReview, value: String(reviewFunds.length), icon: Clock3 },
    { label: c.held, value: String(heldFunds.length), icon: Landmark },
    { label: c.locations, value: String(locationCount), icon: MapPinned },
  ];

  return (
    <div>
      <PageHeader title={c.title} description={c.description} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Panel key={label} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#6d7983]">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-[#102638]">{value}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-[#edf3f6] text-[#0a4b72]"><Icon className="size-5" /></span>
            </div>
          </Panel>
        ))}
      </div>

      {/* Positions the investor already holds or has in review. */}
      {(heldFunds.length > 0 || reviewFunds.length > 0) && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[#193143]">{c.positionsTitle}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[...heldFunds.map((f) => ({ ...f, review: false })), ...reviewFunds.map((f) => ({ ...f, review: true }))].map(({ position, fund, review }) => (
              <Panel key={`${fund.id}-${review ? "review" : "held"}`} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#71808b]">{tx(fund.manager.name, lang)}</p>
                    <h3 className="mt-2 text-base font-semibold text-[#193143]">{tx(fund.shortName, lang)}</h3>
                    <p className="mt-2 text-sm text-[#65737e]">
                      {review ? "" : `${formatMoneyCompact(position.amount, lang)} · `}{fund.properties.length} {c.buildings}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${review ? "border-[#eadcae] bg-[#f8f1dc] text-[#755718]" : "border-[#cfe5d8] bg-[#e6f2eb] text-[#2f6f4f]"}`}>
                    {review ? c.reviewBadge : c.fundedBadge}
                  </span>
                </div>
                <Link href={`${NORTH_BASE}/funds/${fund.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline">{c.viewOffering}<ArrowRight className="size-3.5" /></Link>
              </Panel>
            ))}
          </div>
        </section>
      )}

      {/* Opportunities — the primary content for a new (empty) portfolio: the
          offerings render here as the portfolio's items, each with Add funds. */}
      {opportunities.length > 0 && (
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#193143]">{usingHeld ? c.moreTitle : c.startTitle}</h2>
            <p className="mt-1 text-sm text-[#697681]">{usingHeld ? c.moreBody : c.startBody}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((fund) => {
              const locations = uniqueCities(fund);
              return (
                <Panel key={fund.id} className="flex flex-col overflow-hidden">
                  {fund.media?.card?.src && (
                    <div className="relative aspect-[60/13] overflow-hidden bg-[#0d2d43]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fund.media.card.src} alt={tx(fund.media.card.alt, lang) ?? tx(fund.shortName, lang)} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/70 via-[#071c2c]/10 to-transparent" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#71808b]">{tx(fund.manager.name, lang)}</p>
                    <h3 className="mt-2 text-base font-semibold text-[#193143]">{tx(fund.shortName, lang)}</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {fund.assetClassIds.map((id) => (
                        <span key={id} className="rounded border border-[#dbe1e5] bg-[#f5f7f8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5f6d78]">{taxonomyLabel(assetClasses, id, lang)}</span>
                      ))}
                      <span className="rounded border border-[#dbe1e5] bg-[#f5f7f8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5f6d78]">{fund.properties.length} {c.buildings}</span>
                      {locations.slice(0, 3).map((city) => (
                        <span key={city} className="rounded border border-[#dbe1e5] bg-[#f5f7f8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5f6d78]">{city}</span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-1 items-end gap-3">
                      <InvestmentRequestButton offerings={[fund]} initialOfferingId={fund.id} label={c.addFunds} />
                      <Link href={`${NORTH_BASE}/funds/${fund.slug}`} className="inline-flex h-10 items-center gap-1 rounded-md border border-[#ccd5db] px-4 text-sm font-semibold text-[#435764] hover:bg-[#f3f5f7]">{c.viewOffering}</Link>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        </section>
      )}

      {/* Asset mix + geography — what the investor holds, or could hold. */}
      {buildings.length > 0 && (
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="size-4 text-[#0a4b72]" />
              <h2 className="text-sm font-semibold text-[#193143]">{c.allocationTitle}</h2>
            </div>
            <AllocationBars items={assetMix} total={buildings.length} unit={c.buildings} />
            {!usingHeld && <p className="mt-3 text-xs text-[#8a949b]">{c.couldHoldNote}</p>}
          </Panel>
          <Panel className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPinned className="size-4 text-[#0a4b72]" />
              <h2 className="text-sm font-semibold text-[#193143]">{c.geographyTitle}</h2>
            </div>
            <AllocationBars items={geography} total={buildings.length} unit={c.buildings} />
            {!usingHeld && <p className="mt-3 text-xs text-[#8a949b]">{c.couldHoldNote}</p>}
          </Panel>
        </section>
      )}

      {/* Map of asset locations (held, else opportunities). */}
      {properties.length > 0 && (
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#193143]">{usingHeld ? c.mapHeld : c.mapOpp}</h2>
            <p className="mt-1 text-sm text-[#697681]">{c.mapHelp}</p>
          </div>
          <FundMap properties={properties} selectedId={selectedId} onSelect={setSelectedId} variant="full" />
        </section>
      )}

      {/* Empty final fallback: no offerings at all. */}
      {opportunities.length === 0 && heldFunds.length === 0 && reviewFunds.length === 0 && (
        <Panel className="mt-8 grid min-h-[280px] place-items-center p-8 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf3f6] text-[#0a4b72]"><Compass className="size-7" /></span>
            <h2 className="mt-5 text-xl font-semibold text-[#193143]">{c.startTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[#65737e]">{c.startBody}</p>
            <Link href={`${NORTH_BASE}/funds`} className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.viewOffering}</Link>
          </div>
        </Panel>
      )}

      {(() => {
        const trustFund = [...heldFunds, ...reviewFunds].map(({ fund }) => fund).find((f) => f.serviceProviders)
          ?? offerings.find((offering) => offering.serviceProviders);
        if (!trustFund?.serviceProviders) return null;
        return (
          <section className="mt-8">
            <TrustStrip
              providers={trustFund.serviceProviders}
              verifiedAt={trustFund.verifiedAt}
              copy={{ heading: c.trust, auditor: c.auditor, legalCounsel: c.legalCounsel, appraiser: c.appraiser, verified: c.verified }}
            />
          </section>
        );
      })()}
    </div>
  );
}

function groupCount(keys: string[]): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const key of keys) map.set(key, (map.get(key) ?? 0) + 1);
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

function uniqueCities(fund: OfferingBundle): string[] {
  return [...new Set(fund.properties.map((property) => property.city))];
}

function AllocationBars({ items, total, unit }: { items: { label: string; count: number }[]; total: number; unit: string }) {
  if (!items.length) return <p className="text-sm text-[#8a949b]">—</p>;
  return (
    <div className="space-y-3">
      {items.map(({ label, count }) => (
        <div key={label}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#2c3e4c]">{label}</span>
            <span className="tabular-nums text-[#6d7983]">{count} {unit}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef2f4]">
            <div className="h-full rounded-full bg-[#0a4b72]" style={{ width: `${Math.round((count / total) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
