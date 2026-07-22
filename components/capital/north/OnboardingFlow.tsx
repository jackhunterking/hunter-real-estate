"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, LockKeyhole, RotateCcw, UserRound } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import {
  assessCanadianFinancialProfile,
  qualificationBandsToReadinessAnswers,
  type InvestorQualificationBands,
} from "@/lib/capital/investor-readiness";
import type { InvestorFinancialResult } from "@/lib/capital/types";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand, ParvisCoBrand } from "./NorthBrand";

type InvestorCategory = "accredited" | "eligible" | "entity";
type AccountType = "individual" | "entity";

const COPY = {
  tr: {
    eyebrow: "Güvenli hesap kurulumu",
    title: "Hesabınızı kurun",
    body: "Birkaç kısa soruyla hangi Kanada yatırımcı kategorisine girdiğinizi belirleyelim. Kendinizi sınıflandırmanıza gerek yok — yanıtlarınızdan biz belirleriz. Bu bir ön göstergedir; uygunluk Hunter & Hunter Investment Advisors ekibiyle teyit edilir.",
    stepLabel: (a: number, b: number) => `Soru ${a} / ${b}`,
    restart: "Yeniden başla",
    back: "Geri",
    next: "İleri",
    seeResult: "Sonucu göster",
    // Questions
    accountTitle: "Yatırımı kim yapacak?",
    accountBody: "Bu formu dolduran kişi değil, yasal alıcı.",
    individual: "Bireysel",
    individualHelp: "Kişisel olarak veya eşinizle birlikte yatırım yapıyorsunuz.",
    entity: "Şirket veya aile ofisi",
    entityHelp: "Bir şirket, tröst veya aile ofisi aracılığıyla yatırım yapıyorsunuz.",
    registrationTitle: "Uygun bir Kanada menkul kıymet kaydınız var mı?",
    registrationBody: "Kanadalı bir dealer veya adviser temsilcisi olarak — mevcut veya belirli eski kayıt.",
    financialAssetsTitle: "Net finansal varlıklarınız ne kadar?",
    financialAssetsBody: "Nakit ve yatırımlardan ilgili borçları çıkarın. Gayrimenkul hariç.",
    incomeTitle: "Vergi öncesi bireysel net geliriniz ne kadardı?",
    incomeBody: "Son iki yılın her birinde aştığınız ve bu yıl da beklediğiniz tutar.",
    spouseTitle: "Eşinizle birleşik net geliriniz ne kadardı?",
    spouseBody: "Aynı iki yıllık test, eşinizle birlikte.",
    netAssetsTitle: "Toplam net varlıklarınız ne kadar?",
    netAssetsBody: "Sahip olduklarınızdan borçlarınızı çıkarın. Gayrimenkul dahil olabilir.",
    yes: "Evet",
    no: "Hayır",
    bands: {
      "above-million": "1.000.000 CAD üzerinde",
      "million-or-less": "1.000.000 CAD veya altında",
      "above-200": "200.000 CAD üzerinde",
      "above-75-to-200": "75.000 CAD üzerinde, 200.000 CAD'a kadar",
      "75-or-less": "75.000 CAD veya altında",
      "above-300": "300.000 CAD üzerinde",
      "above-125-to-300": "125.000 CAD üzerinde, 300.000 CAD'a kadar",
      "125-or-less": "125.000 CAD veya altında",
      "not-applicable": "Eş yok / uygulanmıyor",
      "five-million-plus": "5.000.000 CAD veya üzerinde",
      "above-400-under-five": "400.000 CAD üzerinde, 5.000.000 CAD altında",
      "400-or-less": "400.000 CAD veya altında",
    },
    // Result
    resultEyebrow: "Yanıtlarınıza göre",
    resultAccredited: "Akredite yatırımcı eşikleriyle eşleşiyorsunuz",
    resultEligible: "Uygun (eligible) yatırımcı eşikleriyle eşleşiyorsunuz",
    resultEntity: "Şirket / aile ofisi — profesyonel inceleme gerekir",
    resultNone: "Şu anda akredite veya uygun eşiklerle eşleşmiyorsunuz",
    resultBodyMatch: "Aşağıda kategoriniz işaretlenmiştir. Bu bir ön göstergedir; kesin uygunluk ekibimizce teyit edilir. Yanıtlarınızı değiştirebilir veya hesabınızı oluşturabilirsiniz.",
    resultBodyNone: "Yine de bir hesap oluşturabilirsiniz; ekibimiz seçeneklerinizi sizinle birlikte gözden geçirir. İsterseniz yanıtlarınızı değiştirin.",
    resultBodyEntity: "Kuruluş kategorileri hukuki yapıya bağlıdır ve ekibimizce incelenir. Hesabınızı oluşturabilirsiniz.",
    yourCategory: "Kategoriniz",
    accreditedBody: "Kanada akredite yatırımcı gelir veya varlık eşiklerini karşılıyorsunuz.",
    eligibleBody: "Teklif memorandumu fırsatları için uygun yatırımcı eşiklerini karşılıyorsunuz.",
    entityBody: "Bir şirket, tröst veya aile ofisi aracılığıyla yatırım yapıyorsunuz.",
    changeAnswers: "Yanıtlarımı değiştir",
    // Final details
    detailsHeading: "Son birkaç ayrıntı",
    jurisdiction: "İkamet / yetki alanı",
    objective: "Genel yatırım amacı",
    horizon: "Genel zaman ufku",
    risk: "Özel piyasa yatırımlarında sermaye kaybı, sınırlı likidite ve uzun elde tutma süresi olabileceğini anlıyorum.",
    consent: "Hunter & Hunter Investment Advisors’ın bu talep hakkında benimle iletişim kurmasına izin veriyorum.",
    submit: "Hesap oluştur",
    pending: "Kaydediliyor…",
    error: "Kurulum kaydedilemedi. Lütfen tekrar deneyin.",
    privacy: "Bu bilgiler ön sınıflandırma içindir; onaylanmış uygunluk veya yatırım izni değildir.",
    secured: "Bağlantınız şifrelenmiştir",
  },
  en: {
    eyebrow: "Secure account setup",
    title: "Set up your account",
    body: "A few short questions tell us which Canadian investor category you fall into — you don’t have to classify yourself. This is a preliminary indicator; eligibility is confirmed with the Hunter & Hunter Investment Advisors team.",
    stepLabel: (a: number, b: number) => `Question ${a} of ${b}`,
    restart: "Start over",
    back: "Back",
    next: "Next",
    seeResult: "See result",
    // Questions
    accountTitle: "Who is investing?",
    accountBody: "The legal purchaser — not whoever is filling this out.",
    individual: "Individual",
    individualHelp: "You’re investing personally or jointly with a spouse.",
    entity: "Entity or family office",
    entityHelp: "You’re investing through a corporation, trust, or family office.",
    registrationTitle: "Do you hold qualifying Canadian securities registration?",
    registrationBody: "As a representative of a Canadian dealer or adviser — current or certain former.",
    financialAssetsTitle: "What are your net financial assets?",
    financialAssetsBody: "Cash and investments minus related debt. Excludes real estate.",
    incomeTitle: "What was your individual net income before tax?",
    incomeBody: "The amount you passed in each of the last two years, and expect this year.",
    spouseTitle: "What was your combined net income with a spouse?",
    spouseBody: "The same two-year test, combined with your spouse.",
    netAssetsTitle: "What are your total net assets?",
    netAssetsBody: "Everything you own minus what you owe. Real estate can be included.",
    yes: "Yes",
    no: "No",
    bands: {
      "above-million": "More than CAD $1,000,000",
      "million-or-less": "CAD $1,000,000 or less",
      "above-200": "More than CAD $200,000",
      "above-75-to-200": "More than CAD $75,000, up to $200,000",
      "75-or-less": "CAD $75,000 or less",
      "above-300": "More than CAD $300,000",
      "above-125-to-300": "More than CAD $125,000, up to $300,000",
      "125-or-less": "CAD $125,000 or less",
      "not-applicable": "No spouse / not applicable",
      "five-million-plus": "CAD $5,000,000 or more",
      "above-400-under-five": "More than CAD $400,000, under $5,000,000",
      "400-or-less": "CAD $400,000 or less",
    },
    // Result
    resultEyebrow: "Based on your answers",
    resultAccredited: "You match the accredited-investor thresholds",
    resultEligible: "You match the eligible-investor thresholds",
    resultEntity: "Entity / family office — professional review required",
    resultNone: "You don’t currently match the accredited or eligible thresholds",
    resultBodyMatch: "Your category is checked below. This is a preliminary indicator — final eligibility is confirmed by our team. You can change your answers or create your account.",
    resultBodyNone: "You can still create an account; our team will review your options with you. Change your answers above if anything wasn’t right.",
    resultBodyEntity: "Entity categories depend on legal form and are reviewed by our team. You can create your account.",
    yourCategory: "Your category",
    accreditedBody: "You meet Canada’s accredited-investor income or asset thresholds.",
    eligibleBody: "You qualify under the eligible-investor thresholds for offering-memorandum opportunities.",
    entityBody: "You’re investing through a corporation, trust, or family office.",
    changeAnswers: "Change my answers",
    // Final details
    detailsHeading: "A few final details",
    jurisdiction: "Residence / jurisdiction",
    objective: "General investment objective",
    horizon: "General time horizon",
    risk: "I understand that private-market investments may involve loss of capital, limited liquidity, and long holding periods.",
    consent: "I consent to Hunter & Hunter Investment Advisors contacting me about this request.",
    submit: "Create account",
    pending: "Saving…",
    error: "Setup could not be saved. Please try again.",
    privacy: "These details support preliminary classification; they are not confirmed eligibility or investment permission.",
    secured: "Your connection is encrypted",
  },
} as const;

