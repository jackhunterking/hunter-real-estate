"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileUp, ShieldCheck, UserRound } from "lucide-react";
import type { ClientAccountType, ClientDocument, ClientJurisdiction, Lang, OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useClients } from "@/components/capital/north/ClientProvider";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { Panel, money } from "@/components/capital/north/PortalUI";
import { cn } from "@/lib/utils";

type FormState = {
  accountType: ClientAccountType; firstName: string; lastName: string; organization: string; email: string; phone: string; preferredLanguage: Lang | "both";
  jurisdiction: ClientJurisdiction; city: string; country: string;
  offeringId: string; shareClassId: string; amount: string; timeline: string; accountPreference: string;
  objective: string; horizon: string; riskTolerance: string; lossCapacity: string; liquidityNeed: string; experience: string;
  accreditedIncome: boolean; accreditedFinancialAssets: boolean; accreditedNetAssets: boolean; eligibleIncome: boolean; eligibleNetAssets: boolean; priorOmAmount: string;
  contactConsent: boolean; accuracyConsent: boolean;
};

const COPY = {
  tr: {
    eyebrow: "Yeni müşteri", title: "Müşteri tanıştırması oluştur", desc: "Temel bilgileri, yatırım ilgisini ve ön uygunluk yanıtlarını tek yönlendirmeli akışta tamamlayın.", step: "Adım", back: "Geri", continue: "Devam", cancel: "İptal", create: "Müşteri profilini oluştur", required: "Devam etmek için bu adımdaki gerekli alanları tamamlayın.", fileError: "Yalnızca 10 MB’a kadar PDF, JPG veya PNG dosyaları seçilebilir.", cancelConfirm: "Girilen bilgileri silip müşteri listesine dönmek istiyor musunuz?",
    steps: ["Kimlik ve iletişim", "Yargı alanı", "Yatırım ilgisi", "Hedefler ve deneyim", "Ön uygunluk", "Belgeler ve onay"],
    identityIntro: "Bu bilgiler partner tanıştırmasını ve takip iletişimini temsil eder.", individual: "Bireysel", entity: "Şirket / kuruluş", firstName: "Ad", lastName: "Soyad", organization: "Kurum", organizationRequired: "Kuruluş adı", email: "E-posta", phone: "Telefon (isteğe bağlı)", language: "Tercih edilen dil", turkish: "Türkçe", english: "İngilizce", both: "Her ikisi",
    jurisdictionIntro: "Yargı alanı, hangi ön inceleme yolunun gösterileceğini belirler.", ontario: "Ontario", ontarioSub: "Kanada uygunluk göstergeleri", cross: "Türkiye / sınır ötesi", crossSub: "Lisanslı ekip tarafından manuel inceleme", city: "Şehir", country: "Ülke",
    investmentIntro: "Birincil fonu şimdi seçin; profile daha sonra başka fon ilgileri eklenebilir.", fund: "Birincil fon", shareClass: "Pay sınıfı", amount: "Gösterge tutarı (CAD)", timeline: "Zamanlama", account: "Hesap tercihi",
    goalsIntro: "Yanıtlar yalnızca lisanslı incelemeye hazırlanmak için bir ön özet oluşturur.", objective: "Amaç", horizon: "Yatırım ufku", risk: "Risk toleransı", loss: "Zarar karşılama kapasitesi", liquidity: "Likidite ihtiyacı", experience: "Özel piyasa deneyimi",
    eligibilityIntro: "Eşik yanıtları kesin bir uygunluk belirlemez. Sonuç lisanslı incelemeye tabidir.", manualTitle: "Manuel sınır ötesi inceleme", manualText: "Kanada ve Türkiye gereklilikleri, vergi ikameti, AML ve transfer kuralları Hunter North’un lisanslı sürecinde incelenir.", prior: "Son 12 ayda benzer tekliflere yatırım", checks: ["Gelir eşiğini karşılıyor", "Finansal varlık eşiğini karşılıyor", "Net varlık eşiğini karşılıyor", "Uygun yatırımcı gelir eşiğini karşılıyor", "Uygun yatırımcı net varlık eşiğini karşılıyor"],
    documentsIntro: "İlk belge kontrol listesini hazırlayın. Gerekli öğeler lisanslı inceleme sırasında müşteri ve fon özelinde belirlenir.", chooseFile: "Dosya seç", replace: "Değiştir", optional: "İsteğe bağlı", reviewTitle: "Tanıştırma özeti", consentContact: "Müşteriyle bu tanıştırma hakkında iletişim kurulmasına izin verildiğini doğruluyorum.", consentAccuracy: "Bilgilerin ön inceleme için doğru olduğunu ve kesin bir uygunluk kararı olmadığını doğruluyorum.", selected: "seçildi",
    docLabels: { identity: "Resmî kimlik belgesi", address: "Adres kanıtı", eligibility: "Uygunluk desteği", funds: "Fon kaynağı desteği", subscription: "Fon abonelik paketi" },
  },
  en: {
    eyebrow: "New client", title: "Create a client introduction", desc: "Complete core details, investment interest, and preliminary readiness in one guided flow.", step: "Step", back: "Back", continue: "Continue", cancel: "Cancel", create: "Create client profile", required: "Complete the required fields in this step to continue.", fileError: "Choose a PDF, JPG, or PNG file no larger than 10 MB.", cancelConfirm: "Discard the entered information and return to the client list?",
    steps: ["Identity & contact", "Jurisdiction", "Investment interest", "Goals & experience", "Preliminary eligibility", "Documents & consent"],
    identityIntro: "These details represent the partner introduction and follow-up contact.", individual: "Individual", entity: "Company / entity", firstName: "First name", lastName: "Last name", organization: "Organization", organizationRequired: "Entity name", email: "Email", phone: "Phone (optional)", language: "Preferred language", turkish: "Turkish", english: "English", both: "Both",
    jurisdictionIntro: "Jurisdiction determines which preliminary review path is shown.", ontario: "Ontario", ontarioSub: "Canadian eligibility indicators", cross: "Türkiye / cross-border", crossSub: "Manual review by the licensed team", city: "City", country: "Country",
    investmentIntro: "Choose a primary fund now; more fund interests can be added from the profile later.", fund: "Primary fund", shareClass: "Share class", amount: "Illustrative amount (CAD)", timeline: "Timeline", account: "Account preference",
    goalsIntro: "Answers create a preliminary summary to prepare for licensed review only.", objective: "Objective", horizon: "Investment horizon", risk: "Risk tolerance", loss: "Loss capacity", liquidity: "Liquidity need", experience: "Private-market experience",
    eligibilityIntro: "Threshold answers do not determine eligibility. The result remains subject to licensed review.", manualTitle: "Manual cross-border review", manualText: "Canadian and Turkish requirements, tax residence, AML, and transfer rules are reviewed through Hunter North’s licensed process.", prior: "Similar offerings in the last 12 months", checks: ["Meets the income indicator", "Meets the financial-assets indicator", "Meets the net-assets indicator", "Meets the eligible-investor income indicator", "Meets the eligible-investor net-assets indicator"],
    documentsIntro: "Prepare the initial document checklist. Required items are determined for the client and fund during licensed review.", chooseFile: "Choose file", replace: "Replace", optional: "Optional", reviewTitle: "Introduction summary", consentContact: "I confirm permission to contact the client about this introduction.", consentAccuracy: "I confirm the information is accurate for preliminary review and is not a final eligibility determination.", selected: "selected",
    docLabels: { identity: "Government-issued identification", address: "Proof of address", eligibility: "Eligibility support", funds: "Source-of-funds support", subscription: "Fund subscription package" },
  },
} as const;

