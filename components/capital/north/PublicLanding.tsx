"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileSearch,
  KeyRound,
  Landmark,
  Layers3,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserCheck,
  WalletCards,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import {
  formatCurrencyCad,
  formatDate,
  formatReturnPhrase,
  formatSourceLine,
} from "@/lib/capital/present";
import { assetClasses, regions, strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import type {
  PublicOfferingPreview,
  PublicOfferingPropertyPreview,
} from "@/lib/capital/types";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

const COPY = {
  en: {
    signIn: "Sign in",
    create: "Create account",
    navOpportunities: "Opportunities",
    navPortal: "Inside the portal",
    navProcess: "How it works",
    eyebrow: "Canadian private real estate · Private markets",
    title: "Private real estate opportunities, selected and made clear.",
    body: "Explore curated Canadian investments with tangible asset context, source-dated information, and a human-supported path to licensed review.",
    explore: "Explore opportunities",
    heroCreate: "Create an investor account",
    trust: ["Curated private-market access", "Source-dated information", "Supervised by Parvis"],
    liveLabel: "Investment access",
    liveValue: "Real assets. Clear terms.",
    opportunitiesEyebrow: "Featured opportunities",
    opportunitiesTitle: "See the investment—and the real estate beneath it.",
    opportunitiesBody: "Start with a concise public view. Create an account to review complete terms, documents, and the licensed next steps.",
    available: "Available",
    minimum: "Minimum investment",
    distribution: "Target distribution",
    portfolio: "Portfolio",
    verifiedLocations: "verified locations",
    aum: "Assets under management",
    term: "Fund term",
    reviewRequired: "Review required",
    notGuaranteed: "not guaranteed",
    verifiedAsOf: "Verified",
    viewOpportunity: "Create account to view",
    accountNote: "Full terms and documents are account-gated.",
    portalEyebrow: "Inside the portal",
    portalTitle: "Move from an opportunity overview to decision-ready detail.",
    portalBody: "One bilingual workspace connects the investment vehicle, underlying properties, source documents, and a licensed conversation.",
    portalTabs: ["Overview", "Performance", "Buildings", "Documents"],
    previewLabel: "Opportunity overview",
    previewName: "Selected Canadian real estate",
    previewManager: "Curated by Hunter & Hunter",
    previewFacts: "Key facts",
    previewSource: "Source and verification date shown with every material figure",
    callouts: [
      { title: "Underlying assets", body: "See the properties behind the investment." },
      { title: "Important terms", body: "Review minimums, distributions, and structure." },
      { title: "Source documents", body: "Trace material information to dated sources." },
      { title: "Licensed conversation", body: "Continue with human-supported review." },
    ],
    structureEyebrow: "How the structure works",
    structureTitle: "From investor capital to a portfolio of real properties.",
    structureBody: "A private offering or REIT pools capital into professionally managed real estate rather than a publicly traded share of one building.",
    flow: [
      { title: "Investor capital", body: "Your selected allocation" },
      { title: "Private offering or REIT", body: "The investment vehicle" },
      { title: "Property portfolio", body: "Canadian real assets" },
      { title: "Active management", body: "Operations and rental income" },
      { title: "Potential outcomes", body: "Distributions and value growth" },
    ],
    structureFoot: "Distributions and value growth are not guaranteed. Availability, eligibility, and suitability require review.",
    footprintEyebrow: "Underlying real estate",
    footprintTitle: "A tangible view of where capital is deployed.",
    footprintBody: "Verified property media appears when supplied. Until then, the portfolio map uses verified asset locations without substituting stock imagery.",
    mapTitle: "Published portfolio locations",
    mapAria: "Map of verified Canadian property locations",
    benefitsEyebrow: "Why Hunter & Hunter",
    benefitsTitle: "Access with clarity before capital.",
    benefits: [
      { title: "Curated access", body: "Selected Canadian private real-estate opportunities in one focused experience." },
      { title: "Asset-level clarity", body: "Move from the fund to its properties, terms, and dated source material." },
      { title: "Licensed human review", body: "Continue through a Parvis-supervised process supported by a real person." },
    ],
    processEyebrow: "How access works",
    processTitle: "Three steps from first look to informed review.",
    process: [
      { n: "01", title: "Create an account", body: "Verify your email and start the individual-investor path." },
      { n: "02", title: "Explore opportunities", body: "Review complete terms, assets, documents, and source dates." },
      { n: "03", title: "Begin licensed review", body: "Record interest and continue through supervised next steps." },
    ],
    finalTitle: "Private real estate, made more tangible.",
    finalBody: "Create an account to explore complete opportunities and begin the right conversation with Hunter & Hunter Investment Advisors.",
    legal: "Hunter & Hunter supports research, education, interest records, and licensed-process coordination. Registrable securities activity is conducted through and supervised by Parvis.",
  },
  tr: {
    signIn: "Giriş yap",
    create: "Hesap oluştur",
    navOpportunities: "Fırsatlar",
    navPortal: "Portalın içi",
    navProcess: "Nasıl işler",
    eyebrow: "Kanada özel gayrimenkulü · Özel piyasalar",
    title: "Seçilmiş ve anlaşılır hale getirilmiş özel gayrimenkul fırsatları.",
    body: "Somut varlık bağlamı, kaynak tarihli bilgiler ve lisanslı incelemeye uzanan insan destekli süreçle seçili Kanada yatırımlarını keşfedin.",
    explore: "Fırsatları keşfedin",
    heroCreate: "Yatırımcı hesabı oluşturun",
    trust: ["Seçili özel piyasa erişimi", "Kaynak tarihli bilgi", "Parvis gözetiminde"],
    liveLabel: "Yatırım erişimi",
    liveValue: "Gerçek varlıklar. Net koşullar.",
    opportunitiesEyebrow: "Öne çıkan fırsatlar",
    opportunitiesTitle: "Yatırımı ve altındaki gayrimenkulü birlikte görün.",
    opportunitiesBody: "Kısa bir genel bakışla başlayın. Tüm koşullar, belgeler ve lisanslı sonraki adımlar için hesap oluşturun.",
    available: "Mevcut",
    minimum: "Minimum yatırım",
    distribution: "Hedef dağıtım",
    portfolio: "Portföy",
    verifiedLocations: "doğrulanmış konum",
    aum: "Yönetilen varlıklar",
    term: "Fon süresi",
    reviewRequired: "İnceleme gerekli",
    notGuaranteed: "garanti edilmez",
    verifiedAsOf: "Doğrulandı",
    viewOpportunity: "Görüntülemek için hesap oluşturun",
    accountNote: "Tüm koşullar ve belgeler hesapla görüntülenir.",
    portalEyebrow: "Portalın içinde",
    portalTitle: "Fırsat genel bakışından karar vermeye hazır ayrıntılara ilerleyin.",
    portalBody: "İki dilli tek bir çalışma alanı yatırım aracını, dayanak mülkleri, kaynak belgelerini ve lisanslı görüşmeyi birleştirir.",
    portalTabs: ["Genel Bakış", "Performans", "Binalar", "Belgeler"],
    previewLabel: "Fırsat genel bakışı",
    previewName: "Seçili Kanada gayrimenkulü",
    previewManager: "Hunter & Hunter tarafından seçildi",
    previewFacts: "Temel bilgiler",
    previewSource: "Her önemli rakamla kaynak ve doğrulama tarihi gösterilir",
    callouts: [
      { title: "Dayanak varlıklar", body: "Yatırımın arkasındaki mülkleri görün." },
      { title: "Önemli koşullar", body: "Minimumları, dağıtımları ve yapıyı inceleyin." },
      { title: "Kaynak belgeleri", body: "Önemli bilgileri tarihli kaynaklara kadar izleyin." },
      { title: "Lisanslı görüşme", body: "İnsan destekli incelemeyle ilerleyin." },
    ],
    structureEyebrow: "Yapı nasıl işler",
    structureTitle: "Yatırımcı sermayesinden gerçek mülklerden oluşan portföye.",
    structureBody: "Özel bir fon veya GYO, sermayeyi tek bir binanın halka açık hissesine değil, profesyonelce yönetilen gayrimenkule yönlendirir.",
    flow: [
      { title: "Yatırımcı sermayesi", body: "Seçtiğiniz tahsis" },
      { title: "Özel fon veya GYO", body: "Yatırım aracı" },
      { title: "Mülk portföyü", body: "Kanada gerçek varlıkları" },
      { title: "Aktif yönetim", body: "Operasyonlar ve kira geliri" },
      { title: "Potansiyel sonuçlar", body: "Dağıtım ve değer artışı" },
    ],
    structureFoot: "Dağıtımlar ve değer artışı garanti edilmez. Erişim, uygunluk ve yerindelik incelemeye tabidir.",
    footprintEyebrow: "Dayanak gayrimenkul",
    footprintTitle: "Sermayenin nereye yönlendirildiğine somut bir bakış.",
    footprintBody: "Doğrulanmış mülk görselleri sağlandığında gösterilir. O zamana kadar harita, stok görseller kullanmadan doğrulanmış varlık konumlarını sunar.",
    mapTitle: "Yayınlanmış portföy konumları",
    mapAria: "Doğrulanmış Kanada mülk konumları haritası",
    benefitsEyebrow: "Neden Hunter & Hunter",
    benefitsTitle: "Sermayeden önce netlikle erişim.",
    benefits: [
      { title: "Seçili erişim", body: "Tek odaklı deneyimde seçilmiş Kanada özel gayrimenkul fırsatları." },
      { title: "Varlık düzeyinde netlik", body: "Fondan mülklere, koşullara ve tarihli kaynaklara ilerleyin." },
      { title: "Lisanslı insan incelemesi", body: "Gerçek bir kişiyle, Parvis gözetimindeki süreçte ilerleyin." },
    ],
    processEyebrow: "Erişim nasıl işler",
    processTitle: "İlk bakıştan bilinçli incelemeye üç adım.",
    process: [
      { n: "01", title: "Hesap oluşturun", body: "E-postanızı doğrulayın ve bireysel yatırımcı yolunu başlatın." },
      { n: "02", title: "Fırsatları keşfedin", body: "Tüm koşulları, varlıkları, belgeleri ve kaynak tarihlerini inceleyin." },
      { n: "03", title: "Lisanslı incelemeyi başlatın", body: "İlginizi kaydedin ve gözetimli sonraki adımlarla ilerleyin." },
    ],
    finalTitle: "Özel gayrimenkul, daha somut.",
    finalBody: "Tüm fırsatları keşfetmek ve Hunter & Hunter Investment Advisors ile doğru görüşmeyi başlatmak için hesap oluşturun.",
    legal: "Hunter & Hunter araştırma, eğitim, ilgi kayıtları ve lisanslı süreç koordinasyonunu destekler. Menkul kıymetlere ilişkin kayıtlı faaliyetler Parvis aracılığıyla ve gözetiminde yürütülür.",
  },
} as const;

type Copy = (typeof COPY)["en"];

function fundImage(offering: PublicOfferingPreview) {
  return offering.media?.banner?.src ?? offering.media?.card?.src;
}

function localizedPortfolioFact(value: string, lang: string) {
  if (lang !== "tr") return value;
  return value
    .replace(/\bproperties\b/gi, "mülk")
    .replace(/\bcommunities\b/gi, "yerleşim")
    .replace(/\bunits\b/gi, "ünite");
}

function OpportunityCard({ offering, c }: { offering: PublicOfferingPreview; c: Copy }) {
  const { lang } = useLang();
  const image = offering.media?.card?.src ?? offering.media?.banner?.src;
  const imageAlt = tx(offering.media?.card?.alt ?? offering.media?.banner?.alt, lang) || tx(offering.shortName, lang);
  const strategy = offering.strategyIds[0]
    ? taxonomyLabel(strategies, offering.strategyIds[0], lang)
    : "";
  const asset = offering.assetClassIds[0]
    ? taxonomyLabel(assetClasses, offering.assetClassIds[0], lang)
    : "";
  const region = offering.regionIds
    .slice(0, 2)
    .map((id) => taxonomyLabel(regions, id, lang))
    .join(" · ");
  const portfolioFact = offering.portfolioFacts[0];
  const metrics: Array<{ label: string; value: string; source?: string; target?: boolean }> = [];

  metrics.push({
    label: c.minimum,
    value: offering.minimumInvestment
      ? formatCurrencyCad(offering.minimumInvestment.value, lang)
      : c.reviewRequired,
    source: offering.minimumInvestment ? formatSourceLine(offering.minimumInvestment, lang) ?? undefined : undefined,
  });
  metrics.push({
    label: c.distribution,
    value: offering.targetDistribution
      ? formatReturnPhrase(offering.targetDistribution.value, lang)
      : c.reviewRequired,
    source: offering.targetDistribution
      ? `${formatSourceLine(offering.targetDistribution, lang) ?? ""} · ${c.notGuaranteed}`
      : undefined,
    target: Boolean(offering.targetDistribution),
  });
  metrics.push({
    label: c.portfolio,
    value: portfolioFact
      ? localizedPortfolioFact(portfolioFact.value, lang)
      : `${offering.properties.length} ${c.verifiedLocations}`,
    source: portfolioFact
      ? formatSourceLine(portfolioFact, lang) ?? undefined
      : `${c.verifiedAsOf} · ${formatDate(offering.verifiedAt, lang)}`,
  });
  if (offering.aum) {
    metrics.push({ label: c.aum, value: offering.aum.value, source: formatSourceLine(offering.aum, lang) ?? undefined });
  } else {
    metrics.push({
      label: c.term,
      value: offering.term ? formatReturnPhrase(offering.term.value, lang) : c.reviewRequired,
      source: offering.term ? formatSourceLine(offering.term, lang) ?? undefined : undefined,
    });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dbe1e5] bg-white shadow-[0_6px_22px_-16px_rgba(7,28,44,0.34)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b9c8d1] hover:shadow-[0_18px_36px_-22px_rgba(7,28,44,0.42)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#0a2d46]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={imageAlt} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_78%_20%,rgba(197,163,77,0.32),transparent_35%),linear-gradient(135deg,#071c2c,#0a4b72)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071c2c]/80 via-transparent to-[#071c2c]/10" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/94 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0a2d46]">{c.available}</span>
          {strategy && <span className="rounded-full bg-[#c5a34d] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#071c2c]">{strategy}</span>}
        </div>
        {offering.media?.logo?.src && (
          <div className="absolute bottom-4 left-4 flex h-12 w-28 items-center justify-center rounded-lg bg-white p-2 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={offering.media.logo.src} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0a4b72]">
          {asset && <span>{asset}</span>}
          {asset && region && <span aria-hidden>·</span>}
          {region && <span>{region}</span>}
        </div>
        <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight text-[#102638]">{tx(offering.shortName, lang)}</h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#7a8790]">{tx(offering.managerName, lang)}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#5f6d78]">{tx(offering.summary, lang)}</p>

        <dl className="mt-5 grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#e2e7ea] bg-[#e2e7ea]">
          {metrics.slice(0, 4).map((metric) => (
            <div key={metric.label} className="min-h-28 bg-[#fbfcfc] p-3.5">
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">{metric.label}</dt>
              <dd className="mt-2 text-sm font-semibold leading-5 text-[#172d3d]">{metric.value}</dd>
              {metric.source && <p className={`mt-1.5 text-[10px] leading-4 ${metric.target ? "font-semibold text-[#8a6720]" : "text-[#87939b]"}`}>{metric.source}</p>}
            </div>
          ))}
        </dl>

        <Link href={`${NORTH_BASE}/sign-up?offering=${encodeURIComponent(offering.slug)}&path=investor`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e]">
          {c.viewOpportunity}<ArrowRight className="size-4" />
        </Link>
        <p className="mt-2 text-center text-[10px] leading-4 text-[#7d8992]"><Lock className="mr-1 inline size-3" />{c.accountNote}</p>
      </div>
    </article>
  );
}

function PortalPreview({ offering, c }: { offering?: PublicOfferingPreview; c: Copy }) {
  const { lang } = useLang();
  const calloutIcons = [Building2, FileSearch, MapPin, UserCheck];
  const previewMetrics = [
    {
      label: c.minimum,
      value: offering?.minimumInvestment ? formatCurrencyCad(offering.minimumInvestment.value, lang) : c.reviewRequired,
    },
    {
      label: c.distribution,
      value: offering?.targetDistribution ? formatReturnPhrase(offering.targetDistribution.value, lang) : c.reviewRequired,
    },
    {
      label: c.portfolio,
      value: offering?.portfolioFacts[0]
        ? localizedPortfolioFact(offering.portfolioFacts[0].value, lang)
        : `${offering?.properties.length ?? 0} ${c.verifiedLocations}`,
    },
  ];

  return (
    <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.12fr_0.88fr]">
      <div className="overflow-hidden rounded-2xl border border-[#d5dde2] bg-white shadow-[0_28px_70px_-38px_rgba(7,28,44,0.5)]">
        <div className="flex items-center justify-between border-b border-[#e5eaed] bg-[#fbfcfc] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#d8dde0]" />
            <span className="size-2.5 rounded-full bg-[#d8dde0]" />
            <span className="size-2.5 rounded-full bg-[#c5a34d]" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#70808a]"><Lock className="size-3" />{c.previewLabel}</span>
        </div>
        <div className="bg-[#eef3f4] p-3 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[#dbe1e5] bg-white">
            <div className="relative h-32 overflow-hidden bg-[#0a2d46] sm:h-44">
              {offering && fundImage(offering) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fundImage(offering)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full bg-[radial-gradient(circle_at_80%_20%,rgba(197,163,77,0.3),transparent_32%),linear-gradient(135deg,#071c2c,#0a4b72)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/80 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e1c978]">{c.previewLabel}</p>
                <p className="mt-1 font-serif text-xl font-semibold sm:text-2xl">{offering ? tx(offering.shortName, lang) : c.previewName}</p>
                <p className="mt-1 text-xs text-white/65">{offering ? tx(offering.managerName, lang) : c.previewManager}</p>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-[#e2e7ea] bg-white p-1.5">
              {c.portalTabs.map((tab, index) => (
                <span key={tab} className={`min-w-max flex-1 rounded-md px-3 py-2 text-center text-[11px] font-semibold ${index === 0 ? "bg-[#0a2d46] text-white" : "text-[#71808a]"}`}>{tab}</span>
              ))}
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold text-[#142b3b]">{c.previewFacts}</h3>
                <span className="hidden text-[10px] font-semibold text-[#70808a] sm:block">{c.previewSource}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {previewMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-[#e1e6e9] bg-[#f8fafb] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7a8790]">{metric.label}</p>
                    <p className="mt-1.5 text-xs font-semibold leading-5 text-[#183043] sm:text-sm">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {c.callouts.map((callout, index) => {
          const Icon = calloutIcons[index] ?? CheckCircle2;
          return (
            <article key={callout.title} className="flex gap-4 rounded-xl border border-[#dce3e7] bg-white p-5 shadow-[0_4px_18px_-16px_rgba(7,28,44,0.35)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#0a2d46] text-[#d6b96e]"><Icon className="size-5" /></span>
              <div><h3 className="font-semibold text-[#152b3b]">{callout.title}</h3><p className="mt-1 text-sm leading-5 text-[#66757e]">{callout.body}</p></div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PropertyGallery({ properties }: { properties: PublicOfferingPropertyPreview[] }) {
  const { lang } = useLang();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.slice(0, 6).map((property) => {
        const image = property.media?.card ?? property.media?.gallery?.[0];
        if (!image?.src) return null;
        return (
          <article key={property.id} className="overflow-hidden rounded-xl border border-white/12 bg-white/7">
            <div className="aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={tx(image.alt, lang) || tx(property.name, lang)} className="h-full w-full object-cover" />
            </div>
            <div className="p-4"><h3 className="font-semibold text-white">{tx(property.name, lang)}</h3><p className="mt-1 text-xs text-white/55">{property.city}, {property.province}</p></div>
          </article>
        );
      })}
    </div>
  );
}

function PortfolioMap({ properties, c }: { properties: PublicOfferingPropertyPreview[]; c: Copy }) {
  const { lang } = useLang();
  const xFor = (longitude: number) => Math.max(65, Math.min(935, 65 + ((longitude + 141) / 91) * 870));
  const yFor = (latitude: number) => Math.max(55, Math.min(385, 55 + ((70 - latitude) / 30) * 330));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#0a2539] shadow-[0_30px_60px_-40px_rgba(0,0,0,0.7)]">
      <div className="border-b border-white/10 px-5 py-4 text-xs font-bold uppercase tracking-[0.13em] text-[#d9c27e]">{c.mapTitle}</div>
      <svg viewBox="0 0 1000 440" role="img" aria-label={c.mapAria} className="block w-full bg-[radial-gradient(circle_at_80%_15%,rgba(197,163,77,0.16),transparent_32%),linear-gradient(145deg,#0a2539,#071c2c)]">
        <title>{c.mapTitle}</title>
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
          {[150, 300, 450, 600, 750, 900].map((x) => <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="440" />)}
          {[90, 180, 270, 360].map((y) => <line key={`y-${y}`} x1="0" y1={y} x2="1000" y2={y} />)}
        </g>
        <path d="M95 235 L150 150 L248 128 L302 88 L410 115 L510 88 L584 126 L694 118 L780 167 L885 182 L930 250 L850 302 L730 308 L655 348 L530 326 L424 351 L328 318 L225 329 L135 287 Z" fill="rgba(47,113,148,0.2)" stroke="rgba(213,231,239,0.2)" strokeWidth="2" />
        <text x="315" y="235" fill="rgba(255,255,255,0.18)" fontSize="18" fontWeight="700" letterSpacing="4">ALBERTA</text>
        <text x="675" y="315" fill="rgba(255,255,255,0.18)" fontSize="18" fontWeight="700" letterSpacing="4">ONTARIO</text>
        {properties.map((property, index) => {
          const x = xFor(property.longitude);
          const y = yFor(property.latitude);
          const textY = y + (index % 2 === 0 ? -18 : 28);
          return (
            <g key={property.id}>
              <circle cx={x} cy={y} r="15" fill="rgba(197,163,77,0.2)" />
              <circle cx={x} cy={y} r="6" fill="#d6b96e" stroke="#fff" strokeWidth="2" />
              <text x={x + 12} y={textY} fill="#fff" fontSize="13" fontWeight="700">{property.city}</text>
            </g>
          );
        })}
      </svg>
      <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <div key={property.id} className="flex items-start gap-2 bg-[#0a2539] px-4 py-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#d6b96e]" />
            <div><p className="text-xs font-semibold text-white">{tx(property.name, lang)}</p><p className="mt-0.5 text-[10px] text-white/50">{property.city}, {property.province} · {taxonomyLabel(assetClasses, property.assetClassId, lang)}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicLanding({ offerings }: { offerings: PublicOfferingPreview[] }) {
  const { lang, setLang } = useLang();
  const c = pick(COPY, lang);
  const heroOfferings = offerings.slice(0, 2);
  const heroPrimary = heroOfferings[0];
  const heroSecondary = heroOfferings[1];
  const propertyMap = new Map<string, PublicOfferingPropertyPreview>();
  offerings.forEach((offering) => offering.properties.forEach((property) => propertyMap.set(property.id, property)));
  const properties = Array.from(propertyMap.values());
  const picturedProperties = properties.filter((property) => Boolean(property.media?.card?.src ?? property.media?.gallery?.[0]?.src));
  const benefitIcons = [Sparkles, Layers3, ShieldCheck];
  const processIcons = [KeyRound, FileSearch, UserCheck];
  const flowIcons = [WalletCards, Landmark, Building2, BarChart3, CircleDollarSign];
  const hasOfferings = offerings.length > 0;

  return (
    <div className="min-h-screen bg-[#f5f7f7] text-[#122b3c]">
      <header className="sticky top-0 z-40 border-b border-[#e0e6ea] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-8">
          <NorthBrand dark />
          <nav aria-label="Landing page" className="hidden items-center gap-6 lg:flex">
            {hasOfferings && <a href="#opportunities" className="text-xs font-semibold text-[#52636f] transition-colors hover:text-[#0a2d46]">{c.navOpportunities}</a>}
            <a href="#portal" className="text-xs font-semibold text-[#52636f] transition-colors hover:text-[#0a2d46]">{c.navPortal}</a>
            <a href="#process" className="text-xs font-semibold text-[#52636f] transition-colors hover:text-[#0a2d46]">{c.navProcess}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="mr-1 hidden rounded-md bg-[#eef2f4] p-0.5 sm:flex">
              {(["en", "tr"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setLang(item)} className={`h-8 rounded px-2.5 text-[11px] font-bold uppercase transition-colors ${lang === item ? "bg-white text-[#0a2d46] shadow-sm" : "text-[#6c7982] hover:text-[#0a2d46]"}`}>{item}</button>
              ))}
            </div>
            <Link href={`${NORTH_BASE}/sign-in`} className="hidden h-10 items-center rounded-md px-3 text-sm font-semibold text-[#0a2d46] hover:bg-[#eef2f4] sm:inline-flex">{c.signIn}</Link>
            <Link href={`${NORTH_BASE}/sign-up?path=investor`} className="inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e]">{c.create}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#071c2c] text-white">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(197,163,77,0.2),transparent_34%),radial-gradient(circle_at_8%_88%,rgba(47,113,148,0.3),transparent_38%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-8 sm:py-18 lg:grid-cols-[0.94fr_1.06fr] lg:py-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b96e]">{c.eyebrow}</p>
              <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-[1.05] sm:text-[3.35rem]">{c.title}</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">{c.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {hasOfferings ? (
                  <a href="#opportunities" className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#0a2d46] transition-transform hover:-translate-y-0.5">{c.explore}<ArrowRight className="size-4" /></a>
                ) : (
                  <Link href={`${NORTH_BASE}/sign-up?path=investor`} className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#0a2d46] transition-transform hover:-translate-y-0.5">{c.heroCreate}<ArrowRight className="size-4" /></Link>
                )}
                {hasOfferings && <Link href={`${NORTH_BASE}/sign-up?path=investor`} className="inline-flex h-12 items-center rounded-md border border-white/24 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">{c.heroCreate}</Link>}
              </div>
              <div className="mt-8 grid gap-3 text-xs text-white/68 sm:grid-cols-3">
                {c.trust.map((item) => <div key={item} className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#d6b96e]" />{item}</div>)}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div aria-hidden className="absolute -inset-5 rounded-[2rem] bg-[#2f7194]/18 blur-2xl" />
              <div className="relative grid h-[25rem] grid-cols-5 grid-rows-5 gap-3 sm:h-[31rem]">
                <div className="relative col-span-5 row-span-3 overflow-hidden rounded-2xl border border-white/14 bg-[#0a2d46] shadow-2xl">
                  {heroPrimary && fundImage(heroPrimary) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fundImage(heroPrimary)} alt={tx(heroPrimary.media?.banner?.alt ?? heroPrimary.media?.card?.alt, lang) || tx(heroPrimary.shortName, lang)} className="h-full w-full object-cover" />
                  ) : <div className="h-full bg-[radial-gradient(circle_at_75%_25%,rgba(197,163,77,0.32),transparent_30%),linear-gradient(135deg,#0a2d46,#071c2c)]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071c2c]/78 via-transparent to-transparent" />
                  {heroPrimary && <p className="absolute bottom-4 left-5 font-serif text-xl font-semibold text-white">{tx(heroPrimary.shortName, lang)}</p>}
                </div>
                <div className="relative col-span-3 row-span-2 overflow-hidden rounded-2xl border border-white/14 bg-[#0a2d46] shadow-xl">
                  {heroSecondary && fundImage(heroSecondary) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fundImage(heroSecondary)} alt={tx(heroSecondary.media?.banner?.alt ?? heroSecondary.media?.card?.alt, lang) || tx(heroSecondary.shortName, lang)} className="h-full w-full object-cover" />
                  ) : <div className="h-full bg-[linear-gradient(145deg,#123f5e,#071c2c)]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071c2c]/75 to-transparent" />
                  {heroSecondary && <p className="absolute bottom-4 left-4 text-sm font-semibold text-white">{tx(heroSecondary.shortName, lang)}</p>}
                </div>
                <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-2xl border border-white/14 bg-white p-5 text-[#102638] shadow-xl">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#0a2d46] text-[#d6b96e]"><Landmark className="size-5" /></span>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7a8790]">{c.liveLabel}</p><p className="mt-2 font-serif text-lg font-semibold leading-tight">{c.liveValue}</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasOfferings && (
          <section id="opportunities" className="scroll-mt-24 border-b border-[#dfe5e8] bg-[#f5f7f7]">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
              <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a4b72]">{c.opportunitiesEyebrow}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-[#102638] sm:text-4xl">{c.opportunitiesTitle}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-[#62727c]">{c.opportunitiesBody}</p></div>
              <div className={`mt-10 grid gap-6 ${offerings.length === 1 ? "mx-auto max-w-2xl" : "lg:grid-cols-2"}`}>{offerings.map((offering) => <OpportunityCard key={offering.id} offering={offering} c={c} />)}</div>
            </div>
          </section>
        )}

        <section id="portal" className="scroll-mt-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a4b72]">{c.portalEyebrow}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-[#102638] sm:text-4xl">{c.portalTitle}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-[#62727c]">{c.portalBody}</p></div>
            <PortalPreview offering={offerings[0]} c={c} />
          </div>
        </section>

        <section className="border-y border-[#d8e1e5] bg-[#eef3f4]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a4b72]">{c.structureEyebrow}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-[#102638] sm:text-4xl">{c.structureTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#62727c]">{c.structureBody}</p></div>
            <div className="mt-10 grid gap-3 md:grid-cols-5">
              {c.flow.map((item, index) => {
                const Icon = flowIcons[index] ?? Landmark;
                return <div key={item.title} className="relative flex items-center gap-4 rounded-xl border border-[#d6dfe3] bg-white p-5 md:block md:text-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0a2d46] text-[#d6b96e] md:mx-auto"><Icon className="size-5" /></span><div><h3 className="text-sm font-semibold text-[#152b3b] md:mt-4">{item.title}</h3><p className="mt-1 text-xs leading-5 text-[#70808a]">{item.body}</p></div>{index < c.flow.length - 1 && <ChevronRight aria-hidden className="absolute -right-4 top-1/2 z-10 hidden size-5 -translate-y-1/2 text-[#9caab2] md:block" />}</div>;
              })}
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[#6f7e87]">{c.structureFoot}</p>
          </div>
        </section>

        {properties.length > 0 && (
          <section className="bg-[#071c2c] text-white">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
              <div className="grid items-end gap-6 lg:grid-cols-[1fr_0.8fr]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b96e]">{c.footprintEyebrow}</p><h2 className="mt-3 max-w-3xl font-serif text-3xl font-semibold sm:text-4xl">{c.footprintTitle}</h2></div><p className="max-w-2xl text-sm leading-6 text-white/62 lg:justify-self-end">{c.footprintBody}</p></div>
              <div className="mt-10">{picturedProperties.length > 0 ? <PropertyGallery properties={picturedProperties} /> : <PortfolioMap properties={properties} c={c} />}</div>
            </div>
          </section>
        )}

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a4b72]">{c.benefitsEyebrow}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-[#102638] sm:text-4xl">{c.benefitsTitle}</h2></div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">{c.benefits.map((benefit, index) => { const Icon = benefitIcons[index] ?? ShieldCheck; return <article key={benefit.title} className="rounded-xl border border-[#dce3e7] bg-[#fbfcfc] p-7"><span className="grid size-11 place-items-center rounded-xl bg-[#0a2d46] text-[#d6b96e]"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold text-[#152b3b]">{benefit.title}</h3><p className="mt-2 text-sm leading-6 text-[#63737d]">{benefit.body}</p></article>; })}</div>
          </div>
        </section>

        <section id="process" className="scroll-mt-24 border-y border-[#dce6e9] bg-[#eef3f4]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a4b72]">{c.processEyebrow}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-[#102638] sm:text-4xl">{c.processTitle}</h2></div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">{c.process.map((step, index) => { const Icon = processIcons[index] ?? CheckCircle2; return <li key={step.n} className="relative rounded-xl border border-[#d6dfe3] bg-white p-7"><div className="flex items-center justify-between"><span className="font-serif text-3xl font-semibold text-[#c5a34d]">{step.n}</span><span className="grid size-10 place-items-center rounded-lg bg-[#edf3f5] text-[#0a2d46]"><Icon className="size-5" /></span></div><h3 className="mt-4 text-lg font-semibold text-[#152b3b]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#63737d]">{step.body}</p></li>; })}</ol>
          </div>
        </section>

        <section className="bg-[#09283d] text-white">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-8">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{c.finalTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70">{c.finalBody}</p>
            <Link href={`${NORTH_BASE}/sign-up?path=investor`} className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#0a2d46] transition-transform hover:-translate-y-0.5">{c.create}<ArrowRight className="size-4" /></Link>
            <DealerDisclosure level="short" tone="dark" className="mx-auto mt-8 max-w-3xl border-t border-white/12 pt-6 text-left sm:text-center [&_div]:sm:justify-center" />
          </div>
        </section>
      </main>

      <footer className="bg-[#071c2c] px-4 py-10 text-xs leading-5 text-white/55 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[auto_1fr] md:items-start"><p>© 2026 Hunter &amp; Hunter Investment Advisors.</p><div className="max-w-3xl md:justify-self-end md:text-right"><p>{c.legal}</p><DealerDisclosure level="micro" tone="dark" className="mt-3 md:[&_div]:justify-end" /></div></div>
      </footer>
    </div>
  );
}
