/**
 * Reconcile the Lankin Apartment REIT profile to the **Offering Memorandum dated
 * May 1, 2026** (SEDAR filing version, 148 pages).
 *
 * The OM supersedes the March 2026 deck and the Q1 2026 fact sheet: it is the
 * legal document, it is newer, and where marketing material disagreed with it,
 * the OM wins. This pass replaces the earlier fact-sheet-driven pass.
 *
 * Sources, and what each is allowed to say:
 *   lankin-om-2026-05    OM, 1 May 2026. Authoritative for structure, series,
 *                        fees, redemption, properties, capital and risk.
 *   lankin-fs-2025-audit Audited financial statements for the year ended
 *                        31 Dec 2025, bound into the OM (Item 14). Authoritative
 *                        for NAV per unit and Gross Asset Value.
 *   lankin-fact-2026-q1  Q1 2026 fact sheet. The ONLY source for targeted return
 *                        and targeted distribution — the OM publishes neither.
 *   lankin-site-2026-07  lankin.com fund page. Current portfolio and AUM.
 *   renx-2026-05-ottawa  Public reporting on the Ottawa acquisition.
 *
 * Corrections this pass makes to previously published data:
 *   * Redemption schedule was "Y1 10% / Y2 8% / Y3 6% / 0% after". The OM's
 *     Series A schedule is 8% within 6 months / 8% yr 1 / 7% yr 2 / 6% yr 3 /
 *     0% thereafter, and each series differs. MATERIAL.
 *   * `isInvestmentFund` was true. OM 2.1.2 and 10.2.24 say the Trust is NOT a
 *     "mutual fund" or "non-redeemable investment fund" under securities law —
 *     it qualifies as a "mutual fund trust" only for Tax Act purposes. MATERIAL:
 *     this feeds the exemption logic.
 *   * One share class (Series A) becomes five: A, C, D, D-U, F.
 *   * Unit price $10.74 (deck) becomes the audited NAV per unit at 31 Dec 2025:
 *     Series A $10.61, Series C $10.95, Series F $11.24.
 *   * Management fee "0.70% of AUM" becomes "0.7% of Gross Asset Value".
 *   * Property names and addresses replaced with the OM's Item 2.4 table.
 *   * Fund term: the March deck said "close-ended, redemption at end of year 5".
 *     OM 2.1.2 states the Trust is OPEN-ENDED with a continuous offering. The
 *     published "open-ended" was right; the deck statement is not about this
 *     Trust's units.
 *
 * Deliberately NOT asserted:
 *   * The Ottawa property is NOT in the OM (zero mentions) — it closed after the
 *     1 May 2026 OM date. It is carried, clearly marked as a post-OM acquisition
 *     sourced to public reporting and the manager's site, because omitting a
 *     building the manager advertises would be its own inaccuracy.
 *   * The manager's site says 1,694 units; the OM's eight buildings plus Ottawa
 *     sum to 1,692. The 2-unit difference is on the gap report.
 *
 * Run:  LANKIN_PHOTO_DIR=<dir> node --env-file=.env.local scripts/lankin-om-2026-05-data-pass.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { LocalizedText, OfferingBundle, Property, ShareClass } from "../lib/equity-market/types.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_WEB_SECRET_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_WEB_SECRET_KEY. Run with --env-file=.env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  db: { schema: "api" },
  auth: { persistSession: false, autoRefreshToken: false },
});

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = join(root, "supabase", "seed", "offerings", "lankin-apartment-reit.json");
const SLUG = "lankin-apartment-reit";
const BUCKET = "offering-public";
const PHOTO_DIR = process.env.LANKIN_PHOTO_DIR ?? "";

const OM = "lankin-om-2026-05";
const FS = "lankin-fs-2025-audit";
const FACT = "lankin-fact-2026-q1";
const SITE = "lankin-site-2026-07";
const RENX = "renx-2026-05-ottawa";

/** The OM's own date. Every OM-sourced value is effective as at this date. */
const OM_DATE = "2026-05-01";
/** The audited financial statements' date. */
const FS_DATE = "2025-12-31";
/** Reporting period the published figures now describe. */
const AS_OF = "2026-06-30";
const TODAY = "2026-07-23";

const t = (en: string, tr: string): LocalizedText => ({ en, tr });
const omValue = (value: string | number, classification: "current" | "target" | "historical" = "current") =>
  ({ value, classification, asOfDate: OM_DATE, sourceId: OM, approval: "approved-public" }) as const;

type PropertySpec = Property & { photo?: string; photoKind?: "photo" | "render" };

/**
 * OM Item 2.4 — Current Properties, verbatim. Occupancy is as at 10 March 2026.
 * All eight are held freehold through Nominee Entities for the Partnership;
 * 6 Silver Maple Court is held through 6 Silver Maple JV LP (OM note 7).
 */
