"use client";

import Link from "next/link";
import { ArrowRight, Building2, MapPinned, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

const COPY = {
  en: {
    signIn: "Access portal", create: "Create account", eyebrow: "Canada · Private real estate · Alternatives",
    title: "A clearer view of Canadian private real estate and alternative investments.",
    body: "Hunter & Hunter Investment Advisory helps investors in Türkiye discover and understand selected Canadian private-market opportunities through source-led research, tangible asset context, and a human-supported path to licensed review.",
    primary: "Create your account", secondary: "Sign in",
    trust: ["Canadian opportunities", "Fund-approved sources and documents", "Human-supported licensed process"],
    mapLabel: "Real-asset view", mapTitle: "See the buildings behind the investment story", mapBody: "Move from a fund-level overview to the Canadian buildings, markets, source documents, and material terms beneath it. Portfolio figures represent funded capital—not live market value or direct property ownership.",
    investor: "Understand before you proceed", investorBody: "Compare published opportunities, terms, risks, liquidity, and source dates in one bilingual experience built for clarity.",
    professional: "A separate professional workspace", professionalBody: "Approved professionals can present controlled content, support investor journeys, and coordinate next steps without blurring licensed responsibilities.",
    transparent: "From overview to source", transparentBody: "Every opportunity begins with the broad picture and leads to property facts, controlling documents, risks, and the date each material detail was verified.",
    final: "Canadian private markets, made clearer.", finalBody: "Create an account to explore approved opportunities and begin the right conversation with Hunter & Hunter Investment Advisory.", legal: "Hunter & Hunter Investment Advisory supports research, education, interest records, and licensed-process coordination. Registrable securities activity is conducted through and supervised by Parvis.",
  },
  tr: {
    signIn: "Portala eriş", create: "Hesap oluştur", eyebrow: "Kanada · Özel gayrimenkul · Alternatif yatırımlar",
    title: "Kanada’daki özel gayrimenkul ve alternatif yatırımlara daha şeffaf bir bakış.",
    body: "Hunter & Hunter Yatırım Danışmanlığı, Türkiye’deki yatırımcıların seçili Kanada özel piyasa fırsatlarını kaynaklara dayalı araştırma, somut varlık bilgileri ve lisanslı incelemeye uzanan insan destekli bir süreçle keşfetmesine ve anlamasına yardımcı olur.",
    primary: "Hesabınızı oluşturun", secondary: "Giriş yapın",
    trust: ["Kanada’daki fırsatlar", "Fon onaylı kaynaklar ve belgeler", "İnsan destekli lisanslı süreç"],
    mapLabel: "Reel varlık görünümü", mapTitle: "Yatırım hikâyesinin arkasındaki binaları görün", mapBody: "Fon düzeyindeki genel bakıştan Kanada’daki binalara, pazarlara, kaynak belgelere ve önemli koşullara ilerleyin. Portföy tutarları canlı piyasa değeri veya doğrudan mülk sahipliği değil, fonlanan sermayeyi temsil eder.",
    investor: "İlerlemeden önce anlayın", investorBody: "Yayımlanmış fırsatları, koşulları, riskleri, likiditeyi ve kaynak tarihlerini açıklık için tasarlanmış iki dilli tek bir deneyimde karşılaştırın.",
    professional: "Ayrı bir profesyonel çalışma alanı", professionalBody: "Onaylı profesyoneller, lisanslı sorumlulukları birbirine karıştırmadan kontrollü içerik sunabilir, yatırımcı süreçlerini destekleyebilir ve sonraki adımları koordine edebilir.",
    transparent: "Genel bakıştan kaynağa", transparentBody: "Her fırsat geniş resimle başlar; mülk bilgilerine, belirleyici belgelere, risklere ve her önemli bilginin doğrulama tarihine kadar ilerler.",
    final: "Kanada özel piyasaları, daha anlaşılır.", finalBody: "Onaylı fırsatları keşfetmek ve Hunter & Hunter Yatırım Danışmanlığı ile doğru görüşmeyi başlatmak için hesap oluşturun.", legal: "Hunter & Hunter Yatırım Danışmanlığı araştırma, eğitim, ilgi kaydı ve lisanslı süreç koordinasyonunu destekler. Menkul kıymet kaydı gerektiren faaliyetler Parvis aracılığıyla ve Parvis gözetiminde yürütülür.",
  },
} as const;

export function PublicLanding() {
  const { lang, setLang } = useLang();
  const c = investorTerminology(pick(COPY, lang));
  const audienceCards = [
    { Icon: WalletCards, title: c.investor, body: c.investorBody },
    { Icon: UsersRound, title: c.professional, body: c.professionalBody },
    { Icon: Building2, title: c.transparent, body: c.transparentBody },
  ];
  return <div className="min-h-screen bg-[#f5f7f7] text-[#122b3c]">
    <header className="border-b border-[#dce3e7] bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8"><NorthBrand dark /><div className="flex items-center gap-2"><div className="mr-2 hidden rounded-md bg-[#eef2f4] p-0.5 sm:flex">{(["en", "tr"] as const).map((item) => <button key={item} type="button" onClick={() => setLang(item)} className={`h-8 rounded px-2.5 text-[11px] font-bold uppercase ${lang === item ? "bg-white text-[#0a2d46] shadow-sm" : "text-[#6c7982]"}`}>{item}</button>)}</div><Link href={`${NORTH_BASE}/sign-in`} className="hidden h-10 items-center rounded-md px-3 text-sm font-semibold text-[#0a2d46] sm:inline-flex">{c.signIn}</Link><Link href={`${NORTH_BASE}/sign-up`} className="inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.create}</Link></div></div></header>

    <main>
      <section className="overflow-hidden bg-[#09283d] text-white"><div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b96e]">{c.eyebrow}</p><h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl">{c.title}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">{c.body}</p><div className="mt-8 flex flex-wrap gap-3"><Link href={`${NORTH_BASE}/sign-up`} className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#0a2d46]">{c.primary}<ArrowRight className="size-4" /></Link><Link href={`${NORTH_BASE}/sign-in`} className="inline-flex h-11 items-center rounded-md border border-white/25 px-5 text-sm font-semibold text-white">{c.secondary}</Link></div><div className="mt-9 grid gap-3 text-sm text-white/68 sm:grid-cols-3">{c.trust.map((item) => <div key={item} className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#d6b96e]" />{item}</div>)}</div><DealerDisclosure level="short" tone="dark" className="mt-8 max-w-2xl border-t border-white/12 pt-6" /></div>
        <div className="relative mx-auto w-full max-w-xl"><div className="absolute -inset-12 rounded-full bg-[#2f7194]/20 blur-3xl" /><div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#e8eff1] p-4 shadow-2xl"><div className="relative h-[430px] overflow-hidden rounded-2xl bg-[linear-gradient(24deg,transparent_48%,#c7d6da_49%,#c7d6da_51%,transparent_52%),linear-gradient(-20deg,transparent_48%,#d1dcdf_49%,#d1dcdf_51%,transparent_52%),radial-gradient(circle_at_30%_35%,#f8faf9_0_12%,transparent_13%),radial-gradient(circle_at_70%_70%,#f8faf9_0_15%,transparent_16%),#dfe9eb]"><div className="absolute left-[18%] top-[26%] size-4 rounded-full border-4 border-white bg-[#b48735] shadow-lg" /><div className="absolute left-[62%] top-[58%] size-5 rounded-full border-4 border-white bg-[#0f607e] shadow-lg" /><div className="absolute right-[16%] top-[22%] size-4 rounded-full border-4 border-white bg-[#57774e] shadow-lg" /><div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-4 shadow-lg"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#73818a]">{c.mapLabel}</p><p className="mt-2 text-base font-semibold text-[#173246]">{c.mapTitle}</p><div className="mt-3 flex gap-2"><span className="h-2 flex-1 rounded-full bg-[#c9d8dd]" /><span className="h-2 w-1/3 rounded-full bg-[#b68b34]" /></div></div></div></div></div>
      </div></section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8"><div className="mx-auto max-w-3xl text-center"><MapPinned className="mx-auto size-7 text-[#0a4b72]" /><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{c.mapTitle}</h2><p className="mt-4 text-base leading-7 text-[#62727c]">{c.mapBody}</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{audienceCards.map(({ Icon, title, body }) => <article key={title} className="rounded-xl border border-[#dce3e7] bg-white p-6 shadow-[0_2px_10px_rgba(8,35,52,0.04)]"><span className="grid size-11 place-items-center rounded-xl bg-[#edf3f6] text-[#0a4b72]"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#63737d]">{body}</p></article>)}</div></section>

      <section className="bg-[#dfe9eb]"><div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-8"><h2 className="text-3xl font-semibold sm:text-4xl">{c.final}</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#5a6c77]">{c.finalBody}</p><Link href={`${NORTH_BASE}/sign-up`} className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white">{c.primary}<ArrowRight className="size-4" /></Link></div></section>
    </main>
    <footer className="bg-[#071c2c] px-4 py-8 text-xs leading-5 text-white/55 sm:px-8"><div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[auto_1fr] md:items-start"><p>© 2026 {lang === "tr" ? "Hunter & Hunter Yatırım Danışmanlığı" : "Hunter & Hunter Investment Advisory"}.</p><div className="max-w-3xl md:justify-self-end md:text-right"><p>{c.legal}</p><DealerDisclosure level="micro" tone="dark" className="mt-3 md:[&_div]:justify-end" /></div></div></footer>
  </div>;
}
