"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Compass, Landmark, MapPinned, WalletCards } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { buildMapProperties, formatMoneyCompact } from "@/lib/capital/present";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { FundMap } from "@/components/capital/map/FundMap";
import { NORTH_BASE } from "./NorthBrand";
import { PageHeader, Panel } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";

const COPY = {
  en: {
    eyebrow: "Your real-asset portfolio",
    title: "Portfolio",
    description: "See the funds, buildings, and locations connected to your funded capital. Amounts shown are funded exposure—not live market value or direct property ownership.",
    funded: "Funded amount",
    funds: "Funds held",
    buildings: "Underlying buildings",
    locations: "Locations",
    mapTitle: "Where your funded exposure is located",
    mapHelp: "Select a marker or building card to see verified property information.",
    holdings: "Funded positions",
    viewFund: "View fund",
    emptyTitle: "Your portfolio map will appear here",
    emptyBody: "Once an investment is funded, its fund and verified underlying buildings will be shown on this map.",
    explore: "Explore funds",
  },
  tr: {
    eyebrow: "Gayrimenkul varlık portföyünüz",
    title: "Portföy",
    description: "Fonlanan sermayenizle bağlantılı fonları, binaları ve konumları görün. Gösterilen tutarlar canlı piyasa değeri veya doğrudan mülk sahipliği değil, fonlanan sermaye maruziyetidir.",
    funded: "Fonlanan tutar",
    funds: "Sahip olunan fonlar",
    buildings: "Dayanak binalar",
    locations: "Konumlar",
    mapTitle: "Fonlanan maruziyetinizin konumları",
    mapHelp: "Doğrulanmış mülk bilgilerini görmek için bir işaretçi veya bina kartı seçin.",
    holdings: "Fonlanan pozisyonlar",
    viewFund: "Fonu görüntüle",
    emptyTitle: "Portföy haritanız burada görünecek",
    emptyBody: "Bir yatırım fonlandığında fon ve doğrulanmış dayanak binalar bu haritada gösterilir.",
    explore: "Fonları keşfet",
  },
} as const;

const FUND_COLORS = ["#0f5b78", "#996c26", "#4f6d45", "#764d68", "#4f5f86"];

export function InvestorPortfolio({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, dataset } = usePortalAccess();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const c = COPY[lang];

  const fundedPositions = dataset.investments.filter(
    (investment) => investment.userId === currentUser.id && investment.status === "funded",
  );
  const fundedFunds = offerings.flatMap((fund) => {
    const positions = fundedPositions.filter((position) => position.offeringId === fund.id);
    if (!positions.length) return [];
    return [{
      position: { ...positions[0], amount: positions.reduce((sum, position) => sum + position.amount, 0) },
      fund,
    }];
  });

  const properties = useMemo(
    () => fundedFunds.flatMap(({ fund }, index) => buildMapProperties(fund, lang).map((property) => ({
      ...property,
      id: `${fund.id}:${property.id}`,
      accent: FUND_COLORS[index % FUND_COLORS.length],
      offeringName: fund.shortName[lang],
    }))),
    [fundedFunds, lang],
  );

  const fundedAmount = fundedFunds.reduce((sum, item) => sum + item.position.amount, 0);
  const locationCount = new Set(properties.map((property) => `${property.city}:${property.province}`)).size;
  const metrics = [
    { label: c.funded, value: formatMoneyCompact(fundedAmount, lang), icon: WalletCards },
    { label: c.funds, value: String(fundedFunds.length), icon: Landmark },
    { label: c.buildings, value: String(properties.length), icon: Building2 },
    { label: c.locations, value: String(locationCount), icon: MapPinned },
  ];

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

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

      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-[#193143]">{c.mapTitle}</h2>
          <p className="mt-1 text-sm text-[#697681]">{c.mapHelp}</p>
        </div>
        {properties.length ? (
          <FundMap properties={properties} selectedId={selectedId} onSelect={setSelectedId} variant="full" />
        ) : (
          <Panel className="grid min-h-[420px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_top,#e8f1f5,transparent_55%)] p-8 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-[#0a4b72] shadow-sm"><Compass className="size-7" /></span>
              <h2 className="mt-5 text-xl font-semibold text-[#193143]">{c.emptyTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[#65737e]">{c.emptyBody}</p>
              <Link href={`${NORTH_BASE}/funds`} className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.explore}</Link>
            </div>
          </Panel>
        )}
      </section>

      {fundedFunds.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-[#193143]">{c.holdings}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {fundedFunds.map(({ position, fund }) => (
              <Panel key={position.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#71808b]">{fund.manager.name[lang]}</p>
                    <h3 className="mt-2 text-base font-semibold text-[#193143]">{fund.shortName[lang]}</h3>
                    <p className="mt-2 text-sm text-[#65737e]">{formatMoneyCompact(position.amount, lang)} · {fund.properties.length} {lang === "tr" ? "bina" : "buildings"}</p>
                  </div>
                  <Link href={`${NORTH_BASE}/funds/${fund.slug}`} className="shrink-0 text-xs font-semibold text-[#0a4b72] hover:underline">{c.viewFund}</Link>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