const PROPERTIES: PropertySpec[] = [
  {
    id: "lankin-park-centre-place", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("Park Centre Place", "Park Centre Place"),
    address: t("2014 Sherwood Drive, Edmonton, Alberta", "2014 Sherwood Drive, Edmonton, Alberta"),
    city: "Edmonton", province: "Alberta", country: "Canada",
    latitude: 53.5695097, longitude: -113.295488,
    assetClassId: "multifamily", status: "new-construction", verificationStatus: "verified",
    unitCount: 177,
    ownershipNote: t(
      "Built 2023. 927 sq ft average. 165 of 177 units rented as at 10 March 2026; average rent $2,067 per unit.",
      "2023 yapımı. Ortalama 927 sq ft. 10 Mart 2026 itibarıyla 177 dairenin 165'i kiralık; daire başına ortalama kira 2.067 $.",
    ),
    photo: "sherwood-park.png", photoKind: "render",
  },
  {
    id: "lankin-huron-heights", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("Huron Heights", "Huron Heights"),
    address: t("75-77 Huron Heights Drive, Newmarket, Ontario", "75-77 Huron Heights Drive, Newmarket, Ontario"),
    city: "Newmarket", province: "Ontario", country: "Canada",
    latitude: 44.0651574, longitude: -79.4456718,
    assetClassId: "multifamily", status: "stabilized", verificationStatus: "verified",
    unitCount: 110, purchasePrice: 33450000,
    ownershipNote: t(
      "Built 1963. 650 sq ft average. 107 of 110 units rented as at 10 March 2026; average rent $1,795 per unit.",
      "1963 yapımı. Ortalama 650 sq ft. 10 Mart 2026 itibarıyla 110 dairenin 107'si kiralık; daire başına ortalama kira 1.795 $.",
    ),
    photo: "huron-heights.png", photoKind: "photo",
  },
  {
    id: "lankin-orenda-court", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("Orenda Court", "Orenda Court"),
    address: t("75-90 Orenda Court, Brampton, Ontario", "75-90 Orenda Court, Brampton, Ontario"),
    city: "Brampton", province: "Ontario", country: "Canada",
    latitude: 43.6918117, longitude: -79.7454388,
    assetClassId: "multifamily", status: "stabilized", verificationStatus: "verified",
    unitCount: 242,
    ownershipNote: t(
      "Built 1976. 948 sq ft average, including 91 townhouses. 224 of 242 units rented as at 10 March 2026; average rent $1,753 per unit.",
      "1976 yapımı. 91 sıra ev dahil ortalama 948 sq ft. 10 Mart 2026 itibarıyla 242 dairenin 224'ü kiralık; daire başına ortalama kira 1.753 $.",
    ),
    photo: "brampton-242.png", photoKind: "photo",
  },
  {
    id: "lankin-4-silver-maple", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("4 Silver Maple Court", "4 Silver Maple Court"),
    address: t("4 Silver Maple Court, Brampton, Ontario", "4 Silver Maple Court, Brampton, Ontario"),
    city: "Brampton", province: "Ontario", country: "Canada",
    latitude: 43.711401, longitude: -79.729162,
    assetClassId: "multifamily", status: "stabilized", verificationStatus: "verified",
    unitCount: 219,
    ownershipNote: t(
      "Built 1982. 1,009 sq ft average. 211 of 219 units rented as at 10 March 2026; average rent $1,840 per unit.",
      "1982 yapımı. Ortalama 1.009 sq ft. 10 Mart 2026 itibarıyla 219 dairenin 211'i kiralık; daire başına ortalama kira 1.840 $.",
    ),
    photo: "brampton-219.png", photoKind: "photo",
  },
  {
    id: "lankin-greenstone-park", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("Greenstone Park", "Greenstone Park"),
    address: t("11350 128 Street NW, Edmonton, Alberta", "11350 128 Street NW, Edmonton, Alberta"),
    city: "Edmonton", province: "Alberta", country: "Canada",
    latitude: 53.5493425, longitude: -113.542861,
    assetClassId: "multifamily", status: "new-construction", verificationStatus: "verified",
    unitCount: 89,
    ownershipNote: t(
      "Built 2022. 976 sq ft average. 88 of 89 units rented as at 10 March 2026; average rent $1,896 per unit.",
      "2022 yapımı. Ortalama 976 sq ft. 10 Mart 2026 itibarıyla 89 dairenin 88'i kiralık; daire başına ortalama kira 1.896 $.",
    ),
    photo: "greenstone-park.png", photoKind: "photo",
  },
  {
    id: "lankin-darcel-avenue", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("Darcel Avenue", "Darcel Avenue"),
    address: t("7110 Darcel Avenue, Mississauga, Ontario", "7110 Darcel Avenue, Mississauga, Ontario"),
    city: "Mississauga", province: "Ontario", country: "Canada",
    latitude: 43.7189128, longitude: -79.6313918,
    assetClassId: "multifamily", status: "stabilized", verificationStatus: "verified",
    unitCount: 118, purchasePrice: 32300000, acquiredOn: "2025-07-21",
    ownershipNote: t(
      "Built 1971. 811 sq ft average. 116 of 118 units rented as at 10 March 2026; average rent $1,591 per unit.",
      "1971 yapımı. Ortalama 811 sq ft. 10 Mart 2026 itibarıyla 118 dairenin 116'sı kiralık; daire başına ortalama kira 1.591 $.",
    ),
    photo: "mississauga-118.png", photoKind: "photo",
  },
  {
    id: "lankin-queen-frederica", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("Queen Frederica", "Queen Frederica"),
    address: t("3045 Queen Frederica Drive, Mississauga, Ontario", "3045 Queen Frederica Drive, Mississauga, Ontario"),
    city: "Mississauga", province: "Ontario", country: "Canada",
    latitude: 43.6079889, longitude: -79.5873891,
    assetClassId: "multifamily", status: "stabilized", verificationStatus: "verified",
    unitCount: 140, purchasePrice: 50000000, acquiredOn: "2025-07-21",
    ownershipNote: t(
      "Built 1975. 743 sq ft average. 132 of 140 units rented as at 10 March 2026; average rent $1,870 per unit.",
      "1975 yapımı. Ortalama 743 sq ft. 10 Mart 2026 itibarıyla 140 dairenin 132'si kiralık; daire başına ortalama kira 1.870 $.",
    ),
    photo: "mississauga-140.png", photoKind: "photo",
  },
  {
    id: "lankin-6-silver-maple", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("6 Silver Maple Court", "6 Silver Maple Court"),
    address: t("6 Silver Maple Court, Brampton, Ontario", "6 Silver Maple Court, Brampton, Ontario"),
    city: "Brampton", province: "Ontario", country: "Canada",
    latitude: 43.7122795, longitude: -79.7296943,
    assetClassId: "multifamily", status: "stabilized", verificationStatus: "verified",
    unitCount: 339, purchasePrice: 115000000, acquiredOn: "2025-12-11",
    ownershipNote: t(
      "Built 1982. 1,007 sq ft average. Held through 6 Silver Maple JV LP, a joint venture. 324 of 339 units rented as at 10 March 2026; average rent $1,869 per unit. Secured by a $97,750,000 credit facility at 6.25%, maturing 1 January 2027.",
      "1982 yapımı. Ortalama 1.007 sq ft. Bir ortak girişim olan 6 Silver Maple JV LP aracılığıyla tutulmaktadır. 10 Mart 2026 itibarıyla 339 dairenin 324'ü kiralık; daire başına ortalama kira 1.869 $. 1 Ocak 2027 vadeli, %6,25 faizli 97.750.000 $ kredi ile teminatlandırılmıştır.",
    ),
    photo: "brampton-339.png", photoKind: "photo",
  },
  {
    // NOT in the May 2026 OM — zero mentions. Closed after the OM date; carried
    // on public reporting and the manager's own fund page, and labelled as such.
    id: "lankin-riverwood-ottawa", offeringIds: [SLUG], managerId: "lankin-investments",
    name: t("The Riverwood", "The Riverwood"),
    address: t("1551 Lycée Place, Ottawa, Ontario K1G 0E5", "1551 Lycée Place, Ottawa, Ontario K1G 0E5"),
    city: "Ottawa", province: "Ontario", country: "Canada",
    latitude: 45.4084547, longitude: -75.6626657,
    assetClassId: "multifamily", status: "stabilized", verificationStatus: "partial",
    unitCount: 258, purchasePrice: 72000000,
    ownershipNote: t(
      "23-storey concrete high-rise; 115 one-bedroom and 143 two-bedroom suites. Acquired May 2026, after the date of the 1 May 2026 Offering Memorandum, and therefore not described in it.",
      "23 katlı betonarme yüksek yapı; 115 adet 1+1 ve 143 adet 2+1 daire. 1 Mayıs 2026 tarihli Teklif Muhtırasından sonra, Mayıs 2026'da satın alınmıştır ve bu nedenle muhtırada yer almamaktadır.",
    ),
  },
];

