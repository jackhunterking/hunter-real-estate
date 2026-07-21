"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileSearch,
  Landmark,
  Layers,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import { PARVIS_RELATIONSHIP } from "@/lib/capital/investment-brand";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

const COPY = {
  en: {
    signIn: "Sign in",
    create: "Create account",
    eyebrow: "Canadian private real estate · Private equity · Alternatives",
    title: "Institutional-grade private markets, made clear for serious investors.",
    body: "Hunter & Hunter Investment Advisors gives investors worldwide a clear, source-led view of selected Canadian private real estate, private equity, and alternative opportunities — with tangible asset context and a human-supported path to licensed review.",
    primary: "Create your account",
    secondary: "Sign in",
    trust: [
      "Source-dated documents",
      "Curated Canadian opportunities",
      "Human-supported, licensed process",
    ],
    panelLabel: "Investment access",
    panelTitle: "A structured path into private markets",
    panelRows: [
      { k: "Dealer of record", v: "Parvis Investment Services Inc.", meta: "Exempt Market Dealer · NRD #74000" },
      { k: "Coverage", v: "Real estate, private equity & alternatives", meta: "Canadian private markets" },
      { k: "Every figure shown", v: "Carries its source and verification date", meta: "No unsourced claims" },
      { k: "Your access", v: "Reviewed through a licensed, human-supported process", meta: "Supervised by Parvis" },
    ],
    panelFoot: "Recording interest does not complete a transaction or establish eligibility.",
    pillarsEyebrow: "Why Hunter & Hunter",
    pillarsTitle: "Clarity before capital",
    pillarsBody: "Move from a fund-level overview to the assets, documents, and terms beneath it — in one bilingual experience built for confident decisions.",
    pillars: [
      { title: "See the real assets", body: "Every opportunity leads to the underlying Canadian buildings, markets, and source documents behind the numbers." },
      { title: "Source-led, dated research", body: "Terms, risks, liquidity, and targets are shown with the date each material detail was verified." },
      { title: "A licensed, human process", body: "Registrable securities activity is conducted through and supervised by Parvis, with a real person supporting each step." },
    ],
    stepsEyebrow: "How access works",
    stepsTitle: "From first look to informed decision",
    steps: [
      { n: "01", title: "Create your account", body: "Verify your email, then choose the investor or licensed-professional path." },
      { n: "02", title: "Explore approved opportunities", body: "Review curated Canadian private-market offerings with full terms and source documents." },
      { n: "03", title: "Begin licensed review", body: "Register your interest and continue through Parvis-supervised, human-supported steps." },
    ],
    final: "Private markets, made clearer.",
    finalBody: "Create an account to explore approved opportunities and begin the right conversation with Hunter & Hunter Investment Advisors.",
    legal: "Hunter & Hunter Investment Advisors supports research, education, interest records, and licensed-process coordination. Registrable securities activity is conducted through and supervised by Parvis.",
  },
  tr: {
    signIn: "Giriş yap",
    create: "Hesap oluştur",
    eyebrow: "Kanada özel gayrimenkul · Özel sermaye · Alternatif yatırımlar",
    title: "Kurumsal düzeyde özel piyasalar, ciddi yatırımcılar için netleştirildi.",
    body: "Hunter & Hunter Investment Advisors, dünyanın her yerindeki yatırımcılara seçili Kanada özel gayrimenkul, özel sermaye ve alternatif fırsatlarına kaynaklara dayalı net bir bakış sunar — somut varlık bilgileri ve lisanslı incelemeye uzanan insan destekli bir süreçle.",
    primary: "Hesabınızı oluşturun",
    secondary: "Giriş yap",
    trust: [
      "Kaynak tarihli belgeler",
      "Seçili Kanada fırsatları",
      "İnsan destekli lisanslı süreç",
    ],
    panelLabel: "Yatırım erişimi",
    panelTitle: "Özel piyasalara yapılandırılmış bir yol",
    panelRows: [
      { k: "Kayıtlı aracı kurum", v: "Parvis Investment Services Inc.", meta: "Exempt Market Dealer · NRD No. 74000" },
      { k: "Kapsam", v: "Gayrimenkul, özel sermaye ve alternatifler", meta: "Kanada özel piyasaları" },
      { k: "Gösterilen her veri", v: "Kaynağını ve doğrulama tarihini taşır", meta: "Kaynaksız iddia yok" },
      { k: "Erişiminiz", v: "Lisanslı, insan destekli bir süreçle incelenir", meta: "Parvis gözetiminde" },
    ],
    panelFoot: "İlgi kaydı oluşturmak bir işlemi tamamlamaz veya uygunluk oluşturmaz.",
    pillarsEyebrow: "Neden Hunter & Hunter",
    pillarsTitle: "Sermayeden önce netlik",
    pillarsBody: "Fon düzeyindeki genel bakıştan altındaki varlıklara, belgelere ve koşullara ilerleyin — güvenli kararlar için tasarlanmış iki dilli tek bir deneyimde.",
    pillars: [
      { title: "Gerçek varlıkları görün", body: "Her fırsat, rakamların arkasındaki Kanada binalarına, pazarlarına ve kaynak belgelerine ulaşır." },
      { title: "Kaynağa dayalı, tarihli araştırma", body: "Koşullar, riskler, likidite ve hedefler; her önemli bilginin doğrulandığı tarihle birlikte gösterilir." },
      { title: "Lisanslı, insan destekli süreç", body: "Menkul kıymet kaydı gerektiren faaliyetler Parvis aracılığıyla ve gözetiminde yürütülür; her adımda gerçek bir kişi eşlik eder." },
    ],
    stepsEyebrow: "Erişim nasıl işler",
    stepsTitle: "İlk bakıştan bilinçli karara",
    steps: [
      { n: "01", title: "Hesabınızı oluşturun", body: "E-postanızı doğrulayın, ardından yatırımcı veya lisanslı profesyonel yolunu seçin." },
      { n: "02", title: "Onaylı fırsatları keşfedin", body: "Seçili Kanada özel piyasa fırsatlarını tüm koşulları ve kaynak belgeleriyle inceleyin." },
      { n: "03", title: "Lisanslı incelemeyi başlatın", body: "İlginizi kaydedin ve Parvis gözetiminde, insan destekli adımlarla ilerleyin." },
    ],
    final: "Özel piyasalar, daha anlaşılır.",
    finalBody: "Onaylı fırsatları keşfetmek ve Hunter & Hunter Investment Advisors ile doğru görüşmeyi başlatmak için hesap oluşturun.",
    legal: "Hunter & Hunter Investment Advisors araştırma, eğitim, ilgi kaydı ve lisanslı süreç koordinasyonunu destekler. Menkul kıymet kaydı gerektiren faaliyetler Parvis aracılığıyla ve Parvis gözetiminde yürütülür.",
  },
} as const;

