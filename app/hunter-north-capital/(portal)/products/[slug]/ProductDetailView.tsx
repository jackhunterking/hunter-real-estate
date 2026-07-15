"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Landmark,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  buildFundDetailViewModel,
  formatCurrencyCad,
  formatReturnPhrase,
  formatSourceLine,
  localizeStatus,
  localizeVerification,
  primaryShareClass,
} from "@/lib/capital/present";
import { classifyOntario } from "@/lib/capital/readiness";
import { FundMapEmbed } from "@/components/capital/map/FundMapEmbed";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { Panel } from "@/components/capital/north/PortalUI";

const TAB_IDS = ["overview", "terms", "portfolio", "documents", "readiness", "contact"] as const;
type TabId = (typeof TAB_IDS)[number];

const COPY = {
  tr: {
    back: "Fonlara dön",
    available: "Partner incelemesine açık",
    overview: "Genel Bakış",
    terms: "Koşullar ve Performans",
    portfolio: "Portföy",
    documents: "Belgeler",
    readiness: "Yatırımcı Hazırlığı",
    contact: "İletişim",
    target: "Hedef getiri",
    distribution: "Hedef dağıtım",
    aum: "Yönetilen varlık",
    minimum: "Minimum yatırım",
    thesis: "Yatırım yaklaşımı",
    highlights: "Öne çıkanlar",
    manager: "Yönetici ve hizmet sağlayıcılar",
    keyTerms: "Temel koşullar",
    performance: "Getiriler / Performans",
    period: "Dönem",
    result: "Getiri",
    risks: "Dikkate alınması gerekenler",
    source: "Kaynak",
    properties: "Portföy varlıkları",
    property: "Varlık",
    location: "Konum",
    size: "Büyüklük",
    status: "Durum",
    verification: "Doğrulama",
    doc: "Belge",
    type: "Tür",
    effective: "Geçerlilik",
    access: "Erişim",
    public: "Kamuya açık",
    request: "Talep üzerine",
    view: "Görüntüle",
    readinessTitle: "Ön yatırımcı hazırlığı",
    readinessBody: "Bu araç yalnızca olası inceleme yolunu gösterir. Uygunluk, muafiyet ve suitability kararını lisanslı taraflar verir.",
    canada: "Ontario / Kanada",
    turkey: "Türkiye / Sınır ötesi",
    checks: ["Gelir testi geçerli olabilir", "1 milyon CAD üzeri finansal varlık testi geçerli olabilir", "5 milyon CAD net varlık testi geçerli olabilir", "Uygun yatırımcı gelir testi geçerli olabilir", "400 bin CAD üzeri net varlık testi geçerli olabilir"],
    calculate: "Ön sonucu göster",
    preliminary: "Ön sonuç",
    accredited: "Potansiyel akredite yatırımcı",
    eligible: "Potansiyel uygun yatırımcı",
    nonEligible: "Potansiyel uygun olmayan yatırımcı",
    manual: "Manuel sınır ötesi inceleme gerekir",
    warning: "Bu sonuç onay, yatırım tavsiyesi veya yatırım limiti değildir.",
    contactTitle: "Partner tarafından yönetilen bir sonraki adım",
    contactBody: "Müşteri tanıştırmasını kaydedin veya fonla ilgili soruları Hunter North ekibiyle görüşün. KYC, suitability ve fon izni lisanslı süreçte tamamlanır.",
    referral: "Müşteri ekle",
    whatsapp: "WhatsApp desteği",
    targetNote: "Hedefler garanti değildir. Resmi teklif belgeleri belirleyicidir.",
  },
  en: {
    back: "Back to funds",
    available: "Open for partner review",
    overview: "Overview",
    terms: "Terms & Performance",
    portfolio: "Portfolio",
    documents: "Documents",
    readiness: "Investor Readiness",
    contact: "Contact",
    target: "Target return",
    distribution: "Target distribution",
    aum: "Assets under management",
    minimum: "Minimum investment",
    thesis: "Investment approach",
    highlights: "Highlights",
    manager: "Manager and service providers",
    keyTerms: "Key terms",
    performance: "Returns / Performance",
    period: "Period",
    result: "Return",
    risks: "Considerations",
    source: "Source",
    properties: "Portfolio assets",
    property: "Asset",
    location: "Location",
    size: "Size",
    status: "Status",
    verification: "Verification",
    doc: "Document",
    type: "Type",
    effective: "Effective",
    access: "Access",
    public: "Public",
    request: "On request",
    view: "View",
    readinessTitle: "Preliminary investor readiness",
    readinessBody: "This tool only indicates a possible review path. Licensed parties determine eligibility, exemptions, and suitability.",
    canada: "Ontario / Canada",
    turkey: "Türkiye / Cross-border",
    checks: ["Income test may apply", "Over $1M financial-assets test may apply", "$5M net-assets test may apply", "Eligible-investor income test may apply", "Over $400k eligible net-assets test may apply"],
    calculate: "Show preliminary result",
    preliminary: "Preliminary result",
    accredited: "Potentially accredited investor",
    eligible: "Potentially eligible investor",
    nonEligible: "Potentially non-eligible investor",
    manual: "Manual cross-border review required",
    warning: "This result is not approval, investment advice, or an investment limit.",
    contactTitle: "A partner-led next step",
    contactBody: "Record a client introduction or speak with Hunter North about the fund. KYC, suitability, and fund permission remain within the licensed process.",
    referral: "Add client",
    whatsapp: "WhatsApp support",
    targetNote: "Targets are not guaranteed. Official offering documents control.",
  },
} as const;