/**
 * OM Item 5.1.1 — five series of Class A Units. Series D and D-U have nil units
 * outstanding (Item 4.1) but are offered, so they belong on the profile.
 * Unit prices are the audited net assets per unit at 31 Dec 2025 (Item 14).
 */
type SeriesSpec = {
  id: string; name: string; price?: number; channel: [string, string];
  commission: [string, string]; trailer: [string, string]; redemption: [string, string];
  accounts: string[];
};
const SERIES: SeriesSpec[] = [
  {
    id: "lankin-series-a", name: "Class A Units — Series A", price: 10.61,
    channel: ["Direct or through an exempt market dealer", "Doğrudan veya muaf piyasa aracısı üzerinden"],
    commission: ["Selling commission up to 8%; marketing fee up to 2%", "Satış komisyonu %8'e kadar; pazarlama ücreti %2'ye kadar"],
    trailer: ["No trailer fee", "Kuyruk ücreti yok"],
    redemption: [
      "Redemption deduction 8% within 6 months, 8% in year 1, 7% in year 2, 6% in year 3, nil thereafter.",
      "İtfa kesintisi: 6 ay içinde %8, 1. yıl %8, 2. yıl %7, 3. yıl %6, sonrasında yok.",
    ],
    accounts: ["RRSP", "RRIF", "TFSA", "RESP", "LIRA"],
  },
  {
    id: "lankin-series-c", name: "Class A Units — Series C", price: 10.95,
    channel: ["Through a CIRO investment dealer", "CIRO yatırım aracısı üzerinden"],
    commission: ["No selling commission; marketing fee up to 2%", "Satış komisyonu yok; pazarlama ücreti %2'ye kadar"],
    trailer: ["Annual trailer fee of 1% of Net Asset Value", "Yıllık kuyruk ücreti: Net Aktif Değerin %1'i"],
    redemption: [
      "Redemption deduction 3% within the first 6 months, nil thereafter.",
      "İtfa kesintisi: ilk 6 ay içinde %3, sonrasında yok.",
    ],
    accounts: ["RRSP", "RRIF", "TFSA", "RESP", "LIRA"],
  },
  {
    id: "lankin-series-d", name: "Class A Units — Series D",
    channel: ["Through a CIRO investment dealer", "CIRO yatırım aracısı üzerinden"],
    commission: ["Selling commission 5%; marketing fee up to 2%", "Satış komisyonu %5; pazarlama ücreti %2'ye kadar"],
    trailer: ["Annual trailer fee of 0.75% of Net Asset Value", "Yıllık kuyruk ücreti: Net Aktif Değerin %0,75'i"],
    redemption: [
      "Redemption deduction 8% within 6 months, 8% in year 1, 7% in year 2, 6% in year 3, nil thereafter.",
      "İtfa kesintisi: 6 ay içinde %8, 1. yıl %8, 2. yıl %7, 3. yıl %6, sonrasında yok.",
    ],
    accounts: ["RRSP", "RRIF", "TFSA", "RESP", "LIRA"],
  },
  {
    id: "lankin-series-d-u", name: "Class A Units — Series D-U (US dollar)",
    channel: ["Through a CIRO investment dealer; denominated in U.S. dollars", "CIRO yatırım aracısı üzerinden; ABD doları cinsinden"],
    commission: ["Selling commission 5%; marketing fee up to 2%", "Satış komisyonu %5; pazarlama ücreti %2'ye kadar"],
    trailer: ["Annual trailer fee of 0.75% of Net Asset Value", "Yıllık kuyruk ücreti: Net Aktif Değerin %0,75'i"],
    redemption: [
      "Redemption deduction 8% within 6 months, 8% in year 1, 7% in year 2, 6% in year 3, nil thereafter. Not a currency hedge.",
      "İtfa kesintisi: 6 ay içinde %8, 1. yıl %8, 2. yıl %7, 3. yıl %6, sonrasında yok. Kur riskinden korunma sağlamaz.",
    ],
    accounts: ["RRSP", "RRIF", "TFSA", "RESP", "LIRA"],
  },
  {
    id: "lankin-series-f", name: "Class A Units — Series F", price: 11.24,
    channel: ["Fee-based accounts with registered advisers", "Kayıtlı danışmanlarla ücret bazlı hesaplar"],
    commission: ["No selling commission; marketing fee up to 2%", "Satış komisyonu yok; pazarlama ücreti %2'ye kadar"],
    trailer: ["No trailer fee", "Kuyruk ücreti yok"],
    redemption: ["No redemption deduction.", "İtfa kesintisi yok."],
    accounts: ["RRSP", "RRIF", "TFSA", "RESP", "LIRA"],
  },
];

