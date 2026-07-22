"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, UserRound } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand, ParvisCoBrand } from "./NorthBrand";

type InvestorType = "accredited" | "eligible" | "entity";
type AccountType = "individual" | "entity";

const COPY = {
  tr: {
    eyebrow: "Güvenli hesap kurulumu",
    title: "Yatırımcı hesabınızı kurun",
    body: "Doğru materyalleri hazırlayabilmemiz için ne tür bir yatırımcı olduğunuzu belirtin. Bu seçim uygunluk veya yerindelik sağlamaz; bunlar Hunter & Hunter Investment Advisors ekibiyle teyit edilir.",
    classHeading: "Ne tür bir yatırımcısınız?",
    accredited: "Akredite yatırımcı",
    accreditedBody: "Kanada akredite yatırımcı kategorisi için gelir veya varlık eşiklerini karşılıyorsunuz.",
    eligible: "Uygun (eligible) yatırımcı",
    eligibleBody: "Teklif memorandumu fırsatları için uygun yatırımcı eşiklerini karşılıyorsunuz.",
    entity: "Şirket veya aile ofisi",
    entityBody: "Bir şirket, tröst veya aile ofisi aracılığıyla yatırım yapıyorsunuz.",
    qualifyPrompt: "Hangisinin geçerli olduğundan emin değil misiniz?",
    qualifyLink: "Yatırımcı uygunluk aracını kullanın",
    jurisdiction: "İkamet / yetki alanı",
    objective: "Genel yatırım amacı",
    horizon: "Genel zaman ufku",
    risk: "Özel piyasa yatırımlarında sermaye kaybı, sınırlı likidite ve uzun elde tutma süresi olabileceğini anlıyorum.",
    consent: "Hunter & Hunter Investment Advisors’ın bu talep hakkında benimle iletişim kurmasına izin veriyorum.",
    submit: "Hesap kurulumunu tamamla",
    pending: "Kaydediliyor…",
    error: "Kurulum kaydedilemedi. Lütfen tekrar deneyin.",
    privacy: "Bu bilgiler ön sınıflandırma içindir; onaylanmış uygunluk veya yatırım izni değildir.",
  },
  en: {
    eyebrow: "Secure account setup",
    title: "Set up your investor account",
    body: "Tell us what type of investor you are so we can prepare the right materials. This selection does not establish eligibility or suitability — those are confirmed with the Hunter & Hunter Investment Advisors team.",
    classHeading: "What type of investor are you?",
    accredited: "Accredited investor",
    accreditedBody: "You meet the income or asset thresholds for Canada’s accredited-investor category.",
    eligible: "Eligible investor",
    eligibleBody: "You qualify under the eligible-investor thresholds for offering-memorandum opportunities.",
    entity: "Entity or family office",
    entityBody: "You’re investing through a corporation, trust, or family office.",
    qualifyPrompt: "Not sure which applies?",
    qualifyLink: "Use the investor qualification tool",
    jurisdiction: "Residence / jurisdiction",
    objective: "General investment objective",
    horizon: "General time horizon",
    risk: "I understand that private-market investments may involve loss of capital, limited liquidity, and long holding periods.",
    consent: "I consent to Hunter & Hunter Investment Advisors contacting me about this request.",
    submit: "Complete account setup",
    pending: "Saving…",
    error: "Setup could not be saved. Please try again.",
    privacy: "These details support preliminary classification; they are not confirmed eligibility or investment permission.",
  },
} as const;

