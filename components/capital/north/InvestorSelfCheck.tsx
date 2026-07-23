"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, RotateCcw, UserRound } from "lucide-react";
import {
  assessCanadianFinancialProfile,
  qualificationBandsToReadinessAnswers,
  type InvestorQualificationBands,
} from "@/lib/capital/investor-readiness";
import type { InvestorFinancialResult, Lang } from "@/lib/capital/types";

export type SelfCheckAccountType = "individual" | "entity";
export type SelfCheckCategory = "accredited" | "eligible" | "entity" | "review";

/**
 * The 13 financial-band answer labels. These are factual CAD thresholds and are
 * intentionally identical across the onboarding self-check, the profile re-check,
 * and the master investor-qualification resource, so they live here once.
 */
export const SELF_CHECK_BANDS = {
  en: {
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
  tr: {
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
} as const;

export type SelfCheckBandKey = keyof (typeof SELF_CHECK_BANDS)["en"];

/** Self-voice question copy shared by onboarding and the profile re-check. */
export const SELF_CHECK_COPY = {
  tr: {
    stepLabel: (a: number, b: number) => `Soru ${a} / ${b}`,
    restart: "Yeniden başla",
    back: "Geri",
    next: "İleri",
    seeResult: "Sonucu göster",
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
    bands: SELF_CHECK_BANDS.tr,
    resultEyebrow: "Yanıtlarınıza göre",
    accreditedTitle: "Akredite yatırımcı",
    eligibleTitle: "Uygun yatırımcı",
    entityTitle: "Şirket veya aile ofisi",
    reviewTitle: "İncelenecek",
    accreditedBody: "Kanada akredite yatırımcı gelir veya varlık eşiklerini karşılıyorsunuz.",
    eligibleBody: "Teklif memorandumu fırsatları için uygun yatırımcı eşiklerini karşılıyorsunuz.",
    entityBody: "Bir şirket, tröst veya aile ofisi aracılığıyla yatırım yapıyorsunuz.",
    reviewBody: "Yine de bir hesap oluşturabilirsiniz; ekibimiz seçeneklerinizi sizinle birlikte gözden geçirir. İsterseniz yanıtlarınızı değiştirin.",
    changeAnswers: "Yanıtlarımı değiştir",
  },
  en: {
    stepLabel: (a: number, b: number) => `Question ${a} of ${b}`,
    restart: "Start over",
    back: "Back",
    next: "Next",
    seeResult: "See result",
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
    bands: SELF_CHECK_BANDS.en,
    resultEyebrow: "Based on your answers",
    accreditedTitle: "Accredited investor",
    eligibleTitle: "Eligible investor",
    entityTitle: "Entity or family office",
    reviewTitle: "To be reviewed",
    accreditedBody: "You meet Canada’s accredited-investor income or asset thresholds.",
    eligibleBody: "You qualify under the eligible-investor thresholds for offering-memorandum opportunities.",
    entityBody: "You’re investing through a corporation, trust, or family office.",
    reviewBody: "You can still create an account; our team will review your options with you. Change your answers above if anything wasn’t right.",
    changeAnswers: "Change my answers",
  },
} as const;

export type SelfCheckCopy = (typeof SELF_CHECK_COPY)["en"] | (typeof SELF_CHECK_COPY)["tr"];

/**
 * Map the account type and financial bands to a persisted qualification band.
 * Reuses the shared assessment engine; `review` covers both the non-eligible
 * and needs-more-information outcomes for an individual.
 */
export function resolveSelfCheckCategory(
  accountType: SelfCheckAccountType,
  profile: InvestorQualificationBands,
): SelfCheckCategory {
  if (accountType === "entity") return "entity";
  const result: InvestorFinancialResult = assessCanadianFinancialProfile({
    accountType: "individual",
    answers: qualificationBandsToReadinessAnswers(profile),
  }).financialResult;
  if (result === "potentially-accredited") return "accredited";
  if (result === "potentially-eligible") return "eligible";
  return "review";
}

/** Localized label for a stored qualification band, for profile/display use. */
export function selfCheckCategoryLabel(category: SelfCheckCategory, lang: Lang): string {
  const c = SELF_CHECK_COPY[lang === "tr" ? "tr" : "en"];
  return category === "accredited"
    ? c.accreditedTitle
    : category === "eligible"
      ? c.eligibleTitle
      : category === "entity"
        ? c.entityTitle
        : c.reviewTitle;
}

export type SelfCheckResultContext = {
  accountType: SelfCheckAccountType;
  category: SelfCheckCategory;
  profile: InvestorQualificationBands;
  restart: () => void;
};

/**
 * The self-check stepper: account-type step + five financial bands, then a
 * category summary. Callers own the footer under the result via `resultFooter`
 * (onboarding renders its residence + agreement form; the profile re-check
 * renders a save button).
 */
export function InvestorSelfCheckFlow({
  lang,
  initialAccountType,
  initialProfile,
  resultFooter,
}: {
  lang: Lang;
  initialAccountType?: SelfCheckAccountType | null;
  initialProfile?: InvestorQualificationBands;
  resultFooter: (ctx: SelfCheckResultContext) => React.ReactNode;
}) {
  const c = SELF_CHECK_COPY[lang === "tr" ? "tr" : "en"];

  const [stage, setStage] = useState<"questions" | "result">("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [accountType, setAccountType] = useState<SelfCheckAccountType | null>(initialAccountType ?? null);
  const [profile, setProfile] = useState<InvestorQualificationBands>(initialProfile ?? {});

  const category = useMemo(
    () => resolveSelfCheckCategory(accountType ?? "individual", profile),
    [accountType, profile],
  );

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
  }

  if (stage === "result") {
    return (
      <ResultView
        copy={c}
        category={category}
        onChangeAnswers={() => setStage("questions")}
        footer={resultFooter({ accountType: accountType ?? "individual", category, profile, restart })}
      />
    );
  }

  return (
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
  );
}

function ResultView({
  copy,
  category,
  onChangeAnswers,
  footer,
}: {
  copy: SelfCheckCopy;
  category: SelfCheckCategory;
  onChangeAnswers: () => void;
  footer: React.ReactNode;
}) {
  const categoryTitle =
    category === "accredited"
      ? copy.accreditedTitle
      : category === "eligible"
        ? copy.eligibleTitle
        : category === "entity"
          ? copy.entityTitle
          : copy.reviewTitle;
  const categoryBody =
    category === "accredited"
      ? copy.accreditedBody
      : category === "eligible"
        ? copy.eligibleBody
        : category === "entity"
          ? copy.entityBody
          : copy.reviewBody;
  const CategoryIcon = category === "entity" ? Building2 : UserRound;

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

      {footer}
    </div>
  );
}

function QuestionStep({
  index,
  copy,
  accountType,
  onAccountType,
  profile,
  onProfile,
}: {
  index: number;
  copy: SelfCheckCopy;
  accountType: SelfCheckAccountType | null;
  onAccountType: (value: SelfCheckAccountType) => void;
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

function bandOptions(copy: SelfCheckCopy, keys: SelfCheckBandKey[]) {
  return keys.map((key) => ({ value: key, label: copy.bands[key] }));
}

export function QuestionShell({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[#18232d]">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-[#66747e]">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function ChoiceCard({
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

export function OptionList({
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