/**
 * Only Series A is being sold, so it is the only series published to the
 * portal. The other four stay described above — they are in the OM and can be
 * published by adding their ids here when they open.
 */
const OFFERED_SERIES = ["lankin-series-a"];

function buildShareClasses(): ShareClass[] {
  return SERIES.filter((s) => OFFERED_SERIES.includes(s.id)).map((s) => ({
    id: s.id,
    offeringId: SLUG,
    name: s.name,
    registeredAccountTypes: s.accounts,
    minimumInvestment: { value: 5000, classification: "current", asOfDate: OM_DATE, sourceId: OM, approval: "approved-public" },
    ...(s.price
      ? { unitPrice: { value: s.price, classification: "current", asOfDate: FS_DATE, sourceId: FS, approval: "approved-public" } }
      : {}),
    // Targeted return and distribution appear ONLY in the fact sheet — the OM
    // publishes neither — so they stay sourced to the fact sheet, not the OM.
    targetReturn: { value: "10%-14% targeted annual net return", classification: "target", asOfDate: "2026-03-31", sourceId: FACT, sourcePage: 1, approval: "approved-public" },
    targetDistribution: { value: "7%-8% targeted annualized cash distribution, paid monthly", classification: "target", asOfDate: "2026-03-31", sourceId: FACT, sourcePage: 1, approval: "approved-public" },
    term: { value: "Open-ended trust; Units offered on a continuous basis", classification: "current", asOfDate: OM_DATE, sourceId: OM, approval: "approved-public" },
    redemptionTerms: t(s.redemption[0], s.redemption[1]),
    drip: t(
      "DRIP available: distributions reinvested at a 2% discount to the most recent subscription price, with no commissions or service charges.",
      "DRIP mevcut: dağıtımlar, en son abonelik fiyatına göre %2 indirimle, komisyon veya hizmet bedeli olmaksızın yeniden yatırılır.",
    ),
    // `audience: "advisor"` on the three compensation facts: the sales channel
    // names the dealer, and the commission and trailer fee are what the dealer
    // is paid. They are in the OM the investor can open, and in the advisor
    // view. They are not decision facts on an investment page.
    fundDefinedFacts: [
      { id: `${s.id}-channel`, label: t("Sales channel", "Satış kanalı"), value: t(s.channel[0], s.channel[1]), category: "term", shareClassId: s.id, sourceId: OM, effectiveDate: OM_DATE, approval: "approved-public", audience: "advisor" },
      { id: `${s.id}-commission`, label: t("Selling commission", "Satış komisyonu"), value: t(s.commission[0], s.commission[1]), category: "fee", shareClassId: s.id, sourceId: OM, effectiveDate: OM_DATE, approval: "approved-public", audience: "advisor" },
      { id: `${s.id}-trailer`, label: t("Annual trailer fee", "Yıllık kuyruk ücreti"), value: t(s.trailer[0], s.trailer[1]), category: "fee", shareClassId: s.id, sourceId: OM, effectiveDate: OM_DATE, approval: "approved-public", audience: "advisor" },
      { id: `${s.id}-redemption`, label: t("Redemption deduction", "İtfa kesintisi"), value: t(s.redemption[0], s.redemption[1]), category: "early-exit", shareClassId: s.id, sourceId: OM, effectiveDate: OM_DATE, approval: "approved-public" },
      { id: `${s.id}-minimum`, label: t("Minimum subscription", "Asgari abonelik"), value: t("$5,000", "5.000 $"), category: "term", shareClassId: s.id, sourceId: OM, effectiveDate: OM_DATE, approval: "approved-public" },
    ],
  })) as ShareClass[];
}