export function OnboardingFlow({
  offeringSlug,
  returnPath,
}: {
  offeringSlug?: string;
  returnPath?: string;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const c = pick(COPY, lang);
  const [investorType, setInvestorType] = useState<InvestorType | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const accountType: AccountType = investorType === "entity" ? "entity" : "individual";

  const destination = useMemo(() => {
    if (offeringSlug) {
      return `${NORTH_BASE}/funds/${encodeURIComponent(offeringSlug)}`;
    }
    return returnPath?.startsWith(`${NORTH_BASE}/`) ? returnPath : `${NORTH_BASE}/portfolio`;
  }, [offeringSlug, returnPath]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!investorType) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await fetch("/api/hnc-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountIntent: "investor",
        investorAccountType: accountType,
        residenceJurisdiction: form.get("jurisdiction"),
        investmentObjective: form.get("objective"),
        timeHorizon: form.get("horizon"),
        riskAcknowledged: form.get("risk") === "on",
        contactConsent: form.get("consent") === "on",
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(c.error);
      return;
    }
    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#0a2539] px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <NorthBrand showCoBrand={false} />
          <ParvisCoBrand />
        </div>

        <section className="mt-10 overflow-hidden rounded-lg border border-white/10 bg-white text-[#172b3a] shadow-xl">
          <header className="border-b border-[#e2e8f0] bg-[#0a2539] px-6 py-8 text-white sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{c.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl font-serif text-3xl font-semibold sm:text-4xl">{c.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">{c.body}</p>
          </header>

          <form onSubmit={submit} className="p-6 sm:p-10">
            <fieldset>
              <legend className="text-sm font-semibold text-[#172b3a]">{c.classHeading}</legend>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {([
                  ["accredited", UserRound, c.accredited, c.accreditedBody],
                  ["eligible", UserRound, c.eligible, c.eligibleBody],
                  ["entity", Building2, c.entity, c.entityBody],
                ] as const).map(([value, Icon, title, body]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInvestorType(value)}
                    aria-pressed={investorType === value}
                    className={`rounded-lg border p-5 text-left transition ${
                      investorType === value
                        ? "border-[#0a2539] bg-[#f1f5f9] ring-2 ring-[#0a2539]/15"
                        : "border-[#e2e8f0] bg-white hover:border-[#94a3b8]"
                    }`}
                  >
                    <Icon className="size-6 text-[#334155]" />
                    <span className="mt-4 block font-semibold text-[#172b3a]">{title}</span>
                    <span className="mt-2 block text-sm leading-6 text-[#64748b]">{body}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-[#64748b]">
                {c.qualifyPrompt}{" "}
                <Link
                  href={`${NORTH_BASE}/resources/investor-readiness`}
                  className="font-semibold text-[#0a2539] underline underline-offset-2 hover:text-[#123f5e]"
                >
                  {c.qualifyLink}
                </Link>
              </p>
            </fieldset>

            {investorType && (
              <div className="mt-8 space-y-6 border-t border-[#e2e8f0] pt-8">
                <div className="grid gap-5 md:grid-cols-3">
                  {([
                    ["jurisdiction", c.jurisdiction, "Ontario, Canada"],
                    ["objective", c.objective, lang === "tr" ? "Uzun vadeli büyüme" : "Long-term growth"],
                    ["horizon", c.horizon, lang === "tr" ? "5–10 yıl" : "5–10 years"],
                  ] as const).map(([name, label, placeholder]) => (
                    <label key={name} className="text-sm font-semibold text-[#172b3a]">
                      {label}
                      <input
                        name={name}
                        required
                        maxLength={name === "jurisdiction" ? 120 : 160}
                        placeholder={placeholder}
                        className="mt-2 h-11 w-full rounded-md border border-[#cbd5e1] bg-white px-3 font-normal text-[#172b3a] outline-none focus:border-[#0a2539]"
                      />
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 text-sm leading-6 text-[#475569]">
                    <input name="risk" required type="checkbox" className="mt-1 accent-[#0a2539]" />
                    {c.risk}
                  </label>
                  <label className="flex items-start gap-3 text-sm leading-6 text-[#475569]">
                    <input name="consent" required type="checkbox" className="mt-1 accent-[#0a2539]" />
                    {c.consent}
                  </label>
                </div>

                {error && (
                  <p role="alert" className="rounded-md border border-[#e5c9c4] bg-[#faf1ef] p-3 text-sm text-[#8f4a40]">
                    {error}
                  </p>
                )}
                <div className="flex flex-col justify-between gap-4 border-t border-[#e2e8f0] pt-6 sm:flex-row sm:items-center">
                  <p className="flex max-w-xl items-start gap-2 text-xs leading-5 text-[#64748b]">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#64748b]" />
                    {c.privacy}
                  </p>
                  <button
                    disabled={pending}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0a2539] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e] disabled:opacity-60"
                  >
                    {pending ? c.pending : c.submit}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-5 sm:px-10">
            <DealerDisclosure level="short" />
          </div>
        </section>
      </div>
    </main>
  );
}
