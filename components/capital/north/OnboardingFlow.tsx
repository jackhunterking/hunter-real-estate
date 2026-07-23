"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand, ParvisCoBrand } from "./NorthBrand";
import {
  InvestorSelfCheckFlow,
  type SelfCheckResultContext,
} from "./InvestorSelfCheck";

// Canada and the United States are pinned to the top; the rest are alphabetical.
const COUNTRIES = [
  "Canada",
  "United States",
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Brazzaville)",
  "Congo (Kinshasa)", "Costa Rica", "Côte d’Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "São Tomé and Príncipe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
  "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Türkiye",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
] as const;

const COPY = {
  tr: {
    title: "Hesabınızı kurun",
    detailsHeading: "Son birkaç ayrıntı",
    jurisdiction: "İkamet ettiğiniz ülke",
    countryPlaceholder: "Ülkenizi seçin",
    agreeBefore: "Hunter & Hunter’ın ",
    agreeLink: "koşullarını ve gizlilik politikasını",
    agreeAfter: " kabul ediyorum.",
    submit: "Hesap oluştur",
    pending: "Kaydediliyor…",
    error: "Kurulum kaydedilemedi. Lütfen tekrar deneyin.",
    secured: "Bağlantınız şifrelenmiştir",
  },
  en: {
    title: "Set up your account",
    detailsHeading: "A few final details",
    jurisdiction: "Country of residence",
    countryPlaceholder: "Select your country",
    agreeBefore: "I agree to Hunter & Hunter’s ",
    agreeLink: "terms and privacy policy",
    agreeAfter: ".",
    submit: "Create account",
    pending: "Saving…",
    error: "Setup could not be saved. Please try again.",
    secured: "Your connection is encrypted",
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

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const destination = useMemo(() => {
    if (offeringSlug) {
      return `${NORTH_BASE}/investments/${encodeURIComponent(offeringSlug)}`;
    }
    return returnPath?.startsWith(`${NORTH_BASE}/`) ? returnPath : `${NORTH_BASE}/portfolio`;
  }, [offeringSlug, returnPath]);

  async function submit(event: React.FormEvent<HTMLFormElement>, ctx: SelfCheckResultContext) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const agreed = form.get("agree") === "on";
    const investorAccountType = ctx.accountType === "entity" ? "entity" : "individual";
    const onboarding = await fetch("/api/hnc-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountIntent: "investor",
        investorAccountType,
        residenceJurisdiction: form.get("jurisdiction"),
        agreed,
      }),
    });
    if (!onboarding.ok) {
      setPending(false);
      setError(c.error);
      return;
    }
    // Persist the computed qualification band as a second step so the onboarding
    // RPC signature stays untouched. A failure here is non-blocking: the account
    // is already set up and the band can be re-checked from the profile.
    await fetch("/api/investor-self-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investorAccountType, qualificationCategory: ctx.category }),
    }).catch(() => undefined);
    setPending(false);
    router.replace(destination);
    router.refresh();
  }

  const inputClass =
    "mt-2 h-12 w-full rounded-md border border-[#cfd5da] bg-white px-3.5 font-normal text-[#18232d] outline-none transition placeholder:text-[#8b969f] hover:border-[#aeb8bf] focus:border-[#173b57] focus:ring-2 focus:ring-[#173b57]/12";

  return (
    <main lang={lang} className="min-h-screen bg-[#f3f5f6] text-[#18232d]">
      <header className="border-b border-[#dfe3e6] bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <NorthBrand dark showCoBrand={false} />
          <ParvisCoBrand dark className="shrink-0" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-10 sm:px-8 sm:py-14">
        <section className="w-full max-w-[560px] rounded-lg border border-[#d9dee2] bg-white px-6 py-8 shadow-[0_8px_24px_rgba(20,38,52,0.05)] sm:px-9 sm:py-9" aria-labelledby="onboarding-title">
          <div className="mb-7">
            <h1 id="onboarding-title" className="text-2xl font-semibold tracking-[-0.025em] text-[#102638] sm:text-[1.7rem]">
              {c.title}
            </h1>
          </div>

          <InvestorSelfCheckFlow
            lang={lang}
            resultFooter={(ctx) => (
              <form onSubmit={(event) => submit(event, ctx)} className="mt-6 space-y-4 border-t border-[#e2e6e8] pt-6">
                <label className="block text-sm font-medium text-[#283640]">
                  {c.jurisdiction}
                  <select name="jurisdiction" required defaultValue="" className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%2366747e%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpolyline%20points=%226%209%2012%2015%2018%209%22/%3E%3C/svg%3E')] bg-[length:18px] bg-[right_0.9rem_center] bg-no-repeat pr-11`}>
                    <option value="" disabled>
                      {c.countryPlaceholder}
                    </option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-start gap-2.5 pt-1 text-xs leading-5 text-[#5a6772]">
                  <input name="agree" required type="checkbox" className="mt-0.5 accent-[#173b57]" />
                  <span>
                    {c.agreeBefore}
                    <Link href={`${NORTH_BASE}/legal`} target="_blank" className="font-semibold text-[#173b57] underline underline-offset-2">
                      {c.agreeLink}
                    </Link>
                    {c.agreeAfter}
                  </span>
                </label>

                {error && (
                  <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">
                    {error}
                  </p>
                )}

                <button
                  disabled={pending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#102f46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173f5c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? c.pending : c.submit}
                  <ArrowRight className="size-4" />
                </button>
              </form>
            )}
          />
        </section>

        <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[#5f6d77]">
          <LockKeyhole className="size-3.5" aria-hidden />
          {c.secured}
        </p>
        <DealerDisclosure level="short" className="mt-6 max-w-[560px] text-center" />
      </div>
    </main>
  );
}