/** Offering-level facts, all from the OM. */
const FUND_FACTS = [
  ["lankin-asset-management-fee", "fee", "Asset management fee", "Yönetim ücreti",
   "0.7% of Gross Asset Value per year, payable monthly to the Asset Manager.",
   "Yıllık Brüt Aktif Değerin %0,7'si, Varlık Yöneticisine aylık ödenir."],
  ["lankin-profit-share-fee", "fee", "Profit share fee", "Kâr payı ücreti",
   "30% of the sum of Distributable Cash paid and Profit Share Fee paid for a period, plus 30% of any increase in Property Net Asset Value recognised on a Realization Event, accrued and paid quarterly.",
   "Bir dönemde ödenen Dağıtılabilir Nakit ile ödenen Kâr Payı Ücreti toplamının %30'u, artı bir Realizasyon Olayında kaydedilen Mülk Net Aktif Değeri artışının %30'u; üç ayda bir tahakkuk eder ve ödenir."],
  ["lankin-acquisition-fee", "fee", "Acquisition fee", "Satın alma ücreti",
   "1% of the acquisition price of each Property, excluding costs of acquisition.",
   "Her mülkün satın alma bedelinin %1'i, satın alma masrafları hariç."],
  ["lankin-financing-fee", "fee", "Financing fee", "Finansman ücreti",
   "1% of the gross financing amount, including refinancings, extensions and renewals.",
   "Yeniden finansman, uzatma ve yenilemeler dahil brüt finansman tutarının %1'i."],
  ["lankin-disposition-fee", "fee", "Disposition fee", "Elden çıkarma ücreti",
   "1% of the sale price of each Property sold, excluding costs of disposition.",
   "Satılan her mülkün satış bedelinin %1'i, elden çıkarma masrafları hariç."],
  ["lankin-trustee-fee", "fee", "Trustee fee", "Mütevelli ücreti",
   "$7,500 per year to Olympia Trust Company, plus reimbursement of expenses.",
   "Olympia Trust Company'ye yılda 7.500 $, artı masrafların iadesi."],
  ["lankin-maximum-offering", "term", "Maximum offering", "Azami teklif",
   "$250,000,000. There is no minimum offering — you may be the only purchaser.",
   "250.000.000 $. Asgari teklif yoktur — tek alıcı siz olabilirsiniz."],
  ["lankin-redemption-limit", "liquidity", "Annual cash redemption limit", "Yıllık nakit itfa limiti",
   "The greater of $100,000 or 5% of the Net Asset Value of all Units as at the start of the calendar year. Above that limit the Trust may pay in Redemption Notes, which are not qualified investments for Registered Plans.",
   "Takvim yılı başındaki tüm Birimlerin Net Aktif Değerinin %5'i ile 100.000 $'dan yüksek olanı. Bu limitin üzerinde Tröst, Kayıtlı Planlar için uygun yatırım sayılmayan İtfa Senetleri ile ödeme yapabilir."],
  ["lankin-redemption-notice", "liquidity", "Redemption notice", "İtfa bildirimi",
   "Written request at least 90 days before a Redemption Date. Redemption Dates are the last day of each month.",
   "Bir İtfa Tarihinden en az 90 gün önce yazılı talep. İtfa Tarihleri her ayın son günüdür."],
  ["lankin-subscription-price", "term", "Subscription price", "Abonelik fiyatı",
   "Set by the Administrator with reference to the Net Asset Value of the Units on each Valuation Date.",
   "Her Değerleme Tarihinde Birimlerin Net Aktif Değerine göre Yönetici tarafından belirlenir."],
  ["lankin-fund-manager", "term", "Investment fund manager", "Yatırım fonu yöneticisi",
   "Axcess Capital Advisors Inc. The trustee is Olympia Trust Company, which has delegated management to Lankin Apartment Asset Management Inc.",
   "Axcess Capital Advisors Inc. Mütevelli, yönetimi Lankin Apartment Asset Management Inc.'e devreden Olympia Trust Company'dir."],
  ["lankin-dealer", "term", "Exempt market dealer", "Muaf piyasa aracısı",
   "Parvis Investment Services Inc. Several Parvis dealing representatives are also employees of the Administrator; the OM discloses this as a conflict of interest.",
   "Parvis Investment Services Inc. Bazı Parvis işlem temsilcileri aynı zamanda Yöneticinin çalışanlarıdır; muhtıra bunu bir çıkar çatışması olarak açıklar."],
] as const;

