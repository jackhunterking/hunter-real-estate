"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileText,
  Filter,
  Globe2,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { OfferingBundle } from "@/lib/capital/types";
import {
  formatCurrencyCad,
  formatReturnPhrase,
  formatSourceLine,
  primaryShareClass,
} from "@/lib/capital/present";
import { regions, strategies, taxonomyLabel } from "@/lib/capital/taxonomies";
import { buildHncWhatsAppUrl } from "@/lib/capital/support";
import { NORTH_BASE } from "./NorthBrand";
import { SupportWidget } from "./SupportWidget";

const COPY = {
  tr: {
    nav: { funds: "Fonlar", how: "Nasıl çalışır", investors: "Yatırımcılar", partners: "Partnerler", signIn: "Giriş", create: "Hesap oluştur" },
    eyebrow: "Kanada özel gayrimenkul fonları",
    title: "Fonları anlamak, hesabınızı oluşturmak ve doğru sonraki adımı konuşmak için tek yer.",
    body: "Yayınlanmış fonları, varlıkları, koşulları, hedefleri, riskleri ve kaynak belgeleri tek sayfada inceleyin. İlgi duyduğunuzda hesap oluşturun; yatırım süreci insan destekli uygunluk ve suitability incelemesiyle ilerler.",
    heroPrimary: "Fonları incele",
    heroSecondary: "Hesap oluştur",
    trust: ["Onaylanmış ve tarihli fon verileri", "İngilizce ve Türkçe deneyim", "İnsan destekli sonraki adım"],
    fundsEyebrow: "Fon gezgini",
    fundsTitle: "Ne incelediğinizi baştan görün.",
    fundsBody: "Yalnızca yayınlanmış içerik gösterilir. Hedefler garanti değildir; erişim, uygunluk ve suitability ilgili lisanslı süreçte değerlendirilir.",
    allManagers: "Tüm yöneticiler",
    allTypes: "Tüm fon türleri",
    allStrategies: "Tüm stratejiler",
    allRegions: "Tüm bölgeler",
    allStatuses: "Tüm durumlar",
    noFunds: "Bu filtrelerle eşleşen yayınlanmış fon bulunmuyor.",
    manager: "Yönetici",
    strategy: "Strateji",
    geography: "Bölge",
    minimum: "Minimum",
    target: "Hedef getiri",
    distribution: "Hedef dağıtım",
    risk: "Risk profili",
    review: "Fonun tamamını incele",
    thesis: "Yatırım yaklaşımı",
    benefits: "Potansiyel değerlendirme nedenleri",
    risks: "Riskler ve trade-off'lar",
    portfolio: "Portföy varlıkları",
    terms: "Temel koşullar",
    documents: "Kamuya açık belgeler",
    performance: "Yayımlanmış performans",
    registeredAccounts: "Kayıtlı hesaplar",
    reviewPaths: "Yatırımcı inceleme yolları",
    noPublicDocs: "Bu fon için kamuya açık belge yayımlanmamış.",
    source: "Kaynak / tarih",
    createAccount: "Hesap oluştur",
    talk: "Hunter North ile konuş",
    howEyebrow: "Nasıl çalışır",
    howTitle: "Dijital inceleme, insan destekli karar.",
    steps: [
      ["01", "Fonları karşılaştırın", "Yayınlanmış koşulları, portföyleri, riskleri ve belgeleri inceleyin."],
      ["02", "Hesabınızı oluşturun", "Yatırımcı veya Türkiye lisanslı profesyonel/firma yolunu seçin."],
      ["03", "İlginizi kaydedin", "İlgilendiğiniz fonu ve tercih ettiğiniz iletişim kanalını belirtin."],
      ["04", "Birlikte ilerleyin", "Hunter North ve ilgili lisanslı taraflar uygunluk, suitability ve belgeleri tamamlar."],
    ],
    whyEyebrow: "Özel piyasalar",
    whyTitle: "Ne sunabilir, neyi göze almanız gerekir?",
    advantages: ["Gerçek varlıklara ve profesyonel yönetime erişim", "Gelir ve uzun vadeli değer artışı hedeflerinin birlikte değerlendirilebilmesi", "Tek tek mülk yönetmeden çeşitlendirilmiş portföy yaklaşımı"],
    tradeoffs: ["Özel menkul kıymetlerde sınırlı likidite ve uzun elde tutma süreleri", "Dağıtımların ve hedef getirilerin garanti olmaması", "Değerleme, işletme, kaldıraç, piyasa ve sınır ötesi düzenleme riskleri"],
    investorEyebrow: "Yatırımcı türleri",
    investorTitle: "Farklı profiller, ayrı inceleme yolları.",
    investorCards: [
      ["Bireysel yatırımcı", "Kendi adına fonları inceleyen ve uygunluğunu lisanslı süreçte doğrulayan kişiler."],
      ["Şirket / trust / family office", "Kurumsal veya aile sermayesiyle hareket eden, sahiplik ve yetki incelemesi gereken hesaplar."],
      ["Sınır ötesi yatırımcı", "Kanada dışından erişimi; vergi, AML, kaynak ve ürün izni incelemesine tabi kişiler veya kurumlar."],
    ],
    partnerEyebrow: "Lisanslı profesyoneller ve firmalar",
    partnerTitle: "Mevcut partner akışını koruyor, girişini sadeleştiriyoruz.",
    partnerBody: "Türkiye lisanslı profesyoneller ve firmalar yatırımcı hesabıyla başlayabilir, ardından SPL lisans ve SPK firma bilgilerini güvenli profil akışında sunabilir. Partner araçları ancak Hunter North, lisans ve firma onayları tamamlandıktan sonra açılır.",
    partnerCta: "Profesyonel hesap oluştur",
    faqTitle: "Kısa cevaplar",
    faq: [
      ["Buradan doğrudan yatırım yapabilir miyim?", "Hayır. Platform araştırma, hesap, ilgi kaydı ve görüşme akışıdır; ödeme veya online menkul kıymet satın alma işlemi yapmaz."],
      ["Hesap açmak uygun olduğum anlamına gelir mi?", "Hayır. Hesap türü veya ön bilgiler yatırımcı statüsü, suitability, onay veya ürün izni oluşturmaz."],
      ["Partner hesabı otomatik açılır mı?", "Hayır. SPL doğrulaması, firma ilişkisi, Hunter North onayı ve gerekli MFA kapıları ayrı ayrı tamamlanır."],
    ],
    finalTitle: "Önce fonları anlayın. Sonra doğru konuşmayı başlatın.",
    finalBody: "Hesabınızı oluşturun, ilginizi kaydedin ve sizin durumunuza uygun inceleme yolunu Hunter North ekibiyle netleştirin.",
    legal: "Bu site yatırım tavsiyesi, fon erişim onayı, suitability kararı veya getiri garantisi sağlamaz. Hedefler değişebilir. Yatırım erişimi, uygunluk, KYC/AML, kaynak ve ilgili lisanslı süreçlere tabidir.",
    legalLink: "Yasal bilgiler",
  },
  en: {
    nav: { funds: "Funds", how: "How it works", investors: "Investor types", partners: "Partners", signIn: "Sign in", create: "Create account" },
    eyebrow: "Canadian private real-estate funds",
    title: "One place to understand the funds, create an account, and start the right conversation.",
    body: "Review published funds, assets, terms, targets, risks, and source documents on one page. When a fund interests you, create an account; the investment process continues through human-led eligibility and suitability review.",
    heroPrimary: "Review funds",
    heroSecondary: "Create account",
    trust: ["Approved, dated fund information", "English and Turkish experience", "Human-supported next step"],
    fundsEyebrow: "Fund explorer",
    fundsTitle: "See what you are reviewing from the start.",
    fundsBody: "Only published content is displayed. Targets are not guarantees; access, eligibility, and suitability are assessed through the applicable licensed process.",
    allManagers: "All managers",
    allTypes: "All fund types",
    allStrategies: "All strategies",
    allRegions: "All regions",
    allStatuses: "All statuses",
    noFunds: "No published funds match these filters.",
    manager: "Manager",
    strategy: "Strategy",
    geography: "Geography",
    minimum: "Minimum",
    target: "Target return",
    distribution: "Target distribution",
    risk: "Risk profile",
    review: "Review the full fund",
    thesis: "Investment approach",
    benefits: "Potential reasons to consider",
    risks: "Risks and trade-offs",
    portfolio: "Portfolio assets",
    terms: "Key terms",
    documents: "Public documents",
    performance: "Published performance",
    registeredAccounts: "Registered accounts",
    reviewPaths: "Investor review paths",
    noPublicDocs: "No public document has been published for this fund.",
    source: "Source / date",
    createAccount: "Create account",
    talk: "Talk to Hunter North",
    howEyebrow: "How it works",
    howTitle: "Digital review, human-supported decisions.",
    steps: [
      ["01", "Compare funds", "Review published terms, portfolios, risks, and documents."],
      ["02", "Create your account", "Choose the investor or Türkiye-licensed professional/firm path."],
      ["03", "Record your interest", "Select a fund and your preferred contact channel."],
      ["04", "Continue together", "Hunter North and applicable licensed parties complete eligibility, suitability, and documentation."],
    ],
    whyEyebrow: "Private markets",
    whyTitle: "What might they offer, and what must you accept?",
    advantages: ["Access to real assets and professional management", "Ability to evaluate income and long-term appreciation objectives together", "Portfolio exposure without directly operating each property"],
    tradeoffs: ["Limited liquidity and potentially long holding periods in private securities", "Distributions and target returns are not guaranteed", "Valuation, operating, leverage, market, and cross-border regulatory risks"],
    investorEyebrow: "Investor types",
    investorTitle: "Different profiles, separate review paths.",
    investorCards: [
      ["Individual investor", "People reviewing funds for their own account and confirming eligibility through the licensed process."],
      ["Company / trust / family office", "Entity and family capital accounts that require ownership and authority review."],
      ["Cross-border investor", "People or entities outside Canada subject to tax, AML, source-of-funds, and product-permission review."],
    ],
    partnerEyebrow: "Licensed professionals and firms",
    partnerTitle: "Preserving the partner workflow, simplifying the entrance.",
    partnerBody: "Türkiye-licensed professionals and firms can begin with an investor account, then submit SPL licence and SPK firm information through the secure profile flow. Partner tools open only after Hunter North, licence, and firm approvals are complete.",
    partnerCta: "Create professional account",
    faqTitle: "Short answers",
    faq: [
      ["Can I invest directly on this site?", "No. The platform supports research, accounts, interest requests, and conversations; it does not process payments or execute an online securities purchase."],
      ["Does opening an account mean I qualify?", "No. Account type and preliminary information do not establish investor status, suitability, approval, or product permission."],
      ["Is partner access automatic?", "No. SPL verification, firm affiliation, Hunter North approval, and required MFA gates are completed independently."],
    ],
    finalTitle: "Understand the funds first. Then start the right conversation.",
    finalBody: "Create an account, record your interest, and clarify the appropriate review path with the Hunter North team.",
    legal: "This site does not provide investment advice, fund-access approval, a suitability decision, or a return guarantee. Targets may change. Access is subject to eligibility, KYC/AML, source-of-funds, and applicable licensed processes.",
    legalLink: "Legal information",
  },
} as const;