function ValueCard({ label, value, note, icon: Icon }: { label: string; value: string; note?: string | null; icon: typeof TrendingUp }) {
  return (
    <div className="border-r border-[#e4e8eb] p-5 last:border-r-0">
      <div className="flex items-center gap-2 text-[#71808b]"><Icon className="size-4" /><p className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</p></div>
      <p className="mt-3 text-xl font-semibold text-[#152c3d]">{value}</p>
      {note && <p className="mt-1 text-[10px] text-[#849099]">{note}</p>}
    </div>
  );
}

export function ProductDetailView({ offering }: { offering: OfferingBundle }) {
  const { lang, t } = useLang();
  const c = COPY[lang];
  const router = useRouter();
  const params = useSearchParams();
  const activeTab = (TAB_IDS.includes(params.get("tab") as TabId) ? params.get("tab") : "overview") as TabId;
  const share = primaryShareClass(offering);
  const vm = buildFundDetailViewModel(offering, lang);

  function setTab(tab: TabId) {
    const next = new URLSearchParams(params.toString());
    if (tab === "overview") next.delete("tab"); else next.set("tab", tab);
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  const tabs: [TabId, string][] = [
    ["overview", c.overview], ["terms", c.terms], ["portfolio", c.portfolio],
    ["documents", c.documents], ["readiness", c.readiness], ["contact", c.contact],
  ];

  return (
    <div>
      <Link href={`${NORTH_BASE}/funds`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#60717e] hover:text-[#0a2d46]"><ArrowLeft className="size-3.5" />{c.back}</Link>

      <section className="overflow-hidden rounded-md border border-[#dbe1e5] bg-white">
        <div className="relative aspect-[4/1] min-h-40 bg-[#0b2b40]">
          {offering.media?.banner?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offering.media.banner.src} alt={offering.media.banner.alt?.[lang] ?? offering.shortName[lang]} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071c2c]/85 via-[#071c2c]/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-5 sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              {offering.media?.logo?.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offering.media.logo.src} alt="" className="hidden h-14 w-24 rounded-md bg-white object-contain p-2 shadow sm:block" />
              )}
              <div className="min-w-0 text-white">
                <span className="inline-flex rounded bg-[#e7f1eb] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#2f694a]">{c.available}</span>
                <h1 className="mt-2 truncate font-serif text-2xl font-semibold sm:text-3xl">{offering.shortName[lang]}</h1>
                <p className="mt-1 text-xs text-white/65">{offering.manager.name[lang]}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-20 mt-4 overflow-x-auto rounded-md border border-[#dbe1e5] bg-white p-1 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`h-9 rounded px-3 text-xs font-semibold transition-colors ${activeTab === id ? "bg-[#0a2d46] text-white" : "text-[#5e6d78] hover:bg-[#f0f3f5]"}`} aria-pressed={activeTab === id}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {activeTab === "overview" && <Overview offering={offering} c={c} />}
        {activeTab === "terms" && <Terms offering={offering} c={c} />}
        {activeTab === "portfolio" && <Portfolio offering={offering} c={c} />}
        {activeTab === "documents" && <Documents offering={offering} c={c} typeLabels={t.capitalApp.documents.types} />}
        {activeTab === "readiness" && <Readiness offering={offering} c={c} />}
        {activeTab === "contact" && <Contact offering={offering} c={c} />}
      </div>

      <p className="mt-5 text-[10px] leading-5 text-[#828d96]">{c.targetNote} · {offering.verifiedAt}</p>
    </div>
  );
}

type Copy = (typeof COPY)["tr"] | (typeof COPY)["en"];

function Overview({ offering, c }: { offering: OfferingBundle; c: Copy }) {
  const { lang } = useLang();
  const share = primaryShareClass(offering);
  const vm = buildFundDetailViewModel(offering, lang);
  const values = [
    [c.target, share?.targetReturn ? formatReturnPhrase(share.targetReturn.value, lang) : "—", share?.targetReturn ? formatSourceLine(share.targetReturn, lang) : null, TrendingUp],
    [c.distribution, share?.targetDistribution ? formatReturnPhrase(share.targetDistribution.value, lang) : "—", share?.targetDistribution ? formatSourceLine(share.targetDistribution, lang) : null, Landmark],
    [c.aum, offering.aum ? String(offering.aum.value) : "—", offering.aum ? formatSourceLine(offering.aum, lang) : null, Building2],
    [c.minimum, share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : "—", share?.minimumInvestment ? formatSourceLine(share.minimumInvestment, lang) : null, ClipboardCheck],
  ] as const;
  return (
    <div className="space-y-5">
      <Panel className="grid divide-y divide-[#e4e8eb] overflow-hidden sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {values.map(([label, value, note, Icon]) => <ValueCard key={label} label={label} value={value} note={note} icon={Icon} />)}
      </Panel>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Panel className="p-5 sm:p-6"><h2 className="text-base font-semibold text-[#172e40]">{c.thesis}</h2><p className="mt-4 text-sm leading-7 text-[#5f6e79]">{offering.thesis[lang]}</p></Panel>
        <Panel className="p-5 sm:p-6"><h2 className="text-base font-semibold text-[#172e40]">{c.highlights}</h2><ul className="mt-4 space-y-3">{(vm.highlights.length ? vm.highlights : offering.portfolioFacts.map((item) => String(item.value))).map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-[#5f6e79]"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#3d7257]" />{item}</li>)}</ul></Panel>
      </div>
      <Panel className="p-5 sm:p-6"><h2 className="text-base font-semibold text-[#172e40]">{c.manager}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a858e]">{offering.manager.name[lang]}</p><p className="mt-2 text-sm text-[#52616d]">{offering.manager.headquarters.city}, {offering.manager.headquarters.province}</p></div>{vm.providers.map((provider) => <div key={provider.key}><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a858e]">{provider.key}</p><p className="mt-2 text-sm font-semibold text-[#334550]">{provider.value}</p></div>)}</div></Panel>
    </div>
  );
}

function Terms({ offering, c }: { offering: OfferingBundle; c: Copy }) {
  const { lang, t } = useLang();
  const vm = buildFundDetailViewModel(offering, lang);
  const fields = t.capitalApp.detail.fields as Record<string, string>;
  return <div className="space-y-5"><Panel className="p-5 sm:p-6"><h2 className="text-base font-semibold text-[#172e40]">{c.keyTerms}</h2><dl className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{vm.fundDetails.map((row) => <div key={row.key} className="flex items-baseline justify-between gap-4 border-b border-[#e8ecef] py-3"><dt className="text-xs text-[#71808b]">{fields[row.key] ?? row.key}</dt><dd className="text-right text-sm font-semibold text-[#2a3b47]">{row.value}</dd></div>)}</dl></Panel>{vm.trailingReturns.length > 0 && <Panel className="overflow-hidden"><div className="border-b border-[#e3e7ea] px-5 py-4"><h2 className="text-base font-semibold text-[#172e40]">{c.performance}</h2></div><table className="w-full text-left text-sm"><thead className="bg-[#f6f8f9] text-[10px] uppercase tracking-[0.08em] text-[#75808a]"><tr><th className="px-5 py-3">{c.period}</th><th className="px-5 py-3 text-right">{c.result}</th></tr></thead><tbody>{vm.trailingReturns.map((row) => <tr key={row.period} className="border-t border-[#edf0f2]"><td className="px-5 py-3 text-[#52616d]">{row.period}</td><td className="px-5 py-3 text-right font-semibold tabular-nums text-[#213542]">{row.value}</td></tr>)}</tbody></table>{vm.trailingReturnsNote && <p className="border-t border-[#edf0f2] p-4 text-[10px] leading-5 text-[#7d8891]">{vm.trailingReturnsNote}</p>}</Panel>}<Panel className="p-5 sm:p-6"><h2 className="text-base font-semibold text-[#172e40]">{c.risks}</h2><ul className="mt-4 space-y-3">{offering.risks.map((risk) => <li key={risk[lang]} className="flex gap-2.5 text-sm leading-6 text-[#5f6e79]"><CircleAlert className="mt-1 size-4 shrink-0 text-[#996f1e]" />{risk[lang]}</li>)}</ul></Panel></div>;
}

function Portfolio({ offering, c }: { offering: OfferingBundle; c: Copy }) {
  const { lang } = useLang();
  return <div className="space-y-5"><Panel className="p-5 sm:p-6"><FundMapEmbed offering={offering} /></Panel><Panel className="overflow-hidden"><div className="border-b border-[#e3e7ea] px-5 py-4"><h2 className="text-base font-semibold text-[#172e40]">{c.properties}</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f6f8f9] text-[10px] uppercase tracking-[0.08em] text-[#75808a]"><tr>{[c.property,c.location,c.size,c.status,c.verification].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody>{offering.properties.map((property) => <tr key={property.id} className="border-t border-[#edf0f2]"><td className="px-5 py-3 font-semibold text-[#2b3e4b]">{property.name[lang]}</td><td className="px-5 py-3 text-[#62717c]">{property.city}, {property.province}</td><td className="px-5 py-3 text-[#62717c]">{property.units?.value ?? property.squareFeet?.value ?? "—"}</td><td className="px-5 py-3 text-[#62717c]">{localizeStatus(property.status, lang)}</td><td className="px-5 py-3 text-[#62717c]">{localizeVerification(property.verificationStatus, lang)}</td></tr>)}</tbody></table></div></Panel></div>;
}

function Documents({ offering, c, typeLabels }: { offering: OfferingBundle; c: Copy; typeLabels: Record<string, string> }) {
  const { lang } = useLang();
  return <Panel className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#f6f8f9] text-[10px] uppercase tracking-[0.08em] text-[#75808a]"><tr>{[c.doc,c.type,c.effective,c.access,""].map((label,index) => <th key={`${label}-${index}`} className="border-b border-[#e2e6e9] px-5 py-3">{label}</th>)}</tr></thead><tbody>{offering.documents.map((document) => <tr key={document.id} className="border-b border-[#edf0f2] last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-[#eef2f5] text-[#0a2d46]"><FileText className="size-4" /></span><div><p className="font-semibold text-[#2a3d49]">{document.title[lang]}</p><p className="mt-1 text-[10px] text-[#7b858e]">{document.version}</p></div></div></td><td className="px-5 py-4 text-[#63727d]">{typeLabels[document.type] ?? document.type}</td><td className="px-5 py-4 text-[#63727d]">{document.effectiveDate}</td><td className="px-5 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${document.visibility === "public" ? "bg-[#e8f2ec] text-[#2f694a]" : "bg-[#f1f2f4] text-[#66717a]"}`}>{document.visibility === "public" ? c.public : c.request}</span></td><td className="px-5 py-4 text-right">{document.href ? <a href={document.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline">{c.view}<ArrowUpRight className="size-3.5" /></a> : <span className="text-xs text-[#8a939a]">{c.request}</span>}</td></tr>)}</tbody></table></div></Panel>;
}

function Readiness({ offering, c }: { offering: OfferingBundle; c: Copy }) {
  const { lang } = useLang();
  const [jurisdiction, setJurisdiction] = useState<"ontario" | "turkey">("turkey");
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const [shown, setShown] = useState(false);
  const category = useMemo(() => classifyOntario({ qualificationCriteria: [checks[0] && "ai-income-individual", checks[1] && "ai-financial-assets", checks[2] && "ai-net-assets", checks[3] && "eligible-income-individual", checks[4] && "eligible-net-assets"].filter((criterion): criterion is "ai-income-individual" | "ai-financial-assets" | "ai-net-assets" | "eligible-income-individual" | "eligible-net-assets" => Boolean(criterion)) }), [checks]);
  const result = jurisdiction === "turkey" ? c.manual : category === "potentially-accredited" ? c.accredited : category === "potentially-eligible" ? c.eligible : c.nonEligible;
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><Panel className="p-5 sm:p-6"><h2 className="text-base font-semibold text-[#172e40]">{c.readinessTitle}</h2><p className="mt-2 text-sm leading-6 text-[#64727d]">{c.readinessBody}</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => {setJurisdiction("ontario");setShown(false);}} className={`h-11 rounded-md border text-sm font-semibold ${jurisdiction === "ontario" ? "border-[#0a2d46] bg-[#0a2d46] text-white" : "border-[#d6dde2] text-[#51616d]"}`}>{c.canada}</button><button type="button" onClick={() => {setJurisdiction("turkey");setShown(false);}} className={`h-11 rounded-md border text-sm font-semibold ${jurisdiction === "turkey" ? "border-[#0a2d46] bg-[#0a2d46] text-white" : "border-[#d6dde2] text-[#51616d]"}`}>{c.turkey}</button></div>{jurisdiction === "ontario" ? <div className="mt-5 space-y-2">{c.checks.map((label,index) => <label key={label} className="flex cursor-pointer items-start gap-3 rounded-md border border-[#e0e5e8] p-3 text-sm text-[#52616c]"><input type="checkbox" checked={checks[index]} onChange={(event) => setChecks((current) => current.map((item,i) => i === index ? event.target.checked : item))} className="mt-0.5 size-4 accent-[#0a2d46]" />{label}</label>)}</div> : <div className="mt-5 rounded-md border border-[#eadcb8] bg-[#fbf7eb] p-4 text-sm leading-6 text-[#6f5a28]">{c.manual}</div>}<button type="button" onClick={() => setShown(true)} className="mt-5 h-11 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]">{c.calculate}</button></Panel><Panel className="p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a858e]">{c.preliminary}</p>{shown ? <><CheckCircle2 className="mt-6 size-8 text-[#3d7257]" /><h3 className="mt-4 text-lg font-semibold text-[#173044]">{result}</h3><p className="mt-3 text-sm leading-6 text-[#66747e]">{c.warning}</p><p className="mt-5 border-t border-[#e7ebee] pt-4 text-xs text-[#7b858e]">{offering.shortName[lang]}</p></> : <p className="mt-5 text-sm leading-6 text-[#7a858e]">{c.readinessBody}</p>}</Panel></div>;
}

function Contact({ offering, c }: { offering: OfferingBundle; c: Copy }) {
  const { lang } = useLang();
  const whatsapp = `https://wa.me/16473913311?text=${encodeURIComponent(`Hunter North Capital: ${offering.shortName[lang]}`)}`;
  return <Panel className="p-6 sm:p-8"><div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7b858e]">Hunter North Capital</p><h2 className="mt-3 font-serif text-2xl font-semibold text-[#142d40]">{c.contactTitle}</h2><p className="mt-3 text-sm leading-7 text-[#63727d]">{c.contactBody}</p><div className="mt-6 flex flex-wrap gap-3"><Link href={`${NORTH_BASE}/clients/new?offering=${offering.id}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]">{c.referral}<ArrowRight className="size-4" /></Link><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cfd7dc] px-4 text-sm font-semibold text-[#435561] hover:border-[#0a2d46]"><MessageCircle className="size-4" />{c.whatsapp}</a></div></div></Panel>;
}