/** OM Item 10 risk headings, grouped to the platform's six categories. */
const RISKS = [
  ["investment", "No assurance of investment return. The purchase of Units is highly speculative and you should invest only if you can bear the loss of your entire investment.", "Yatırım getirisi garantisi yoktur. Birim alımı yüksek risklidir; yalnızca yatırımınızın tamamını kaybetmeyi göze alabiliyorsanız yatırım yapın."],
  ["investment", "Past performance is not a predictor of future results, and the Trust has a limited operating history.", "Geçmiş performans gelecekteki sonuçların göstergesi değildir ve Tröstün faaliyet geçmişi sınırlıdır."],
  ["investment", "The price for the Units is determined by the Administrator with reference to Net Asset Value, not by a market.", "Birim fiyatı bir piyasa tarafından değil, Net Aktif Değere göre Yönetici tarafından belirlenir."],
  ["investment", "Series risk: each series bears different fees and expenses, so the value of each series will differ over time.", "Seri riski: her seri farklı ücret ve giderler taşır; bu nedenle her serinin değeri zamanla farklılaşır."],
  ["investment", "Fund-of-fund risk: the Trust does not carry on active business and invests substantially all of its assets in the Partnership.", "Fon-fonu riski: Tröst aktif ticari faaliyet yürütmez ve varlıklarının tamamına yakınını Ortaklığa yatırır."],
  ["redemption", "Restrictions on redemption and transfer; Units are illiquid, there is no market for them, and you will be restricted from selling for an indefinite period.", "İtfa ve devir kısıtlamaları; Birimler likit değildir, bir piyasası yoktur ve satış belirsiz bir süre boyunca kısıtlanacaktır."],
  ["redemption", "Cash redemptions are capped annually at the greater of $100,000 or 5% of Net Asset Value, and require 90 days' notice.", "Nakit itfalar yıllık olarak 100.000 $ ile Net Aktif Değerin %5'inden yüksek olanı ile sınırlıdır ve 90 gün önceden bildirim gerektirir."],
  ["redemption", "Above the cash limit the Trust may pay in Redemption Notes, which are unsecured, may be subordinated, and are not qualified investments for Registered Plans.", "Nakit limitinin üzerinde Tröst, teminatsız, tali nitelikte olabilen ve Kayıtlı Planlar için uygun yatırım sayılmayan İtfa Senetleri ile ödeme yapabilir."],
  ["redemption", "A redemption deduction applies to most series based on how long the Units are held.", "Çoğu seride, Birimlerin elde tutulma süresine göre bir itfa kesintisi uygulanır."],
  ["tax", "Distributions characterized as a return of capital reduce your adjusted cost base, producing a larger capital gain on disposition; the Trust has paid distributions exceeding cash flow from operations.", "Sermaye iadesi olarak nitelendirilen dağıtımlar düzeltilmiş maliyet esasınızı azaltır ve elden çıkarmada daha büyük bir sermaye kazancı doğurur; Tröst, faaliyetlerden gelen nakit akışını aşan dağıtımlar yapmıştır."],
  ["tax", "The Trust must maintain mutual fund trust status under the Tax Act for Units to remain eligible for Registered Plans; SIFT rules may also apply.", "Birimlerin Kayıtlı Planlar için uygun kalması adına Tröst, Vergi Kanunu uyarınca yatırım fonu tröstü statüsünü korumalıdır; SIFT kuralları da uygulanabilir."],
  ["regulatory", "No securities regulatory authority has reviewed this offering, and the Trust is not a reporting issuer.", "Hiçbir menkul kıymet düzenleyicisi bu teklifi incelememiştir ve Tröst raporlayan bir ihraççı değildir."],
  ["regulatory", "The Trust is not a public mutual fund, investment fund or trust company, so certain investor protections in those regulations are not available.", "Tröst; halka açık bir yatırım fonu, yatırım fonu veya tröst şirketi değildir; bu nedenle bu düzenlemelerdeki bazı yatırımcı korumaları geçerli değildir."],
  ["regulatory", "No independent counsel represents Unitholders, and the Declaration of Trust expressly permits a range of conflicts of interest, including related-party transactions.", "Birim sahiplerini bağımsız bir hukuk müşaviri temsil etmez ve Tröst Sözleşmesi, ilişkili taraf işlemleri dahil bir dizi çıkar çatışmasına açıkça izin verir."],
  ["leverage", "The Trust and Partnership use leverage. Debt must be serviced regardless of operating results, and refinancing terms may differ from those assumed — including the $97,750,000 facility on 6 Silver Maple Court maturing 1 January 2027.", "Tröst ve Ortaklık kaldıraç kullanır. Borç, faaliyet sonuçlarından bağımsız olarak ödenmelidir ve yeniden finansman koşulları varsayılanlardan farklı olabilir — 1 Ocak 2027'de vadesi dolan 6 Silver Maple Court üzerindeki 97.750.000 $ kredi dahil."],
  ["leverage", "Interest rate fluctuations and mortgage financing risk may reduce cash available for distribution.", "Faiz oranı dalgalanmaları ve ipotek finansman riski, dağıtım için mevcut nakdi azaltabilir."],
  ["business", "Concentration of investments and lack of geographic diversification, with the portfolio concentrated in Ontario and Alberta.", "Yatırım yoğunlaşması ve coğrafi çeşitlendirme eksikliği; portföy Ontario ve Alberta'da yoğunlaşmıştır."],
  ["business", "Real estate is relatively illiquid and its value depends on appraisals, market conditions and competition for tenants.", "Gayrimenkul görece likit değildir ve değeri değerlemelere, piyasa koşullarına ve kiracı rekabetine bağlıdır."],
  ["business", "Rent control legislation limits the rate at which in-place rents can be increased.", "Kira kontrolü mevzuatı, mevcut kiraların artırılabileceği oranı sınırlar."],
  ["business", "Properties are subject to environmental risks and the risk of uninsured losses.", "Mülkler çevresel risklere ve sigortasız zarar riskine tabidir."],
  ["business", "Dependence on key personnel and reliance on the Administrator, the Partnership and third-party property managers.", "Kilit personele bağımlılık ve Yöneticiye, Ortaklığa ve üçüncü taraf mülk yöneticilerine dayanma."],
  ["business", "Joint venture risk: 6 Silver Maple Court is held through 6 Silver Maple JV LP rather than wholly owned.", "Ortak girişim riski: 6 Silver Maple Court, tamamen sahip olunmak yerine 6 Silver Maple JV LP aracılığıyla tutulmaktadır."],
] as const;