type BandKey = keyof (typeof COPY)["en"]["bands"];

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

  const [stage, setStage] = useState<"questions" | "result">("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [profile, setProfile] = useState<InvestorQualificationBands>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const destination = useMemo(() => {
    if (offeringSlug) {
      return `${NORTH_BASE}/funds/${encodeURIComponent(offeringSlug)}`;
    }
    return returnPath?.startsWith(`${NORTH_BASE}/`) ? returnPath : `${NORTH_BASE}/portfolio`;
  }, [offeringSlug, returnPath]);

  const decision = useMemo(
    () =>
      assessCanadianFinancialProfile({
        accountType: accountType ?? "individual",
        answers: qualificationBandsToReadinessAnswers(profile),
      }),
    [accountType, profile],
  );

  const matchedCategory: InvestorCategory | null = useMemo(() => {
    if (accountType === "entity") return "entity";
    const r: InvestorFinancialResult = decision.financialResult;
    if (r === "potentially-accredited") return "accredited";
    if (r === "potentially-eligible") return "eligible";
    return null;
  }, [accountType, decision.financialResult]);

  // Individuals answer the five financial bands; entities skip straight to the result.
  const totalQuestions = accountType === "entity" ? 1 : 6;
  const isLastQuestion = questionIndex === totalQuestions - 1;

  function canContinue() {
    switch (questionIndex) {
      case 0:
        return Boolean(accountType);
      case 1:
        return Boolean(profile.registration);
      case 2:
        return Boolean(profile.financialAssets);
      case 3:
        return Boolean(profile.individualIncome);
      case 4:
        return Boolean(profile.spousalIncome);
      case 5:
        return Boolean(profile.netAssets);
      default:
        return false;
    }
  }

  function next() {
    if (!canContinue()) return;
    if (isLastQuestion) {
      setStage("result");
      return;
    }
    setQuestionIndex((current) => current + 1);
  }

  function back() {
    setQuestionIndex((current) => Math.max(0, current - 1));
  }

  function restart() {
    setStage("questions");
    setQuestionIndex(0);
    setAccountType(null);
    setProfile({});
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await fetch("/api/hnc-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountIntent: "investor",
        investorAccountType: accountType === "entity" ? "entity" : "individual",
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

          {stage === "questions" ? (
            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-[#53636f]">{c.stepLabel(questionIndex + 1, totalQuestions)}</p>
                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66747e] transition-colors hover:text-[#173b57]"
                >
                  <RotateCcw className="size-3.5" />
                  {c.restart}
                </button>
              </div>
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[#e6eaed]">
                <div
                  className="h-full rounded-full bg-[#173b57] transition-all"
                  style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              <QuestionStep
                index={questionIndex}
                copy={c}
                accountType={accountType}
                onAccountType={(value) => {
                  setAccountType(value);
                  if (value === "entity") setProfile({});
                }}
                profile={profile}
                onProfile={setProfile}
              />

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={questionIndex === 0}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d1d9de] px-4 text-sm font-semibold text-[#53636f] transition-colors hover:bg-[#f6f8f9] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="size-4" />
                  {c.back}
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={!canContinue()}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[#102f46] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#173f5c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLastQuestion ? c.seeResult : c.next}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <ResultStep
              copy={c}
              matchedCategory={matchedCategory}
              onChangeAnswers={() => setStage("questions")}
              onSubmit={submit}
              pending={pending}
              error={error}
              inputClass={inputClass}
              lang={lang}
            />
          )}
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

type Copy = (typeof COPY)["en"] | (typeof COPY)["tr"];

function QuestionStep({
  index,
  copy,
  accountType,
  onAccountType,
  profile,
  onProfile,
}: {
  index: number;
  copy: Copy;
  accountType: AccountType | null;
  onAccountType: (value: AccountType) => void;
  profile: InvestorQualificationBands;
  onProfile: (value: InvestorQualificationBands) => void;
}) {
  if (index === 0) {
    return (
      <QuestionShell title={copy.accountTitle} body={copy.accountBody}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard active={accountType === "individual"} onClick={() => onAccountType("individual")} icon={<UserRound className="size-5" />} title={copy.individual} body={copy.individualHelp} />
          <ChoiceCard active={accountType === "entity"} onClick={() => onAccountType("entity")} icon={<Building2 className="size-5" />} title={copy.entity} body={copy.entityHelp} />
        </div>
      </QuestionShell>
    );
  }

  if (index === 1) {
    return (
      <QuestionShell title={copy.registrationTitle} body={copy.registrationBody}>
        <OptionList
          value={profile.registration}
          onChange={(value) => onProfile({ ...profile, registration: value as InvestorQualificationBands["registration"] })}
          options={[
            { value: "yes", label: copy.yes },
            { value: "no", label: copy.no },
          ]}
        />
      </QuestionShell>
    );
  }

  if (index === 2) {
    return (
      <QuestionShell title={copy.financialAssetsTitle} body={copy.financialAssetsBody}>
        <OptionList
          value={profile.financialAssets}
          onChange={(value) => onProfile({ ...profile, financialAssets: value as InvestorQualificationBands["financialAssets"] })}
          options={bandOptions(copy, ["above-million", "million-or-less"])}
        />
      </QuestionShell>
    );
  }

  if (index === 3) {
    return (
      <QuestionShell title={copy.incomeTitle} body={copy.incomeBody}>
        <OptionList
          value={profile.individualIncome}
          onChange={(value) => onProfile({ ...profile, individualIncome: value as InvestorQualificationBands["individualIncome"] })}
          options={bandOptions(copy, ["above-200", "above-75-to-200", "75-or-less"])}
        />
      </QuestionShell>
    );
  }

  if (index === 4) {
    return (
      <QuestionShell title={copy.spouseTitle} body={copy.spouseBody}>
        <OptionList
          value={profile.spousalIncome}
          onChange={(value) => onProfile({ ...profile, spousalIncome: value as InvestorQualificationBands["spousalIncome"] })}
          options={bandOptions(copy, ["above-300", "above-125-to-300", "125-or-less", "not-applicable"])}
        />
      </QuestionShell>
    );
  }

  return (
    <QuestionShell title={copy.netAssetsTitle} body={copy.netAssetsBody}>
      <OptionList
        value={profile.netAssets}
        onChange={(value) => onProfile({ ...profile, netAssets: value as InvestorQualificationBands["netAssets"] })}
        options={bandOptions(copy, ["five-million-plus", "above-400-under-five", "400-or-less"])}
      />
    </QuestionShell>
  );
}

function bandOptions(copy: Copy, keys: BandKey[]) {
  return keys.map((key) => ({ value: key, label: copy.bands[key] }));
}

function QuestionShell({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[#18232d]">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-[#66747e]">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChoiceCard({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border p-4 text-left transition ${
        active ? "border-[#173b57] bg-[#f2f6f9] ring-2 ring-[#173b57]/12" : "border-[#d9dee2] bg-white hover:border-[#aeb8bf]"
      }`}
    >
      <span className="text-[#173b57]">{icon}</span>
      <span className="mt-3 block text-sm font-semibold text-[#18232d]">{title}</span>
      <span className="mt-1.5 block text-xs leading-5 text-[#66747e]">{body}</span>
    </button>
  );
}

function OptionList({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3.5 text-left text-sm font-medium transition ${
              active
                ? "border-[#173b57] bg-[#f2f6f9] text-[#102638] ring-2 ring-[#173b57]/12"
                : "border-[#d9dee2] bg-white text-[#334451] hover:border-[#aeb8bf]"
            }`}
          >
            {option.label}
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border transition ${
                active ? "border-[#173b57] bg-[#173b57] text-white" : "border-[#cfd5da] bg-white text-transparent"
              }`}
            >
              <Check className="size-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ResultStep({
  copy,
  matchedCategory,
  onChangeAnswers,
  onSubmit,
  pending,
  error,
  inputClass,
  lang,
}: {
  copy: Copy;
  matchedCategory: InvestorCategory | null;
  onChangeAnswers: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  error: string;
  inputClass: string;
  lang: string;
}) {
  const categoryTitle =
    matchedCategory === "accredited"
      ? lang === "tr" ? "Akredite yatırımcı" : "Accredited investor"
      : matchedCategory === "eligible"
        ? lang === "tr" ? "Uygun yatırımcı" : "Eligible investor"
        : matchedCategory === "entity"
          ? lang === "tr" ? "Şirket veya aile ofisi" : "Entity or family office"
          : lang === "tr" ? "İncelenecek" : "To be reviewed";
  const categoryBody =
    matchedCategory === "accredited"
      ? copy.accreditedBody
      : matchedCategory === "eligible"
        ? copy.eligibleBody
        : matchedCategory === "entity"
          ? copy.entityBody
          : copy.resultBodyNone;
  const CategoryIcon = matchedCategory === "entity" ? Building2 : UserRound;

  return (
    <div>
      <div className="flex items-start gap-3 rounded-lg border border-[#173b57] bg-[#f2f6f9] p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#173b57] text-white">
          <CategoryIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#53636f]">{copy.resultEyebrow}</p>
          <p className="mt-0.5 text-base font-semibold text-[#102638]">{categoryTitle}</p>
          <p className="mt-1 text-sm leading-6 text-[#66747e]">{categoryBody}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onChangeAnswers}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#173b57] transition-colors hover:underline"
      >
        <ArrowLeft className="size-4" />
        {copy.changeAnswers}
      </button>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 border-t border-[#e2e6e8] pt-6">
        <label className="block text-sm font-medium text-[#283640]">
          {copy.jurisdiction}
          <input name="jurisdiction" required maxLength={120} placeholder="Ontario, Canada" className={inputClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[#283640]">
            {copy.objective}
            <input name="objective" required maxLength={160} placeholder={lang === "tr" ? "Uzun vadeli büyüme" : "Long-term growth"} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-[#283640]">
            {copy.horizon}
            <input name="horizon" required maxLength={120} placeholder={lang === "tr" ? "5–10 yıl" : "5–10 years"} className={inputClass} />
          </label>
        </div>

        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5 text-xs leading-5 text-[#5a6772]">
            <input name="risk" required type="checkbox" className="mt-0.5 accent-[#173b57]" />
            {copy.risk}
          </label>
          <label className="flex items-start gap-2.5 text-xs leading-5 text-[#5a6772]">
            <input name="consent" required type="checkbox" className="mt-0.5 accent-[#173b57]" />
            {copy.consent}
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">
            {error}
          </p>
        )}

        <button
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#102f46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173f5c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? copy.pending : copy.submit}
          <ArrowRight className="size-4" />
        </button>
      </form>
    </div>
  );
}