function localized(value: { tr: string; en: string } | undefined, lang: "tr" | "en", fallback = "—") {
  return value?.[lang] ?? fallback;
}

export function PublicLanding({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang, setLang } = useLang();
  const c = COPY[lang];
  const [manager, setManager] = useState("all");
  const [type, setType] = useState("all");
  const [strategy, setStrategy] = useState("all");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");

  const managerOptions = useMemo(() => Array.from(new Map(offerings.map((item) => [item.manager.id, item.manager.name[lang]])).entries()), [lang, offerings]);
  const typeOptions = useMemo(() => Array.from(new Set(offerings.map((item) => localized(item.fundType, lang)).filter((item) => item !== "—"))), [lang, offerings]);
  const regionOptions = useMemo(() => Array.from(new Set(offerings.flatMap((item) => item.regionIds))), [offerings]);
  const strategyOptions = useMemo(() => Array.from(new Set(offerings.flatMap((item) => item.strategyIds))), [offerings]);
  const visible = offerings.filter((offering) =>
    (manager === "all" || offering.manager.id === manager) &&
    (type === "all" || localized(offering.fundType, lang) === type) &&
    (strategy === "all" || offering.strategyIds.includes(strategy)) &&
    (region === "all" || offering.regionIds.includes(region)) &&
    (status === "all" || offering.status === status),
  );

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#122536]">
      <header className="sticky top-0 z-50 border-b border-[#cdbf9a]/35 bg-[#071c2c]/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-3" aria-label="Hunter North Capital">
            <Image src="/logos/HUNTER_Brandmark_Gold.png" alt="" width={40} height={40} className="size-9 object-contain" priority />
            <span className="text-sm font-semibold">Hunter North <span className="text-[#d8bf7a]">Capital</span></span>
          </a>
          <nav className="hidden items-center gap-6 text-xs font-semibold text-white/70 lg:flex">
            <a href="#funds" className="hover:text-white">{c.nav.funds}</a>
            <a href="#how" className="hover:text-white">{c.nav.how}</a>
            <a href="#investors" className="hover:text-white">{c.nav.investors}</a>
            <a href="#partners" className="hover:text-white">{c.nav.partners}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden rounded border border-white/15 p-0.5 sm:flex" role="group" aria-label="Language">
              {(["tr", "en"] as const).map((item) => <button key={item} onClick={() => setLang(item)} className={`h-7 rounded px-2 text-[10px] font-bold uppercase ${lang === item ? "bg-white text-[#071c2c]" : "text-white/60"}`}>{item}</button>)}
            </div>
            <Link href={`${NORTH_BASE}/sign-in`} className="hidden h-9 items-center px-3 text-xs font-semibold text-white/75 sm:inline-flex">{c.nav.signIn}</Link>
            <Link href={`${NORTH_BASE}/sign-up`} className="inline-flex h-9 items-center rounded bg-[#d8bf7a] px-3 text-xs font-bold text-[#071c2c]">{c.nav.create}</Link>
          </div>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden bg-[#071c2c] text-white">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_75%_20%,#d8bf7a_0,transparent_32%),linear-gradient(120deg,transparent_20%,#123f5e_100%)]" />
        <div className="relative mx-auto grid min-h-[680px] max-w-[1380px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_420px] lg:px-12">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8bf7a]">{c.eyebrow}</p>
            <h1 className="mt-6 max-w-4xl font-serif text-[clamp(2.75rem,6vw,5.8rem)] font-semibold leading-[0.96] tracking-[-0.035em]">{c.title}</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">{c.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#funds" className="inline-flex h-12 items-center gap-2 rounded bg-[#d8bf7a] px-5 text-sm font-bold text-[#071c2c]">{c.heroPrimary}<ArrowRight className="size-4" /></a>
              <Link href={`${NORTH_BASE}/sign-up`} className="inline-flex h-12 items-center rounded border border-white/20 px-5 text-sm font-semibold text-white">{c.heroSecondary}</Link>
            </div>
          </div>
          <aside className="border border-white/12 bg-white/[0.045] p-6 backdrop-blur sm:p-8">
            <Globe2 className="size-6 text-[#d8bf7a]" />
            <p className="mt-6 font-serif text-2xl font-semibold">Hunter North Capital</p>
            <div className="mt-6 space-y-4">
              {c.trust.map((item) => <div key={item} className="flex gap-3 border-t border-white/10 pt-4 text-sm text-white/65"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#d8bf7a]" />{item}</div>)}
            </div>
          </aside>
        </div>
      </section>

      <section id="funds" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1380px]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f7030]">{c.fundsEyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.025em] sm:text-5xl">{c.fundsTitle}</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#65727b] sm:text-base">{c.fundsBody}</p>
          </div>

          <div className="mt-10 grid gap-3 border border-[#d8d1c2] bg-white p-3 md:grid-cols-[auto_repeat(5,minmax(0,1fr))] md:items-center">
            <Filter className="mx-2 hidden size-4 text-[#8f7030] md:block" />
            <select value={manager} onChange={(event) => setManager(event.target.value)} className="h-11 border border-[#ddd7ca] bg-[#fbfaf7] px-3 text-sm"><option value="all">{c.allManagers}</option>{managerOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-11 border border-[#ddd7ca] bg-[#fbfaf7] px-3 text-sm"><option value="all">{c.allTypes}</option>{typeOptions.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={strategy} onChange={(event) => setStrategy(event.target.value)} className="h-11 border border-[#ddd7ca] bg-[#fbfaf7] px-3 text-sm"><option value="all">{c.allStrategies}</option>{strategyOptions.map((item) => <option key={item} value={item}>{taxonomyLabel(strategies, item, lang)}</option>)}</select>
            <select value={region} onChange={(event) => setRegion(event.target.value)} className="h-11 border border-[#ddd7ca] bg-[#fbfaf7] px-3 text-sm"><option value="all">{c.allRegions}</option>{regionOptions.map((item) => <option key={item} value={item}>{taxonomyLabel(regions, item, lang)}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 border border-[#ddd7ca] bg-[#fbfaf7] px-3 text-sm"><option value="all">{c.allStatuses}</option><option value="available">Available</option><option value="coming-soon">Coming soon</option><option value="paused">Paused</option><option value="closed">Closed</option></select>
          </div>

          <div className="mt-6 space-y-5">
            {visible.map((offering) => <FundCard key={offering.id} offering={offering} lang={lang} copy={c} />)}
            {!visible.length && <div className="border border-[#d8d1c2] bg-white p-12 text-center text-sm text-[#697680]">{c.noFunds}</div>}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f7030]">{c.howEyebrow}</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold sm:text-5xl">{c.howTitle}</h2>
          <div className="mt-12 grid border-l border-t border-[#ded8cb] sm:grid-cols-2 lg:grid-cols-4">
            {c.steps.map(([number, title, body]) => <article key={number} className="border-b border-r border-[#ded8cb] p-6 sm:p-8"><span className="text-xs font-bold text-[#a4823d]">{number}</span><h3 className="mt-8 font-serif text-2xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-7 text-[#65727b]">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#0a2539] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8bf7a]">{c.whyEyebrow}</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold sm:text-5xl">{c.whyTitle}</h2>
          <div className="mt-12 grid gap-px bg-white/10 lg:grid-cols-2">
            <article className="bg-[#0d2c42] p-7 sm:p-9"><CheckCircle2 className="size-6 text-[#d8bf7a]" /><h3 className="mt-6 font-serif text-2xl font-semibold">{c.benefits}</h3><ul className="mt-6 space-y-4">{c.advantages.map((item) => <li key={item} className="flex gap-3 text-sm leading-7 text-white/65"><span className="mt-3 size-1 shrink-0 rounded-full bg-[#d8bf7a]" />{item}</li>)}</ul></article>
            <article className="bg-[#0d2c42] p-7 sm:p-9"><CircleAlert className="size-6 text-[#d8bf7a]" /><h3 className="mt-6 font-serif text-2xl font-semibold">{c.risks}</h3><ul className="mt-6 space-y-4">{c.tradeoffs.map((item) => <li key={item} className="flex gap-3 text-sm leading-7 text-white/65"><span className="mt-3 size-1 shrink-0 rounded-full bg-[#d8bf7a]" />{item}</li>)}</ul></article>
          </div>
        </div>
      </section>

      <section id="investors" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f7030]">{c.investorEyebrow}</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold sm:text-5xl">{c.investorTitle}</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">{c.investorCards.map(([title, body], index) => { const Icon = [UsersRound, Building2, Globe2][index]; return <article key={title} className="border border-[#d8d1c2] bg-white p-7"><Icon className="size-6 text-[#8f7030]" /><h3 className="mt-7 font-serif text-2xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-7 text-[#65727b]">{body}</p></article>; })}</div>
        </div>
      </section>

      <section id="partners" className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="border border-[#d8d1c2] bg-[#071c2c] p-8 text-white sm:p-10"><ShieldCheck className="size-8 text-[#d8bf7a]" /><div className="mt-10 grid gap-3 text-xs text-white/65">{["SPL", "SPK", "Hunter North", "MFA"].map((item) => <div key={item} className="flex items-center justify-between border-t border-white/10 pt-3"><span>{item}</span><span className="text-[#d8bf7a]">Independent gate</span></div>)}</div></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f7030]">{c.partnerEyebrow}</p><h2 className="mt-4 font-serif text-4xl font-semibold sm:text-5xl">{c.partnerTitle}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-[#65727b]">{c.partnerBody}</p><Link href={`${NORTH_BASE}/sign-up?path=professional`} className="mt-8 inline-flex h-11 items-center gap-2 bg-[#0a2d46] px-5 text-sm font-semibold text-white">{c.partnerCta}<ArrowRight className="size-4" /></Link></div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[980px]"><h2 className="text-center font-serif text-4xl font-semibold">{c.faqTitle}</h2><div className="mt-10 divide-y divide-[#d8d1c2] border-y border-[#d8d1c2]">{c.faq.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold"><span>{question}</span><ChevronDown className="size-4 transition group-open:rotate-180" /></summary><p className="max-w-3xl pt-4 text-sm leading-7 text-[#65727b]">{answer}</p></details>)}</div></div>
      </section>

      <section className="bg-[#071c2c] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto max-w-[980px] text-center"><h2 className="font-serif text-4xl font-semibold sm:text-5xl">{c.finalTitle}</h2><p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/60">{c.finalBody}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href={`${NORTH_BASE}/sign-up`} className="inline-flex h-12 items-center gap-2 bg-[#d8bf7a] px-5 text-sm font-bold text-[#071c2c]">{c.createAccount}<ArrowRight className="size-4" /></Link><a href={buildHncWhatsAppUrl()} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 border border-white/20 px-5 text-sm font-semibold"><MessageCircle className="size-4" />{c.talk}</a></div><p className="mx-auto mt-10 max-w-3xl border-t border-white/10 pt-8 text-[11px] leading-6 text-white/40">{c.legal}</p><Link href={`${NORTH_BASE}/legal`} className="mt-4 inline-block text-xs font-semibold text-[#d8bf7a] hover:underline">{c.legalLink}</Link></div></section>
      <SupportWidget />
    </main>
  );
}

type PublicCopy = (typeof COPY)["tr"] | (typeof COPY)["en"];

function FundCard({ offering, lang, copy: c }: { offering: OfferingBundle; lang: "tr" | "en"; copy: PublicCopy }) {
  const share = primaryShareClass(offering);
  const publicDocuments = offering.documents.filter((document) => document.visibility === "public");
  const benefits = offering.highlights?.length ? offering.highlights : offering.portfolioFacts.map((fact) => ({ tr: String(fact.value), en: String(fact.value) }));
  const terms = [
    [c.minimum, share?.minimumInvestment ? formatCurrencyCad(share.minimumInvestment.value, lang) : "—", share?.minimumInvestment ? formatSourceLine(share.minimumInvestment, lang) : null],
    [c.target, share?.targetReturn ? formatReturnPhrase(share.targetReturn.value, lang) : "—", share?.targetReturn ? formatSourceLine(share.targetReturn, lang) : null],
    [c.distribution, share?.targetDistribution ? formatReturnPhrase(share.targetDistribution.value, lang) : "—", share?.targetDistribution ? formatSourceLine(share.targetDistribution, lang) : null],
    [c.risk, localized(offering.riskProfile, lang), offering.lastUpdated ?? offering.verifiedAt],
  ];
  const detailTerms = [
    [c.manager, offering.manager.name[lang], null],
    [c.strategy, offering.strategyIds.map((id) => taxonomyLabel(strategies, id, lang)).join(", "), null],
    [c.geography, offering.regionIds.map((id) => taxonomyLabel(regions, id, lang)).join(", "), null],
    [lang === "tr" ? "Varlık sınıfı" : "Asset class", offering.assetClassIds.join(", "), null],
    [lang === "tr" ? "Fon durumu" : "Fund status", localized(offering.fundStatus, lang, offering.status), offering.lastUpdated ?? offering.verifiedAt],
    [lang === "tr" ? "Başlangıç" : "Inception", offering.inceptionDate ?? "—", null],
    [lang === "tr" ? "Yönetim ücreti" : "Management fee", localized(offering.managementFee, lang), null],
    [lang === "tr" ? "Değerleme" : "Valuation", localized(offering.valuationFrequency, lang), null],
    [lang === "tr" ? "Dağıtım sıklığı" : "Distribution frequency", localized(offering.distributionFrequency, lang), null],
    [lang === "tr" ? "Birim fiyatı" : "Unit price", share?.unitPrice ? formatCurrencyCad(share.unitPrice.value, lang) : "—", share?.unitPrice ? formatSourceLine(share.unitPrice, lang) : null],
    [lang === "tr" ? "Vade" : "Term", share?.term?.value ?? "—", share?.term ? formatSourceLine(share.term, lang) : null],
    [lang === "tr" ? "Geri alım" : "Redemption", localized(share?.redemptionTerms, lang), null],
    ["DRIP", localized(share?.drip, lang), null],
    [c.registeredAccounts, share?.registeredAccountTypes.length ? share.registeredAccountTypes.join(", ") : (lang === "tr" ? "Yayımlanmış uygunluk bilgisi yok" : "No published eligibility information"), null],
    [c.reviewPaths, offering.complianceProfile.approvedOntarioExemptions.length ? offering.complianceProfile.approvedOntarioExemptions.join(", ") : (lang === "tr" ? "Lisanslı inceleme gerekli" : "Licensed review required"), offering.complianceProfile.reviewedAt ?? null],
  ] as const;
  return (
    <details className="group overflow-hidden border border-[#d8d1c2] bg-white shadow-[0_4px_18px_rgba(22,35,46,0.04)]">
      <summary className="cursor-pointer list-none p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="bg-[#e9f0eb] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#35664a]">{offering.status}</span><span className="bg-[#f3efe4] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#7a622c]">{localized(offering.fundType, lang)}</span></div><h3 className="mt-4 font-serif text-3xl font-semibold">{offering.shortName[lang]}</h3><p className="mt-2 text-sm text-[#6c7880]">{offering.manager.name[lang]}</p><p className="mt-5 max-w-3xl text-sm leading-7 text-[#5d6b75]">{offering.summary[lang]}</p></div>
          <div className="grid shrink-0 grid-cols-2 gap-px bg-[#ded8cb] sm:grid-cols-4 lg:w-[560px]">{terms.map(([label, value, note]) => <div key={label} className="bg-[#fbfaf7] p-4"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7a858d]">{label}</p><p className="mt-2 text-sm font-semibold text-[#213746]">{value}</p>{note && <p className="mt-1 text-[9px] text-[#8b949a]">{note}</p>}</div>)}</div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-[#e6e1d7] pt-4 text-xs font-semibold text-[#0a4b72]"><span>{c.review}</span><ChevronDown className="size-4 transition group-open:rotate-180" /></div>
      </summary>
      <div className="border-t border-[#d8d1c2] bg-[#fbfaf7] p-5 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <article className="border border-[#e0dacd] bg-white p-5"><h4 className="font-semibold">{c.thesis}</h4><p className="mt-3 text-sm leading-7 text-[#65727b]">{offering.thesis[lang]}</p></article>
            <div className="grid gap-5 md:grid-cols-2"><article className="border border-[#e0dacd] bg-white p-5"><h4 className="font-semibold">{c.benefits}</h4><ul className="mt-4 space-y-3">{benefits.map((item) => <li key={item[lang]} className="flex gap-2 text-sm leading-6 text-[#65727b]"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#3d7257]" />{item[lang]}</li>)}</ul></article><article className="border border-[#e0dacd] bg-white p-5"><h4 className="font-semibold">{c.risks}</h4><ul className="mt-4 space-y-3">{offering.risks.map((item) => <li key={item[lang]} className="flex gap-2 text-sm leading-6 text-[#65727b]"><CircleAlert className="mt-1 size-4 shrink-0 text-[#9a7226]" />{item[lang]}</li>)}</ul></article></div>
            <article className="border border-[#e0dacd] bg-white p-5"><h4 className="font-semibold">{c.portfolio}</h4><div className="mt-4 grid gap-3 sm:grid-cols-2">{offering.properties.map((property) => <div key={property.id} className="border border-[#ece7de] p-3"><p className="text-sm font-semibold">{property.name[lang]}</p><p className="mt-1 text-xs text-[#74808a]">{property.city}, {property.province} · {property.assetClassId}</p></div>)}</div></article>
          </div>
          <aside className="space-y-5">
            <article className="border border-[#e0dacd] bg-white p-5"><h4 className="font-semibold">{c.terms}</h4><dl className="mt-4 divide-y divide-[#ece7de] text-sm">{detailTerms.map(([label, value, note]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-[#74808a]">{label}</dt><dd className="max-w-[65%] text-right font-semibold">{value}{note && <span className="mt-1 block text-[9px] font-normal text-[#8b949a]">{note}</span>}</dd></div>)}</dl></article>
            {offering.trailingReturns?.length ? <article className="border border-[#e0dacd] bg-white p-5"><h4 className="font-semibold">{c.performance}</h4><div className="mt-4 divide-y divide-[#ece7de] border-y border-[#ece7de]">{offering.trailingReturns.map((row) => <div key={row.period[lang]} className="flex justify-between gap-4 py-3 text-sm"><span className="text-[#74808a]">{row.period[lang]}</span><span className="font-semibold">{row.value}</span></div>)}</div>{offering.trailingReturnsNote && <p className="mt-3 text-[10px] leading-5 text-[#7f8990]">{offering.trailingReturnsNote[lang]}</p>}</article> : null}
            <article className="border border-[#e0dacd] bg-white p-5"><h4 className="font-semibold">{c.documents}</h4>{publicDocuments.length ? <div className="mt-4 space-y-3">{publicDocuments.map((document) => <div key={document.id} className="flex items-start gap-3 border-t border-[#ece7de] pt-3"><FileText className="mt-0.5 size-4 shrink-0 text-[#8f7030]" /><div className="min-w-0"><p className="text-sm font-semibold">{document.title[lang]}</p><p className="mt-1 text-[10px] text-[#7f8990]">{document.effectiveDate} · {document.version}</p>{document.href && <a href={document.href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#0a4b72]">View document</a>}</div></div>)}</div> : <p className="mt-3 text-sm leading-6 text-[#74808a]">{c.noPublicDocs}</p>}</article>
            <div className="grid gap-2"><Link href={`${NORTH_BASE}/sign-up?offering=${encodeURIComponent(offering.slug)}`} className="inline-flex h-11 items-center justify-center gap-2 bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.createAccount}<ArrowRight className="size-4" /></Link><a href={buildHncWhatsAppUrl(offering.slug)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 border border-[#c9c1af] bg-white px-4 text-sm font-semibold text-[#344b5a]"><MessageCircle className="size-4" />{c.talk}</a></div>
          </aside>
        </div>
      </div>
    </details>
  );
}
