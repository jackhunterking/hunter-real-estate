"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, UserRound } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

type Intent = "investor" | "turkiye_licensed_professional_or_firm";
type AccountType = "individual" | "entity";

const COPY = {
  tr: {
    eyebrow: "Güvenli hesap kurulumu",
    title: "Hesabınızı nasıl kullanacağınızı seçin",
    body: "Bu seçim yalnızca doğru sürece yönlendirir. Yatırım uygunluğu, yerindelik veya partner yetkisi sağlamaz.",
    investor: "Yatırımcı",
    investorBody: "Kanada’daki fırsatları inceleyin, ilginizi kaydedin ve Hunter & Hunter Investment Advisors ekibiyle görüşün.",
    professional: "Türkiye lisanslı profesyonel veya firma",
    professionalBody: "Mevcut SPL lisansı ve SPK firma doğrulama sürecine devam edin.",
    individual: "Bireysel",
    entity: "Şirket / aile ofisi",
    accountType: "Hesap kimi temsil ediyor?",
    jurisdiction: "İkamet / yetki alanı",
    objective: "Genel yatırım amacı",
    horizon: "Genel zaman ufku",
    risk: "Özel piyasa yatırımlarında sermaye kaybı, sınırlı likidite ve uzun elde tutma süresi olabileceğini anlıyorum.",
    consent: "Hunter & Hunter Investment Advisors’ın bu talep hakkında benimle iletişim kurmasına izin veriyorum.",
    submit: "Kurulumu tamamla",
    pending: "Kaydediliyor…",
    error: "Kurulum kaydedilemedi. Lütfen tekrar deneyin.",
    privacy: "Bu bilgiler ön sınıflandırma içindir; onaylanmış uygunluk veya yatırım izni değildir.",
  },
  en: {
    eyebrow: "Secure account setup",
    title: "Choose how you will use your account",
    body: "This selection only routes you to the right process. It does not establish eligibility, suitability, or partner authorization.",
    investor: "Investor",
    investorBody: "Review Canadian opportunities, record your interest, and speak with the Hunter & Hunter Investment Advisors team.",
    professional: "Türkiye-licensed professional or firm",
    professionalBody: "Continue into the existing SPL licence and SPK firm-verification process.",
    individual: "Individual",
    entity: "Entity / family office",
    accountType: "Who does this account represent?",
    jurisdiction: "Residence / jurisdiction",
    objective: "General investment objective",
    horizon: "General time horizon",
    risk: "I understand that private-market investments may involve loss of capital, limited liquidity, and long holding periods.",
    consent: "I consent to Hunter & Hunter Investment Advisors contacting me about this request.",
    submit: "Complete setup",
    pending: "Saving…",
    error: "Setup could not be saved. Please try again.",
    privacy: "These details support preliminary classification; they are not confirmed eligibility or investment permission.",
  },
} as const;

export function OnboardingFlow({
  initialIntent,
  offeringSlug,
  returnPath,
}: {
  initialIntent?: Intent;
  offeringSlug?: string;
  returnPath?: string;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const c = pick(COPY, lang);
  const [intent, setIntent] = useState<Intent | null>(initialIntent ?? null);
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const destination = useMemo(() => {
    if (intent === "turkiye_licensed_professional_or_firm") {
      return `${NORTH_BASE}/partner/apply`;
    }
    return offeringSlug
      ? `${NORTH_BASE}/funds/${encodeURIComponent(offeringSlug)}`
      : returnPath?.startsWith(`${NORTH_BASE}/`)
        ? returnPath
      : `${NORTH_BASE}/portfolio`;
  }, [intent, offeringSlug, returnPath]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intent) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await fetch("/api/hnc-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountIntent: intent,
        investorAccountType: intent === "investor" ? accountType : null,
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
    <main className="min-h-screen bg-[#071c2c] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <NorthBrand />
        <section className="mt-10 overflow-hidden rounded-lg border border-white/15 bg-[#f7f4ec] text-[#172b3a] shadow-2xl">
          <header className="border-b border-[#d9d4c7] bg-[#0a2539] px-6 py-8 text-white sm:px-10">
            <h1 className="max-w-2xl font-serif text-3xl font-semibold sm:text-4xl">{c.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">{c.body}</p>
          </header>

          <form onSubmit={submit} className="p-6 sm:p-10">
            <div className="grid gap-4 md:grid-cols-2">
              {([
                ["investor", UserRound, c.investor, c.investorBody],
                ["turkiye_licensed_professional_or_firm", Building2, c.professional, c.professionalBody],
              ] as const).map(([value, Icon, title, body]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIntent(value)}
                  aria-pressed={intent === value}
                  className={`rounded-lg border p-5 text-left transition ${intent === value ? "border-[#9c7f39] bg-[#fffaf0] ring-2 ring-[#d8bf7a]/35" : "border-[#d7d5ce] bg-white hover:border-[#aab3b9]"}`}
                >
                  <Icon className="size-6 text-[#0a4b72]" />
                  <span className="mt-4 block font-semibold">{title}</span>
                  <span className="mt-2 block text-sm leading-6 text-[#68737c]">{body}</span>
                </button>
              ))}
            </div>

            {intent && (
              <div className="mt-8 space-y-6 border-t border-[#d9d4c7] pt-8">
                {intent === "investor" && (
                  <fieldset>
                    <legend className="text-sm font-semibold">{c.accountType}</legend>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {(["individual", "entity"] as const).map((value) => (
                        <label key={value} className="flex cursor-pointer items-center gap-2 rounded-md border border-[#d7d5ce] bg-white px-4 py-3 text-sm">
                          <input type="radio" name="accountType" checked={accountType === value} onChange={() => setAccountType(value)} />
                          {value === "individual" ? c.individual : c.entity}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div className="grid gap-5 md:grid-cols-3">
                  {([
                    ["jurisdiction", c.jurisdiction, "Ontario, Canada"],
                    ["objective", c.objective, lang === "tr" ? "Uzun vadeli büyüme" : "Long-term growth"],
                    ["horizon", c.horizon, lang === "tr" ? "5–10 yıl" : "5–10 years"],
                  ] as const).map(([name, label, placeholder]) => (
                    <label key={name} className="text-sm font-semibold">
                      {label}
                      <input name={name} required maxLength={name === "jurisdiction" ? 120 : 160} placeholder={placeholder} className="mt-2 h-11 w-full rounded-md border border-[#cdd3d6] bg-white px-3 font-normal outline-none focus:border-[#0a4b72]" />
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 text-sm leading-6 text-[#485762]"><input name="risk" required type="checkbox" className="mt-1" />{c.risk}</label>
                  <label className="flex items-start gap-3 text-sm leading-6 text-[#485762]"><input name="consent" required type="checkbox" className="mt-1" />{c.consent}</label>
                </div>

                {error && <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
                <div className="flex flex-col justify-between gap-4 border-t border-[#d9d4c7] pt-6 sm:flex-row sm:items-center">
                  <p className="flex max-w-xl items-start gap-2 text-xs leading-5 text-[#69757e]"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#597d68]" />{c.privacy}</p>
                  <button disabled={pending} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white disabled:opacity-60">
                    {pending ? c.pending : c.submit}<ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </form>
          <div className="border-t border-[#d9d4c7] bg-white px-6 py-5 sm:px-10">
            <DealerDisclosure level="short" />
          </div>
        </section>
      </div>
    </main>
  );
}