export function PublicLanding() {
  const { lang, setLang } = useLang();
  const c = investorTerminology(pick(COPY, lang));
  const pillarIcons = [Building2, FileSearch, ShieldCheck];

  return (
    <div className="min-h-screen bg-[#f5f7f7] text-[#122b3c]">
      <header className="sticky top-0 z-40 border-b border-[#e0e6ea] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
          <NorthBrand dark />
          <div className="flex items-center gap-2">
            <div className="mr-1 hidden rounded-md bg-[#eef2f4] p-0.5 sm:flex">
              {(["en", "tr"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLang(item)}
                  className={`h-8 rounded px-2.5 text-[11px] font-bold uppercase transition-colors ${
                    lang === item ? "bg-white text-[#0a2d46] shadow-sm" : "text-[#6c7982] hover:text-[#0a2d46]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Link
              href={`${NORTH_BASE}/sign-in`}
              className="hidden h-10 items-center rounded-md px-3 text-sm font-semibold text-[#0a2d46] hover:bg-[#eef2f4] sm:inline-flex"
            >
              {c.signIn}
            </Link>
            <Link
              href={`${NORTH_BASE}/sign-up`}
              className="inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e]"
            >
              {c.create}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#09283d] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 82% 12%, rgba(197,163,77,0.22), transparent 45%), radial-gradient(circle at 12% 88%, rgba(47,113,148,0.28), transparent 42%)",
            }}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b96e]">{c.eyebrow}</p>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-[1.06] sm:text-[3.4rem]">
                {c.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">{c.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`${NORTH_BASE}/sign-up`}
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#0a2d46] transition-transform hover:-translate-y-0.5"
                >
                  {c.primary}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={`${NORTH_BASE}/sign-in`}
                  className="inline-flex h-12 items-center rounded-md border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {c.secondary}
                </Link>
              </div>
              <div className="mt-9 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
                {c.trust.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#d6b96e]" />
                    {item}
                  </div>
                ))}
              </div>
              <DealerDisclosure level="short" tone="dark" className="mt-9 max-w-2xl border-t border-white/12 pt-6" />
            </div>

            {/* Credibility panel */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[2rem] bg-[#2f7194]/15 blur-2xl"
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white text-[#152b3b] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#e7ecef] bg-[#fbfcfd] px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#0a2d46] text-[#d6b96e]">
                      <Landmark className="size-4" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6c7982]">
                      {c.panelLabel}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3f6] px-2.5 py-1 text-[10px] font-semibold text-[#0a4b72]">
                    <Lock className="size-3" />
                    NRD #{PARVIS_RELATIONSHIP.nrdNumber}
                  </span>
                </div>
                <div className="px-6 py-5">
                  <h2 className="font-serif text-xl font-semibold text-[#102638]">{c.panelTitle}</h2>
                  <dl className="mt-4 divide-y divide-[#eef1f3]">
                    {c.panelRows.map((row) => (
                      <div key={row.k} className="py-3.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8894a0]">
                          {row.k}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold leading-6 text-[#1c3346]">{row.v}</dd>
                        <p className="mt-0.5 text-xs text-[#7a8790]">{row.meta}</p>
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="border-t border-[#eef1f3] bg-[#fbfcfd] px-6 py-4 text-xs leading-5 text-[#7a8790]">
                  {c.panelFoot}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a4b72]">{c.pillarsEyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-[#102638] sm:text-4xl">{c.pillarsTitle}</h2>
            <p className="mt-4 text-base leading-7 text-[#62727c]">{c.pillarsBody}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {c.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index] ?? Layers;
              return (
                <article
                  key={pillar.title}
                  className="rounded-xl border border-[#dce3e7] bg-white p-7 shadow-[0_2px_10px_rgba(8,35,52,0.04)] transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(8,35,52,0.18)]"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-[#0a2d46] text-[#d6b96e]">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[#152b3b]">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#63737d]">{pillar.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Process */}
        <section className="border-y border-[#dce6e9] bg-[#eef3f4]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a4b72]">{c.stepsEyebrow}</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#102638] sm:text-4xl">{c.stepsTitle}</h2>
            </div>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {c.steps.map((step) => (
                <li key={step.n} className="relative rounded-xl border border-[#d6dfe3] bg-white p-7">
                  <span className="font-serif text-3xl font-semibold text-[#c5a34d]">{step.n}</span>
                  <h3 className="mt-3 text-lg font-semibold text-[#152b3b]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#63737d]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#09283d] text-white">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-8">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{c.final}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/72">{c.finalBody}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={`${NORTH_BASE}/sign-up`}
                className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#0a2d46] transition-transform hover:-translate-y-0.5"
              >
                {c.primary}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={`${NORTH_BASE}/sign-in`}
                className="inline-flex h-12 items-center rounded-md border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {c.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#071c2c] px-4 py-10 text-xs leading-5 text-white/55 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[auto_1fr] md:items-start">
          <p>© 2026 Hunter &amp; Hunter Investment Advisors.</p>
          <div className="max-w-3xl md:justify-self-end md:text-right">
            <p>{c.legal}</p>
            <DealerDisclosure level="micro" tone="dark" className="mt-3 md:[&_div]:justify-end" />
          </div>
        </div>
      </footer>
    </div>
  );
}