const SOURCES = [
  // `documentSlug` is what files this source's facts under the OM on the
  // Documents tab. Without it the OM's terms have no document to sit under.
  { id: OM, title: t("Lankin Apartment REIT — Offering Memorandum, 1 May 2026 (SEDAR filing version)", "Lankin Apartment REIT — Teklif Muhtırası, 1 Mayıs 2026 (SEDAR başvuru sürümü)"), publisher: "Lankin Apartment Real Estate Investment Trust", publishedOn: OM_DATE, documentSlug: "lankin-om" },
  { id: FS, title: t("Audited financial statements for the year ended 31 December 2025 (BDO Canada LLP)", "31 Aralık 2025 tarihinde sona eren yıla ait denetlenmiş mali tablolar (BDO Canada LLP)"), publisher: "BDO Canada LLP", publishedOn: FS_DATE },
  { id: FACT, title: t("Lankin Apartment REIT — Fund Fact Sheet, Q1 2026 (Series A)", "Lankin Apartment REIT — Fon Bilgi Formu, 2026 1Ç (A Serisi)"), publisher: "Lankin Investments", publishedOn: "2026-03-31", documentSlug: "lankin-fact" },
  { id: SITE, title: t("Lankin Apartment REIT fund page", "Lankin Apartment REIT fon sayfası"), publisher: "Lankin Investments", publishedOn: TODAY, url: "https://lankin.com/lankin-apartment-reit/" },
  { id: RENX, title: t("Public reporting: Lankin REIT acquires 258-unit Ottawa apartment for $72M", "Kamuya açık haber: Lankin REIT, 258 daireli Ottawa apartmanını 72M$'a satın aldı"), publisher: "Real Estate News Exchange", publishedOn: "2026-05-01", url: "https://renx.ca/lankin-reit-acquires-258-unit-ottawa-apartment-for-72m" },
] as const;