const options = {
  timeline: ["Now", "1-3 months", "3-6 months", "6+ months"],
  account: ["Non-registered", "Registered account", "Corporate/entity", "Unsure"],
  objective: ["Income", "Growth", "Balanced income and growth", "Capital preservation"],
  horizon: ["1-3 years", "3-5 years", "5+ years"],
  risk: ["Conservative", "Moderate", "Growth-oriented", "Unsure"],
  loss: ["Limited loss", "Some loss", "Significant loss", "Unsure"],
  liquidity: ["High", "Moderate", "Low"],
  experience: ["New to private markets", "Some private market experience", "Experienced private market investor"],
};

const docDefinitions: Array<{ id: string; category: ClientDocument["category"] }> = [
  { id: "identity", category: "identity-address" }, { id: "address", category: "identity-address" }, { id: "eligibility", category: "eligibility" }, { id: "funds", category: "source-of-funds" }, { id: "subscription", category: "fund-specific" },
];

const fieldClass = "h-10 w-full rounded-md border border-[#d5dce1] bg-white px-3 text-sm outline-none focus:border-[#0a4b72]";

export function ClientOnboarding({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang, t } = useLang();
  const c = COPY[lang];
  const optionLabels = t.capitalApp.profile.options as Record<string,string>;
  const opt = (value: string) => optionLabels[value] ?? value;
  const router = useRouter();
  const params = useSearchParams();
  const { createClient } = useClients();
  const requestedOffering = offerings.find((item) => item.id === params.get("offering") || item.slug === params.get("offering")) ?? offerings[0];
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<Record<string, File>>({});
  const [form, setForm] = useState<FormState>({
    accountType: "individual", firstName: "", lastName: "", organization: "", email: "", phone: "", preferredLanguage: lang,
    jurisdiction: "ontario", city: "", country: "Canada", offeringId: requestedOffering.id, shareClassId: requestedOffering.shareClasses[0]?.id ?? "", amount: "", timeline: options.timeline[1], accountPreference: options.account[3],
    objective: options.objective[2], horizon: options.horizon[2], riskTolerance: options.risk[1], lossCapacity: options.loss[1], liquidityNeed: options.liquidity[2], experience: options.experience[1],
    accreditedIncome: false, accreditedFinancialAssets: false, accreditedNetAssets: false, eligibleIncome: false, eligibleNetAssets: false, priorOmAmount: "$0", contactConsent: false, accuracyConsent: false,
  });
  const offering = offerings.find((item) => item.id === form.offeringId) ?? offerings[0];
  const progress = Math.round(((step + 1) / c.steps.length) * 100);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); setError(""); }
  function chooseOffering(id: string) { const next = offerings.find((item) => item.id === id)!; setForm((current) => ({ ...current, offeringId: id, shareClassId: next.shareClasses[0]?.id ?? "" })); }
  function validStep() {
    if (step === 0) return Boolean(form.firstName.trim() && form.lastName.trim() && /^\S+@\S+\.\S+$/.test(form.email) && (form.accountType !== "entity" || form.organization.trim()));
    if (step === 1) return Boolean(form.city.trim() && form.country.trim());
    if (step === 2) return Boolean(form.offeringId && form.shareClassId && Number(form.amount) > 0 && form.timeline && form.accountPreference);
    if (step === 5) return form.contactConsent && form.accuracyConsent;
    return true;
  }
  function next() { if (!validStep()) { setError(c.required); return; } setError(""); setStep((current) => Math.min(current + 1, c.steps.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function previous() { setError(""); setStep((current) => Math.max(current - 1, 0)); }
  function cancel() { if (window.confirm(c.cancelConfirm)) router.push(`${NORTH_BASE}/clients`); }
  function chooseFile(id: string, file?: File) {
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"].includes(file.type);
    if (!allowed || file.size > 10 * 1024 * 1024) { setError(c.fileError); return; }
    setFiles((current) => ({ ...current, [id]: file })); setError("");
  }

  function submit() {
    if (!validStep()) { setError(c.required); return; }
    const timestamp = new Date().toISOString();
    const documents: ClientDocument[] = docDefinitions.map((definition) => {
      const file = files[definition.id];
      return { id: definition.id, category: definition.category, label: { en: COPY.en.docLabels[definition.id as keyof typeof COPY.en.docLabels], tr: COPY.tr.docLabels[definition.id as keyof typeof COPY.tr.docLabels] }, status: file ? "received" : "missing", filename: file?.name, size: file?.size, mimeType: file?.type, uploadedAt: file ? timestamp : undefined, objectUrl: file ? URL.createObjectURL(file) : undefined };
    });
    const preliminaryCategory = form.jurisdiction === "turkey-cross-border" ? "Cross-border manual review required" : (form.accreditedIncome || form.accreditedFinancialAssets || form.accreditedNetAssets) ? "Accredited investor indicator — licensed review required" : (form.eligibleIncome || form.eligibleNetAssets) ? "Eligible investor indicator — licensed review required" : "No eligibility indicator — licensed review required";
    const id = createClient({
      accountType: form.accountType, firstName: form.firstName.trim(), lastName: form.lastName.trim(), organization: form.organization.trim() || undefined, email: form.email.trim(), phone: form.phone.trim() || undefined, preferredLanguage: form.preferredLanguage,
      city: form.city.trim(), country: form.country.trim(), jurisdiction: form.jurisdiction,
      fundInterests: [{ id: `new-interest-${Date.now()}`, offeringId: form.offeringId, shareClassId: form.shareClassId, amount: Number(form.amount), timeline: form.timeline, accountPreference: form.accountPreference, primary: true, createdAt: timestamp }],
      readiness: { objective: form.objective, horizon: form.horizon, riskTolerance: form.riskTolerance, lossCapacity: form.lossCapacity, liquidityNeed: form.liquidityNeed, experience: form.experience, preliminaryCategory, accreditedIncome: form.accreditedIncome, accreditedFinancialAssets: form.accreditedFinancialAssets, accreditedNetAssets: form.accreditedNetAssets, eligibleIncome: form.eligibleIncome, eligibleNetAssets: form.eligibleNetAssets, priorOmAmount: form.priorOmAmount },
      documents, contactConsentAt: timestamp, accuracyConsentAt: timestamp,
    });
    router.push(`${NORTH_BASE}/clients/${id}`);
  }

  const inputPairs = useMemo(() => [
    ["objective", c.objective, options.objective], ["horizon", c.horizon, options.horizon], ["riskTolerance", c.risk, options.risk], ["lossCapacity", c.loss, options.loss], ["liquidityNeed", c.liquidity, options.liquidity], ["experience", c.experience, options.experience],
  ] as const, [c]);

  return <div>
    <button type="button" onClick={cancel} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#60717e] hover:text-[#0a2d46]"><ArrowLeft className="size-3.5" />{c.cancel}</button>
    <div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#687682]">{c.eyebrow}</p><h1 className="mt-2 font-serif text-3xl font-semibold text-[#102638]">{c.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#65717e]">{c.desc}</p></div>
    <div className="grid items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
      <Panel className="p-4 lg:sticky lg:top-20"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-[#65727c]">{c.step} {step + 1} / {c.steps.length}</span><span className="text-xs font-bold text-[#0a4b72]">{progress}%</span></div><div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#e7ebef]"><div className="h-full rounded-full bg-[#0a2d46]" style={{ width: `${progress}%` }} /></div><ol className="space-y-1">{c.steps.map((name,index) => <li key={name} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm", index === step ? "bg-[#eaf0f5] font-semibold text-[#0a2d46]" : index < step ? "text-[#344955]" : "text-[#89939a]")}><span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold", index === step ? "border-[#0a2d46] bg-[#0a2d46] text-white" : index < step ? "border-[#4c725e] bg-[#4c725e] text-white" : "border-[#ccd4da]")}>{index < step ? <Check className="size-3" /> : index + 1}</span>{name}</li>)}</ol></Panel>
      <Panel className="overflow-hidden"><div className="border-b border-[#e4e8eb] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#77838c]">{c.step} {step + 1}</p><h2 className="mt-2 text-xl font-semibold text-[#172e40]">{c.steps[step]}</h2></div><div className="p-5 sm:p-6">
        {error && <p role="alert" className="mb-4 rounded-md border border-[#eccdc8] bg-[#fbefed] px-3 py-2 text-xs text-[#98463c]">{error}</p>}
        {step === 0 && <section className="space-y-5"><p className="text-sm leading-6 text-[#65727c]">{c.identityIntro}</p><div className="grid grid-cols-2 gap-3">{(["individual","entity"] as const).map((value) => <button key={value} type="button" onClick={() => update("accountType",value)} className={cn("flex items-center gap-3 rounded-md border p-4 text-left", form.accountType === value ? "border-[#0a4b72] bg-[#eef4f7]" : "border-[#d8dfe4]")}><UserRound className="size-5 text-[#0a4b72]" /><span className="text-sm font-semibold">{value === "individual" ? c.individual : c.entity}</span></button>)}</div><div className="grid gap-4 sm:grid-cols-2"><Field label={c.firstName}><input value={form.firstName} onChange={(event) => update("firstName",event.target.value)} className={fieldClass} /></Field><Field label={c.lastName}><input value={form.lastName} onChange={(event) => update("lastName",event.target.value)} className={fieldClass} /></Field><Field label={form.accountType === "entity" ? c.organizationRequired : c.organization}><input value={form.organization} onChange={(event) => update("organization",event.target.value)} className={fieldClass} /></Field><Field label={c.email}><input type="email" value={form.email} onChange={(event) => update("email",event.target.value)} className={fieldClass} /></Field><Field label={c.phone}><input value={form.phone} onChange={(event) => update("phone",event.target.value)} className={fieldClass} /></Field><Field label={c.language}><select value={form.preferredLanguage} onChange={(event) => update("preferredLanguage",event.target.value as Lang | "both")} className={fieldClass}><option value="tr">{c.turkish}</option><option value="en">{c.english}</option><option value="both">{c.both}</option></select></Field></div></section>}
        {step === 1 && <section className="space-y-5"><p className="text-sm leading-6 text-[#65727c]">{c.jurisdictionIntro}</p><div className="grid gap-3 sm:grid-cols-2">{(["ontario","turkey-cross-border"] as const).map((value) => <button key={value} type="button" onClick={() => { update("jurisdiction",value); update("country",value === "ontario" ? "Canada" : "Türkiye"); }} className={cn("rounded-md border p-4 text-left", form.jurisdiction === value ? "border-[#0a4b72] bg-[#eef4f7]" : "border-[#d8dfe4]")}><p className="font-semibold text-[#203744]">{value === "ontario" ? c.ontario : c.cross}</p><p className="mt-1 text-xs text-[#71808a]">{value === "ontario" ? c.ontarioSub : c.crossSub}</p></button>)}</div><div className="grid gap-4 sm:grid-cols-2"><Field label={c.city}><input value={form.city} onChange={(event) => update("city",event.target.value)} className={fieldClass} /></Field><Field label={c.country}><input value={form.country} onChange={(event) => update("country",event.target.value)} className={fieldClass} /></Field></div></section>}
        {step === 2 && <section className="space-y-5"><p className="text-sm leading-6 text-[#65727c]">{c.investmentIntro}</p><div className="grid gap-4 sm:grid-cols-2"><Field label={c.fund}><select value={form.offeringId} onChange={(event) => chooseOffering(event.target.value)} className={fieldClass}>{offerings.map((item) => <option key={item.id} value={item.id}>{item.shortName[lang]}</option>)}</select></Field><Field label={c.shareClass}><select value={form.shareClassId} onChange={(event) => update("shareClassId",event.target.value)} className={fieldClass}>{offering.shareClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label={c.amount}><input inputMode="numeric" value={form.amount} onChange={(event) => update("amount",event.target.value.replace(/[^0-9]/g,""))} className={fieldClass} /></Field><Field label={c.timeline}><select value={form.timeline} onChange={(event) => update("timeline",event.target.value)} className={fieldClass}>{options.timeline.map((item) => <option key={item}>{opt(item)}</option>)}</select></Field><Field label={c.account}><select value={form.accountPreference} onChange={(event) => update("accountPreference",event.target.value)} className={fieldClass}>{options.account.map((item) => <option key={item}>{opt(item)}</option>)}</select></Field></div></section>}
        {step === 3 && <section className="space-y-5"><p className="text-sm leading-6 text-[#65727c]">{c.goalsIntro}</p><div className="grid gap-4 sm:grid-cols-2">{inputPairs.map(([key,label,values]) => <Field key={key} label={label}><select value={form[key]} onChange={(event) => update(key,event.target.value)} className={fieldClass}>{values.map((item) => <option key={item}>{opt(item)}</option>)}</select></Field>)}</div></section>}
        {step === 4 && <section className="space-y-5"><p className="text-sm leading-6 text-[#65727c]">{c.eligibilityIntro}</p>{form.jurisdiction === "turkey-cross-border" ? <div className="rounded-md border border-[#d9e2e8] bg-[#eef4f7] p-5"><ShieldCheck className="size-6 text-[#0a4b72]" /><h3 className="mt-3 font-semibold text-[#203744]">{c.manualTitle}</h3><p className="mt-2 text-sm leading-6 text-[#65727c]">{c.manualText}</p></div> : <><div className="space-y-2">{(["accreditedIncome","accreditedFinancialAssets","accreditedNetAssets","eligibleIncome","eligibleNetAssets"] as const).map((key,index) => <label key={key} className="flex cursor-pointer items-start gap-3 rounded-md border border-[#dfe4e9] bg-[#fafbfc] p-3.5"><input type="checkbox" checked={form[key]} onChange={(event) => update(key,event.target.checked)} className="mt-0.5 size-4 accent-[#0a2d46]" /><span className="text-sm text-[#40515e]">{c.checks[index]}</span></label>)}</div><Field label={c.prior}><select value={form.priorOmAmount} onChange={(event) => update("priorOmAmount",event.target.value)} className={fieldClass}>{["$0","Under $10k","$10k-$30k","Over $30k"].map((item) => <option key={item}>{opt(item)}</option>)}</select></Field></>}</section>}
        {step === 5 && <section className="space-y-5"><p className="text-sm leading-6 text-[#65727c]">{c.documentsIntro}</p><div className="space-y-2">{docDefinitions.map((definition) => { const file = files[definition.id]; return <label key={definition.id} className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[#dfe4e9] p-3.5"><span className="min-w-0"><span className="block text-sm font-semibold text-[#334a58]">{c.docLabels[definition.id as keyof typeof c.docLabels]}</span><span className="mt-1 block truncate text-xs text-[#7a858e]">{file ? `${file.name} · ${c.selected}` : c.optional}</span></span><span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#ccd5db] px-3 text-xs font-semibold text-[#4b5f6d]"><FileUp className="size-3.5" />{file ? c.replace : c.chooseFile}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" onChange={(event) => chooseFile(definition.id,event.target.files?.[0])} /></label>; })}</div><div className="rounded-md border border-[#dfe4e9] bg-[#fafbfc] p-4"><h3 className="text-sm font-semibold text-[#203744]">{c.reviewTitle}</h3><dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3"><div><dt className="text-[#7a858e]">{c.firstName}</dt><dd className="mt-1 font-semibold text-[#40515e]">{form.firstName} {form.lastName}</dd></div><div><dt className="text-[#7a858e]">{c.fund}</dt><dd className="mt-1 font-semibold text-[#40515e]">{offering.shortName[lang]}</dd></div><div><dt className="text-[#7a858e]">{c.amount}</dt><dd className="mt-1 font-semibold text-[#40515e]">{form.amount ? money(Number(form.amount),lang) : "—"}</dd></div></dl></div><div className="space-y-2"><Consent checked={form.contactConsent} onChange={(value) => update("contactConsent",value)} label={c.consentContact} /><Consent checked={form.accuracyConsent} onChange={(value) => update("accuracyConsent",value)} label={c.consentAccuracy} /></div></section>}
      </div><footer className="flex items-center justify-between gap-3 border-t border-[#e4e8eb] px-5 py-4 sm:px-6"><button type="button" onClick={previous} disabled={step === 0} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d2d9de] px-4 text-sm font-semibold text-[#53636f] disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft className="size-4" />{c.back}</button>{step < c.steps.length - 1 ? <button type="button" onClick={next} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]">{c.continue}<ArrowRight className="size-4" /></button> : <button type="button" onClick={submit} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]"><Check className="size-4" />{c.create}</button>}</footer></Panel>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#42525e]">{label}</span>{children}</label>; }
function Consent({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) { return <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#dfe4e9] p-3.5"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-4 accent-[#0a2d46]" /><span className="text-sm leading-5 text-[#40515e]">{label}</span></label>; }