async function uploadPhotos(): Promise<Map<string, string>> {
  const paths = new Map<string, string>();
  if (!PHOTO_DIR) return paths;
  for (const property of PROPERTIES) {
    if (!property.photo) continue;
    const local = join(PHOTO_DIR, property.photo);
    if (!existsSync(local)) { console.warn(`  missing ${local}`); continue; }
    const storagePath = `${SLUG}/media/properties/${property.photo}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, readFileSync(local), { contentType: "image/png", upsert: true });
    if (error) throw new Error(`upload ${storagePath}: ${error.message}`);
    paths.set(property.id, storagePath);
  }
  return paths;
}

function buildBundle(base: OfferingBundle, photoPaths: Map<string, string>): OfferingBundle {
  const properties = PROPERTIES.map((spec) => {
    const { photo, photoKind, ...property } = spec;
    const storagePath = photoPaths.get(spec.id);
    return {
      ...property,
      ...(storagePath
        ? { media: { card: { bucket: BUCKET, path: storagePath, alt: property.name, kind: photoKind ?? "photo", sourceId: "lankin-deck-2026-03", verifiedAt: TODAY } } }
        : {}),
    };
  });

  const shareClasses = buildShareClasses();
  return {
    ...base,
    // The seed carried the OM as version "2026" effective 2026-01-15. The OM in
    // hand is dated 1 May 2026 — the same date every fact cites.
    documents: base.documents.map((document) =>
      document.id === "lankin-om"
        ? { ...document, version: "2026.05", effectiveDate: OM_DATE }
        : document,
    ),
    fundType: t(
      "Open-ended unincorporated investment trust (Ontario). Qualifies as a \"mutual fund trust\" for Income Tax Act purposes only — it is not a mutual fund or non-redeemable investment fund under securities law.",
      "Açık uçlu, tüzel kişiliği olmayan yatırım tröstü (Ontario). Yalnızca Gelir Vergisi Kanunu açısından \"yatırım fonu tröstü\" sayılır — menkul kıymet mevzuatı uyarınca yatırım fonu veya itfa edilemez yatırım fonu değildir.",
    ),
    // The one-line legal form for the manager summary card. `fundType` above
    // keeps the full statement, which is a term of the OM and shows there.
    structureLabel: t(
      "Open-ended unincorporated investment trust (Ontario)",
      "Açık uçlu, tüzel kişiliği olmayan yatırım tröstü (Ontario)",
    ),
    fundStatus: t("Offering Memorandum — continuous private placement", "Teklif Muhtırası — sürekli özel yerleştirme"),
    inceptionDate: "2024-05",
    aum: { value: "$580M+", classification: "current", asOfDate: TODAY, sourceId: SITE, approval: "approved-public" },
    offeringSize: omValue(250000000),
    managementFee: t("0.7% of Gross Asset Value per year, paid monthly", "Yıllık Brüt Aktif Değerin %0,7'si, aylık ödenir"),
    properties,
    propertyIds: properties.map((p) => p.id),
    shareClasses,
    shareClassIds: shareClasses.map((s) => s.id),
    risks: RISKS.map(([category, en, tr]) => ({ text: t(en, tr), category })),
    sources: [...SOURCES],
    fundDefinedFacts: FUND_FACTS.map(([id, category, labelEn, labelTr, valueEn, valueTr]) => ({
      id, label: t(labelEn, labelTr), value: t(valueEn, valueTr), category,
      sourceId: OM, effectiveDate: OM_DATE, approval: "approved-public",
    })),
    portfolioFacts: [
      { value: "9 properties", classification: "current", asOfDate: TODAY, sourceId: SITE, approval: "approved-public" },
      { value: "1,692 units", classification: "current", asOfDate: TODAY, sourceId: SITE, approval: "approved-public" },
      { value: "5 cities across Ontario and Alberta", classification: "current", asOfDate: TODAY, sourceId: SITE, approval: "approved-public" },
      { value: "$450.7M gross assets (audited, 31 Dec 2025)", classification: "historical", asOfDate: FS_DATE, sourceId: FS, approval: "approved-public" },
    ],
    // Each firm's OWN engagement and date. Without these the interface has no
    // date to show beside an auditor except the offering's verifiedAt — Hunter's
    // data-check date — which then reads as an audit date.
    serviceProviders: {
      auditor: {
        name: "BDO Canada LLP",
        url: "https://www.bdo.ca/",
        // OM Item 14: audit reports on the Trust and on Lankin Apartment LP,
        // both signed Oakville, Ontario, 30 April 2026.
        scope: t("FY2025 statements, report dated 30 Apr 2026", "2025 mali yılı tabloları, rapor tarihi 30 Nis 2026"),
        asOfDate: "2026-04-30",
        sourceId: FS,
      },
      legalCounsel: {
        name: "Borden Ladner Gervais LLP (BLG)",
        url: "https://www.blg.com/en",
        // OM Item 8, and the expert statement at OM p.104.
        scope: t("Item 8 tax opinion in the OM", "Muhtırada Madde 8 vergi görüşü"),
        asOfDate: OM_DATE,
        sourceId: OM,
      },
      appraiser: {
        name: "Avison Young",
        url: "https://www.avisonyoung.com/",
        // The OM never names an appraiser — it refers only to unnamed
        // "qualified valuation professionals". The Q1 2026 fact sheet names
        // Avison Young, so the fact sheet is the source of record here.
        scope: t("Named on the Q1 2026 fact sheet", "2026 1Ç bilgi formunda belirtilmiştir"),
        asOfDate: "2026-03-31",
        sourceId: FACT,
      },
    },
    complianceProfile: {
      ...base.complianceProfile,
      reviewedAt: undefined,
      issuerLegalType: "trust",
      // OM 2.1.2 and 10.2.24: NOT a mutual fund or non-redeemable investment
      // fund under securities law, however it qualifies as a "mutual fund trust"
      // under the Tax Act. This flag is the securities-law meaning, and it is
      // what gates the offering-memorandum exemption route in
      // lib/equity-market/ontario-investor-assessment.ts — that route is unavailable
      // to investment funds, so the previous `true` was suppressing it wrongly.
      isInvestmentFund: false,
      // `approvedOntarioExemptions` and `reviewedAt` are DELIBERATELY untouched.
      // The OM states the Trust files on SEDAR only as required by NI 45-106
      // s.2.9, which points at the offering-memorandum exemption — but approving
      // an exemption route is a licensed compliance decision, not a data-entry
      // one. Left unset so the assessment reports "compliance not confirmed"
      // rather than silently claiming a review that has not happened.
    },
    updateCadence: "quarterly",
    dataAsOf: AS_OF,
    dataPeriodLabel: "Q2 2026",
    managerPublicUrl: "https://lankin.com/lankin-apartment-reit/",
    lastUpdated: OM_DATE,
    verifiedAt: TODAY,
  } as OfferingBundle;
}

async function main() {
  const base = JSON.parse(readFileSync(seedPath, "utf8")) as OfferingBundle;
  const photoPaths = await uploadPhotos();
  const bundle = buildBundle(base, photoPaths);

  const total = bundle.properties.reduce((sum, p) => sum + (p.unitCount ?? 0), 0);
  const omUnits = bundle.properties.filter((p) => p.id !== "lankin-riverwood-ottawa").reduce((s, p) => s + (p.unitCount ?? 0), 0);
  console.log(`Portfolio: ${bundle.properties.length} properties, ${total.toLocaleString("en-CA")} units`);
  console.log(`  of which the OM's eight buildings: ${omUnits.toLocaleString("en-CA")} units`);
  console.log(`Series: ${bundle.shareClasses.length}`);

  writeFileSync(seedPath, `${JSON.stringify(bundle, null, 2)}\n`);

  const saved = await supabase.rpc("save_offering_draft", { p_bundle: bundle as never });
  if (saved.error) throw new Error(`save_offering_draft: ${saved.error.message}`);
  const actor = process.env.LANKIN_ACTOR_USER_ID ?? "ce032bb9-3aea-4610-a70c-0b7de9637397";
  const published = await supabase.rpc("publish_offering", { p_offering_id: saved.data as string, p_actor: actor });
  if (published.error) throw new Error(`publish_offering: ${published.error.message}`);

  const review = await supabase.rpc("record_offering_review", {
    p_offering_id: saved.data as string,
    p_outcome: "updated",
    p_data_as_of: AS_OF,
    p_period_label: "Q2 2026",
    p_fields_changed: [
      "fundType", "structureLabel", "fundStatus", "inceptionDate", "aum", "aumNote",
      "offeringSize", "managementFee", "shareClasses", "fundDefinedFacts",
      "fundDefinedFacts.audience", "properties", "portfolioFacts", "risks",
      "sources", "documents.lankin-om", "serviceProviders", "serviceProviders.scope",
      "complianceProfile.isInvestmentFund", "dataAsOf",
    ],
    p_note:
      "Reconciled to the Offering Memorandum dated 1 May 2026 (SEDAR filing version) and its audited 2025 financial statements. " +
      "Corrections: redemption schedule (was Y1 10/Y2 8/Y3 6; OM Series A is 8/8/7/6/0), isInvestmentFund true→false per OM 2.1.2 and 10.2.24, " +
      "one share class→five series (A, C, D, D-U, F), unit price $10.74→audited NAV per unit, management fee restated as 0.7% of Gross Asset Value, " +
      "all eight OM property names and addresses. The Ottawa property is not in the OM (closed after 1 May 2026) and is labelled as such. " +
      "Disclosure pass: OM document record was version 2026 effective 2026-01-15; the OM is dated 1 May 2026. " +
      "Service providers now carry their own engagement and date — the audit is FY2025, report dated 30 Apr 2026, which is NOT the profile's verifiedAt. " +
      "Avison Young is named on the Q1 2026 fact sheet, not in the OM; sourced accordingly. " +
      "Sales channel, selling commission and trailer fee marked audience=advisor. " +
      "AUM $580M+ carries the fact sheet's footnote that it includes the fund's interest in an associated JV (audited gross assets were $450.7M at 31 Dec 2025). " +
      "Open: the manager's site says 1,694 units vs 1,692 on file.",
  });
  if (review.error) throw new Error(`record_offering_review: ${review.error.message}`);
  console.log("Saved, published and review recorded.");
}

await main();
