"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ExternalLink, RotateCcw, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import type {
  ClientAccountType,
  ClientJurisdiction,
  InvestorReadinessAnswer,
  InvestorReadinessCriterion,
} from "@/lib/capital/types";
import {
  assessOntarioInvestor,
  ENTITY_ACCREDITED_CRITERIA,
  INDIVIDUAL_ACCREDITED_CRITERIA,
  INDIVIDUAL_ELIGIBLE_CRITERIA,
} from "@/lib/capital/ontario-investor-assessment";
import { getOfferings } from "@/lib/capital/repository";
import { READINESS_RULESET } from "@/lib/capital/readiness";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useClients } from "@/components/capital/north/ClientProvider";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { PageHeader, Panel } from "@/components/capital/north/PortalUI";
import { cn } from "@/lib/utils";

type ClientMode = "existing" | "new";
type RelationshipStatus = "none" | "claimed" | "verified";
type EntityMinimumCondition = "yes" | "no" | "unknown";

type ProspectDraft = {
  accountType: ClientAccountType;
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  country: string;
  region: string;
  city: string;
};

const CRITERIA_COPY = {
  en: {
    "individual-registration": { label: "The client is currently registered as a representative of a Canadian dealer or adviser, or has qualifying former registration.", help: "Former limited-market-dealer-only registration does not satisfy this statement. Select Unsure when registration history needs verification." },
    "individual-financial-assets": { label: "The client, alone or with a spouse, beneficially owns net financial assets exceeding CAD $1,000,000.", help: "Financial assets include cash, securities, insurance contracts and deposits, net of related liabilities. A home or other real estate is not a financial asset." },
    "individual-income": { label: "The client’s net income before tax exceeded CAD $200,000 in each of the two prior calendar years and is reasonably expected to exceed it this year.", help: "All parts of the statement must be true." },
    "individual-spousal-income": { label: "The client’s combined net income with a spouse exceeded CAD $300,000 in each of the two prior calendar years and is reasonably expected to exceed it this year.", help: "All parts of the statement must be true." },
    "individual-net-assets": { label: "The client, alone or with a spouse, has net assets of at least CAD $5,000,000.", help: "Net assets are total assets minus total liabilities and may include real estate, including the related mortgage or other liability." },
    "eligible-net-assets": { label: "The client, alone or with a spouse, has net assets exceeding CAD $400,000.", help: "This is an eligible-investor indicator under the Ontario offering-memorandum exemption." },
    "eligible-income": { label: "The client’s net income before tax exceeded CAD $75,000 in each of the two prior calendar years and is reasonably expected to exceed it this year.", help: "All parts of the statement must be true." },
    "eligible-spousal-income": { label: "The client’s combined net income with a spouse exceeded CAD $125,000 in each of the two prior calendar years and is reasonably expected to exceed it this year.", help: "All parts of the statement must be true." },
    "entity-net-assets": { label: "The entity has net assets of at least CAD $5,000,000 according to its most recent financial statements.", help: "The licensed review must verify the financial statements and ownership of the purchasing entity." },
    "entity-regulated-category": { label: "The entity is a recognized regulated or institutional accredited-investor category.", help: "Examples include certain financial institutions, governments, registered dealers or advisers, pension funds and investment funds. Select Unsure unless the exact statutory category is known." },
    "entity-not-created-solely-for-accredited-exemption": { label: "The entity was not created or used solely to purchase or hold securities under the accredited-investor exemption.", help: "This anti-syndication condition must be supported by the licensed review." },
  },
  tr: {
    "individual-registration": { label: "Müşteri, Kanada’da bir dealer veya adviser temsilcisi olarak halen kayıtlıdır ya da uygun bir eski kayıt statüsüne sahiptir.", help: "Yalnızca eski limited market dealer kaydı bu ifadeyi karşılamaz. Kayıt geçmişi doğrulanacaksa Emin değilim seçin." },
    "individual-financial-assets": { label: "Müşteri, tek başına veya eşiyle birlikte, 1.000.000 CAD üzerinde net finansal varlığa hak sahibidir.", help: "Finansal varlıklar; ilgili borçlar düşüldükten sonra nakit, menkul kıymet, sigorta sözleşmesi ve mevduatı içerir. Konut ve diğer gayrimenkuller finansal varlık değildir." },
    "individual-income": { label: "Müşterinin vergi öncesi net geliri önceki iki takvim yılının her birinde 200.000 CAD’ı aştı ve bu yıl da aşması makul olarak bekleniyor.", help: "İfadenin tüm bölümleri doğru olmalıdır." },
    "individual-spousal-income": { label: "Müşterinin eşiyle birleşik net geliri önceki iki takvim yılının her birinde 300.000 CAD’ı aştı ve bu yıl da aşması makul olarak bekleniyor.", help: "İfadenin tüm bölümleri doğru olmalıdır." },
    "individual-net-assets": { label: "Müşteri, tek başına veya eşiyle birlikte, en az 5.000.000 CAD net varlığa sahiptir.", help: "Net varlık, toplam varlıklardan toplam borçların çıkarılmasıdır; ilgili mortgage veya diğer borçlarla birlikte gayrimenkulü içerebilir." },
    "eligible-net-assets": { label: "Müşteri, tek başına veya eşiyle birlikte, 400.000 CAD üzerinde net varlığa sahiptir.", help: "Bu, Ontario offering memorandum muafiyeti kapsamındaki bir uygun yatırımcı göstergesidir." },
    "eligible-income": { label: "Müşterinin vergi öncesi net geliri önceki iki takvim yılının her birinde 75.000 CAD’ı aştı ve bu yıl da aşması makul olarak bekleniyor.", help: "İfadenin tüm bölümleri doğru olmalıdır." },
    "eligible-spousal-income": { label: "Müşterinin eşiyle birleşik net geliri önceki iki takvim yılının her birinde 125.000 CAD’ı aştı ve bu yıl da aşması makul olarak bekleniyor.", help: "İfadenin tüm bölümleri doğru olmalıdır." },
    "entity-net-assets": { label: "Kuruluş, en güncel finansal tablolarına göre en az 5.000.000 CAD net varlığa sahiptir.", help: "Lisanslı inceleme, finansal tabloları ve satın alan kuruluşun sahipliğini doğrulamalıdır." },
    "entity-regulated-category": { label: "Kuruluş, tanınan düzenlenmiş veya kurumsal bir akredite yatırımcı kategorisindedir.", help: "Örnekler arasında belirli finansal kurumlar, hükümetler, kayıtlı dealer veya adviser kuruluşları, emeklilik fonları ve yatırım fonları bulunur. Kesin yasal kategori bilinmiyorsa Emin değilim seçin." },
    "entity-not-created-solely-for-accredited-exemption": { label: "Kuruluş, yalnızca akredite yatırımcı muafiyetine dayanarak menkul kıymet almak veya tutmak için oluşturulmamış ya da kullanılmamıştır.", help: "Bu anti-syndication koşulu lisanslı inceleme tarafından kanıtlanmalıdır." },
  },
} as const;

const COPY = {
  en: {
    eyebrow: "Resources", title: "Investor readiness", desc: "Record a client’s statements and generate an Ontario-first preliminary classification, optionally with selected-offering facts. Saved records are session-only demo state, not auditable production storage.",
    steps: ["Choose client", "Confirm path", "Qualification statements", "Review & save"], step: "Step", back: "Back", continue: "Continue", save: "Save to client", required: "Complete all required information before continuing.",
    existing: "Existing client", quickAdd: "Quick-add client", existingIntro: "Choose a client already in the partner portal.", newIntro: "Create a prospective client without selecting a fund or investment.", chooseClient: "Select a client", choosePlaceholder: "Choose a client…", individual: "Individual", entity: "Company / entity", firstName: "First name", lastName: "Last name", organization: "Organization", email: "Email", country: "Country of residence", province: "Province / territory", city: "City (optional)",
    pathIntro: "Confirm the residence path and account structure used for this assessment.", ontario: "Ontario, Canada", outside: "Outside Ontario", ontarioHelp: "Ontario rules are classified automatically in version one.", outsideHelp: "Other Canadian provinces and foreign jurisdictions require manual review.", accountType: "Client structure", residenceOnFile: "Residence on file", changeWarning: "This assessment records the selected path; it does not replace formal residence verification.",
    statementsIntro: "Answer each applicable statement using the information the client provided. Select Unsure whenever evidence or a definition needs licensed verification.", accreditedGroup: "Accredited-investor indicators", eligibleGroup: "Eligible-investor indicators under the Offering Memorandum (OM) exemption", entityGroup: "Common entity indicators", entityNote: "Partnerships, trusts, estates, complex ownership and other entity categories are routed to manual review.", yes: "Yes", no: "No", unsure: "Unsure",
    offeringFacts: "Offering and purchase facts", offeringFactsHelp: "Offering Memorandum (OM) means the legal disclosure document used for certain exempt-market offerings. A personalized Ontario OM calculation is shown only after compliance has approved the selected offering for that exemption.", offering: "Selected offering", noOffering: "No offering selected", proposedAcquisition: "Proposed acquisition cost (CAD)", priorOmAcquisitions: "Prior Offering Memorandum purchases in the preceding 12 months (CAD)", futurePayments: "Required future payments under this purchase (CAD)", suitabilityAdvice: "Registered suitability assessment", adviceUnknown: "Not recorded / unknown", adviceRecorded: "Recorded", adviceNotRecorded: "Not recorded", adviceHelp: "The CAD $100,000 eligible-investor amount is not automatic. A portfolio manager, investment dealer, or Exempt Market Dealer (EMD) must record that this investment and exceeding CAD $30,000 are suitable.", relationship: "FFBA relationship status", relationshipNone: "No relationship route claimed", relationshipClaimed: "Claimed — verification pending", relationshipVerified: "Verified by compliance", relationshipHelp: "A claimed relationship never creates a route by itself.", entityMinimumTitle: "Entity minimum-amount conditions", entityMinimumHelp: "These are captured for licensed review only. The CAD $150,000 route also requires an eligible, non-investment-fund offering and an approved exemption.", buysAsPrincipal: "Entity is buying as principal", cashAtDistribution: "Cash will be paid at distribution", singleIssuer: "Purchase is for a single issuer", notCreatedForMinimum: "Entity was not created solely to use the minimum-amount exemption", capacity: "Preliminary Offering Memorandum capacity", limit: "12-month limit", prior: "Prior OM acquisitions", proposed: "Proposed acquisition", future: "Required future payments", postTrade: "Post-trade total", remaining: "Remaining capacity before proposed trade", withinLimit: "The proposed post-trade total is within this preliminary limit.", exceedsLimit: "The proposed post-trade total exceeds this preliminary limit and requires licensed review.",
    preliminary: "Preliminary classification", basis: "Recorded basis", noBasis: "No automatic qualifying basis recorded", omContext: "Ontario Offering Memorandum (OM) context", ruleset: "Ruleset", sources: "Official sources", sourceInstrument: "NI 45-106", sourcePolicy: "OSC Companion Policy", disclaimer: "This is not an eligibility approval, exemption determination, KYC/KYP or suitability review, legal or investment advice, or permission to invest. A licensed review must verify the category, evidence and applicable exemption.",
    results: { "potentially-accredited": "Potentially accredited investor", "potentially-eligible": "Potentially eligible investor under the OM exemption", "potentially-non-eligible": "Potentially non-eligible investor under the OM exemption", "manual-review": "Manual review required" },
    om: { accredited: "No individual OM investment limit is indicated by this preliminary accredited classification. The licensed process must still confirm the exemption used.", eligible: "An eligible individual is generally limited to CAD $30,000 across OM investments during the preceding 12 months, or up to CAD $100,000 with the specified registered suitability advice.", "non-eligible": "A non-eligible individual is generally limited to CAD $10,000 across OM investments during the preceding 12 months.", "manual-review": "No OM limit or investor category is determined until the licensed review is completed." }, omUnavailable: "No OM amount is calculated until licensed compliance confirms that the selected offering may use the Ontario OM exemption.",
    permission: "I confirm the partner has permission to record this client’s information for preliminary review.", accuracy: "I confirm these answers are accurate to the partner’s knowledge and are not a final eligibility determination.",
    savedEyebrow: "Assessment saved", savedTitle: "Investor readiness recorded", savedBody: "The dated preliminary assessment is attached to the session profile only; licensed review and auditable storage are still required.", viewClient: "View client", another: "Assess another client",
  },
  tr: {
    eyebrow: "Kaynaklar", title: "Yatırımcı hazırlığı", desc: "Müşterinin beyanlarını kaydedin ve isteğe bağlı teklif bilgileriyle Ontario odaklı bir ön sınıflandırma oluşturun. Kaydedilen bilgiler yalnızca oturumluk demo durumudur; denetlenebilir üretim kaydı değildir.",
    steps: ["Müşteri seçimi", "İnceleme yolu", "Yeterlilik ifadeleri", "İncele ve kaydet"], step: "Adım", back: "Geri", continue: "Devam", save: "Müşteriye kaydet", required: "Devam etmeden önce gerekli tüm bilgileri tamamlayın.",
    existing: "Mevcut müşteri", quickAdd: "Hızlı müşteri ekle", existingIntro: "Partner portalında bulunan bir müşteriyi seçin.", newIntro: "Fon veya yatırım seçmeden potansiyel müşteri oluşturun.", chooseClient: "Müşteri seçin", choosePlaceholder: "Bir müşteri seçin…", individual: "Bireysel", entity: "Şirket / kuruluş", firstName: "Ad", lastName: "Soyad", organization: "Kurum", email: "E-posta", country: "İkamet ülkesi", province: "İl / eyalet", city: "Şehir (isteğe bağlı)",
    pathIntro: "Bu değerlendirmede kullanılacak ikamet yolunu ve müşteri yapısını doğrulayın.", ontario: "Ontario, Kanada", outside: "Ontario dışında", ontarioHelp: "İlk sürümde Ontario kuralları otomatik sınıflandırılır.", outsideHelp: "Diğer Kanada eyaletleri ve yabancı yargı alanları manuel inceleme gerektirir.", accountType: "Müşteri yapısı", residenceOnFile: "Kayıtlı ikamet", changeWarning: "Bu değerlendirme seçilen yolu kaydeder; resmî ikamet doğrulamasının yerini almaz.",
    statementsIntro: "Her geçerli ifadeyi müşterinin verdiği bilgilere göre yanıtlayın. Kanıt veya tanım lisanslı doğrulama gerektiriyorsa Emin değilim seçin.", accreditedGroup: "Akredite yatırımcı göstergeleri", eligibleGroup: "Offering Memorandum (OM / Teklif Muhtırası) muafiyeti kapsamındaki uygun yatırımcı göstergeleri", entityGroup: "Yaygın kuruluş göstergeleri", entityNote: "Ortaklıklar, trust yapıları, tereke, karmaşık sahiplik ve diğer kuruluş kategorileri manuel incelemeye yönlendirilir.", yes: "Evet", no: "Hayır", unsure: "Emin değilim",
    offeringFacts: "Teklif ve satın alma bilgileri", offeringFactsHelp: "Offering Memorandum (OM), Türkçede Teklif Muhtırası, belirli muaf piyasa tekliflerinde kullanılan yasal açıklama belgesidir. Kişiselleştirilmiş Ontario OM hesaplaması yalnızca uyum ekibi seçilen teklifi bu muafiyet için onayladıktan sonra gösterilir.", offering: "Seçilen teklif", noOffering: "Teklif seçilmedi", proposedAcquisition: "Önerilen edinim maliyeti (CAD)", priorOmAcquisitions: "Önceki 12 aydaki Teklif Muhtırası alımları (CAD)", futurePayments: "Bu satın alma kapsamındaki zorunlu gelecek ödemeler (CAD)", suitabilityAdvice: "Kayıtlı suitability değerlendirmesi", adviceUnknown: "Kaydedilmedi / bilinmiyor", adviceRecorded: "Kaydedildi", adviceNotRecorded: "Kaydedilmedi", adviceHelp: "100.000 CAD uygun yatırımcı tutarı otomatik değildir. Bir portfolio manager, investment dealer veya Exempt Market Dealer (EMD / Muaf Piyasa Satıcısı), bu yatırımın ve 30.000 CAD sınırının aşılmasının uygun olduğunu kaydetmelidir.", relationship: "FFBA ilişki durumu", relationshipNone: "İlişki muafiyeti iddia edilmiyor", relationshipClaimed: "İddia edildi — doğrulama bekliyor", relationshipVerified: "Uyum ekibi tarafından doğrulandı", relationshipHelp: "İddia edilen ilişki tek başına muafiyet yolu oluşturmaz.", entityMinimumTitle: "Kuruluş minimum tutar koşulları", entityMinimumHelp: "Bu koşullar yalnızca lisanslı inceleme için kaydedilir. 150.000 CAD yolu ayrıca uygun, yatırım fonu olmayan bir teklif ve onaylanmış muafiyet gerektirir.", buysAsPrincipal: "Kuruluş kendi adına satın alıyor", cashAtDistribution: "Nakit dağıtım anında ödenecek", singleIssuer: "Satın alma tek bir ihraççı içindir", notCreatedForMinimum: "Kuruluş yalnızca minimum-tutar muafiyetini kullanmak için oluşturulmadı", capacity: "Ön Teklif Muhtırası kapasitesi", limit: "12 aylık limit", prior: "Önceki OM edinimleri", proposed: "Önerilen edinim", future: "Zorunlu gelecek ödemeler", postTrade: "İşlem sonrası toplam", remaining: "Önerilen işlem öncesi kalan kapasite", withinLimit: "Önerilen işlem sonrası toplam bu ön limit içindedir.", exceedsLimit: "Önerilen işlem sonrası toplam bu ön limiti aşıyor ve lisanslı inceleme gerektiriyor.",
    preliminary: "Ön sınıflandırma", basis: "Kaydedilen dayanak", noBasis: "Otomatik yeterlilik dayanağı kaydedilmedi", omContext: "Ontario Offering Memorandum (OM / Teklif Muhtırası) bağlamı", ruleset: "Kural seti", sources: "Resmî kaynaklar", sourceInstrument: "NI 45-106", sourcePolicy: "OSC Companion Policy", disclaimer: "Bu sonuç uygunluk onayı, muafiyet kararı, KYC/KYP veya suitability incelemesi, hukuk ya da yatırım tavsiyesi veya yatırım izni değildir. Lisanslı inceleme kategori, kanıt ve uygulanacak muafiyeti doğrulamalıdır.",
    results: { "potentially-accredited": "Potansiyel akredite yatırımcı", "potentially-eligible": "OM muafiyeti kapsamında potansiyel uygun yatırımcı", "potentially-non-eligible": "OM muafiyeti kapsamında potansiyel uygun olmayan yatırımcı", "manual-review": "Manuel inceleme gerekli" },
    om: { accredited: "Bu ön akredite sınıflandırmasına göre bireysel OM yatırım limiti gösterilmez. Kullanılan muafiyeti lisanslı süreç doğrulamalıdır.", eligible: "Uygun bir birey, önceki 12 ay boyunca OM yatırımlarında genellikle 30.000 CAD ile; belirtilen kayıtlı suitability tavsiyesiyle 100.000 CAD’a kadar sınırlandırılır.", "non-eligible": "Uygun olmayan bir birey, önceki 12 ay boyunca OM yatırımlarında genellikle 10.000 CAD ile sınırlandırılır.", "manual-review": "Lisanslı inceleme tamamlanana kadar OM limiti veya yatırımcı kategorisi belirlenmez." }, omUnavailable: "Lisanslı uyum ekibi, seçilen teklifin Ontario OM muafiyetini kullanabileceğini doğrulayana kadar OM tutarı hesaplanmaz.",
    permission: "Partnerin, bu müşterinin bilgilerini ön inceleme amacıyla kaydetme iznine sahip olduğunu doğruluyorum.", accuracy: "Bu yanıtların partnerin bilgisi dahilinde doğru olduğunu ve nihai uygunluk kararı olmadığını doğruluyorum.",
    savedEyebrow: "Değerlendirme kaydedildi", savedTitle: "Yatırımcı hazırlığı kaydedildi", savedBody: "Tarihli ön değerlendirme yalnızca oturum profiline eklendi; lisanslı inceleme ve denetlenebilir kayıt hâlâ gereklidir.", viewClient: "Müşteriyi görüntüle", another: "Başka müşteri değerlendir",
  },
} as const;

const fieldClass = "h-10 w-full rounded-md border border-[#d5dce1] bg-white px-3 text-sm outline-none focus:border-[#0a4b72]";

export function InvestorReadinessTool() {
  const { lang } = useLang();
  const c = COPY[lang];
  const { clients, createProspect, saveInvestorAssessment } = useClients();
  const offerings = useMemo(() => getOfferings(), []);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<ClientMode>("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [accountType, setAccountType] = useState<ClientAccountType>("individual");
  const [jurisdiction, setJurisdiction] = useState<ClientJurisdiction>("ontario");
  const [answers, setAnswers] = useState<Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>>({});
  const [offeringId, setOfferingId] = useState("");
  const [proposedAcquisitionCost, setProposedAcquisitionCost] = useState("");
  const [priorOmAcquisitionCost, setPriorOmAcquisitionCost] = useState("");
  const [requiredFuturePayments, setRequiredFuturePayments] = useState("");
  const [registeredSuitabilityAdvice, setRegisteredSuitabilityAdvice] = useState<"recorded" | "not-recorded" | "unknown">("unknown");
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>("none");
  const [entityMinimumConditions, setEntityMinimumConditions] = useState<Record<"buysAsPrincipal" | "paysCashAtDistribution" | "purchasesSingleIssuer" | "notCreatedSolelyForMinimumAmount", EntityMinimumCondition>>({
    buysAsPrincipal: "unknown", paysCashAtDistribution: "unknown", purchasesSingleIssuer: "unknown", notCreatedSolelyForMinimumAmount: "unknown",
  });
  const [permission, setPermission] = useState(false);
  const [accuracy, setAccuracy] = useState(false);
  const [error, setError] = useState("");
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProspectDraft>({ accountType: "individual", firstName: "", lastName: "", organization: "", email: "", country: "Canada", region: "Ontario", city: "" });

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedOffering = offerings.find((offering) => offering.id === offeringId);
  const applicableCriteria: InvestorReadinessCriterion[] = accountType === "individual"
    ? [...INDIVIDUAL_ACCREDITED_CRITERIA, ...INDIVIDUAL_ELIGIBLE_CRITERIA]
    : [...ENTITY_ACCREDITED_CRITERIA, "entity-not-created-solely-for-accredited-exemption"];
  const proposedAmount = moneyValue(proposedAcquisitionCost);
  const priorOmAmount = moneyValue(priorOmAcquisitionCost);
  const futurePaymentAmount = moneyValue(requiredFuturePayments);
  const decision = useMemo(() => assessOntarioInvestor({
    jurisdiction,
    accountType,
    answers,
    offeringCompliance: selectedOffering?.complianceProfile,
    proposedAcquisitionCostCad: proposedAmount,
    priorOmAcquisitionCostCad: priorOmAmount,
    requiredFuturePaymentsCad: futurePaymentAmount,
    registeredSuitabilityAdvice,
    relationshipClaimed: relationshipStatus !== "none",
    relationshipVerified: relationshipStatus === "verified",
    entityBuysAsPrincipal: entityMinimumConditions.buysAsPrincipal === "yes",
    entityPaysCashAtDistribution: entityMinimumConditions.paysCashAtDistribution === "yes",
    entityPurchasesSingleIssuer: entityMinimumConditions.purchasesSingleIssuer === "yes",
    entityNotCreatedSolelyForMinimumAmount: entityMinimumConditions.notCreatedSolelyForMinimumAmount === "yes",
  }), [accountType, answers, entityMinimumConditions, futurePaymentAmount, jurisdiction, priorOmAmount, proposedAmount, registeredSuitabilityAdvice, relationshipStatus, selectedOffering]);
  const progress = Math.round(((step + 1) / c.steps.length) * 100);

  function updateDraft<K extends keyof ProspectDraft>(key: K, value: ProspectDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function chooseExisting(id: string) {
    const client = clients.find((item) => item.id === id);
    setSelectedClientId(id);
    if (client) {
      setAccountType(client.accountType);
      setJurisdiction(client.jurisdiction);
    }
    setAnswers({});
    setError("");
  }

  function chooseAccountType(value: ClientAccountType) {
    setAccountType(value);
    setDraft((current) => ({ ...current, accountType: value }));
    setAnswers({});
  }

  function chooseJurisdiction(value: ClientJurisdiction) {
    setJurisdiction(value);
    setAnswers({});
  }

  function answer(criterion: InvestorReadinessCriterion, value: InvestorReadinessAnswer) {
    setAnswers((current) => ({ ...current, [criterion]: value }));
    setError("");
  }

  function updateEntityMinimumCondition(
    condition: keyof typeof entityMinimumConditions,
    value: EntityMinimumCondition,
  ) {
    setEntityMinimumConditions((current) => ({ ...current, [condition]: value }));
  }

  function validCurrentStep() {
    if (step === 0 && mode === "existing") return Boolean(selectedClientId);
    if (step === 0) return Boolean(
      draft.firstName.trim() && draft.lastName.trim() && /^\S+@\S+\.\S+$/.test(draft.email) &&
      draft.country.trim() && draft.region.trim() && (draft.accountType !== "entity" || draft.organization.trim()),
    );
    if (step === 2 && jurisdiction === "ontario") {
      return applicableCriteria.every((criterion) => Boolean(answers[criterion]))
        && (!offeringId || (proposedAmount !== undefined && proposedAmount > 0));
    }
    if (step === 3) return permission && accuracy;
    return true;
  }

  function next() {
    if (!validCurrentStep()) { setError(c.required); return; }
    if (step === 0 && mode === "new") {
      setAccountType(draft.accountType);
      const country = draft.country.trim().toLocaleLowerCase("en-CA");
      const region = draft.region.trim().toLocaleLowerCase("en-CA");
      setJurisdiction(["canada", "kanada"].includes(country) && ["ontario", "on"].includes(region) ? "ontario" : "manual-review");
    }
    setError("");
    setStep((current) => Math.min(current + 1, c.steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  async function save() {
    if (!validCurrentStep()) { setError(c.required); return; }
    const timestamp = new Date().toISOString();
    const clientId = mode === "existing" ? selectedClientId : await createProspect({
      accountType,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      organization: draft.organization.trim() || undefined,
      email: draft.email.trim(),
      country: draft.country.trim(),
      region: draft.region.trim() || undefined,
      city: draft.city.trim() || undefined,
      jurisdiction,
    });
    saveInvestorAssessment(clientId, {
      jurisdiction,
      accountType,
      answers,
      result: decision.result,
      qualifyingCriteria: decision.qualifyingCriteria,
      omContext: decision.omContext,
      candidateRoutes: decision.candidateRoutes,
      reviewReasons: decision.reviewReasons,
      omCalculation: decision.omCalculation,
      assessmentInput: {
        jurisdiction,
        accountType,
        answers,
        offeringId: selectedOffering?.id,
        offeringCompliance: selectedOffering?.complianceProfile,
        proposedAcquisitionCostCad: proposedAmount,
        priorOmAcquisitionCostCad: priorOmAmount,
        requiredFuturePaymentsCad: futurePaymentAmount,
        registeredSuitabilityAdvice,
        relationshipStatus,
        entityMinimumConditions,
      },
      rulesetId: decision.rulesetId,
      sourceUrls: decision.sourceUrls,
      reassessmentTriggers: decision.reassessmentTriggers,
      assessor: "Marmara Wealth Partners",
      acknowledgementAt: timestamp,
      assessedAt: timestamp,
    });
    setSavedClientId(clientId);
  }

  function startAnother() {
    setStep(0); setMode("existing"); setSelectedClientId(""); setAccountType("individual"); setJurisdiction("ontario"); setAnswers({}); setOfferingId(""); setProposedAcquisitionCost(""); setPriorOmAcquisitionCost(""); setRequiredFuturePayments(""); setRegisteredSuitabilityAdvice("unknown"); setRelationshipStatus("none"); setEntityMinimumConditions({ buysAsPrincipal: "unknown", paysCashAtDistribution: "unknown", purchasesSingleIssuer: "unknown", notCreatedSolelyForMinimumAmount: "unknown" }); setPermission(false); setAccuracy(false); setError(""); setSavedClientId(null);
    setDraft({ accountType: "individual", firstName: "", lastName: "", organization: "", email: "", country: "Canada", region: "Ontario", city: "" });
  }

  if (savedClientId) return <div><PageHeader eyebrow={c.savedEyebrow} title={c.savedTitle} description={c.savedBody} /><Panel className="p-6 sm:p-8"><CheckCircle2 className="size-10 text-[#3d7257]" /><div role="status" aria-live="polite"><h2 className="mt-4 text-xl font-semibold text-[#173044]">{c.results[decision.result]}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66747e]">{c.disclaimer}</p></div><div className="mt-6 flex flex-wrap gap-3"><Link href={`${NORTH_BASE}/clients/${savedClientId}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.viewClient}<ArrowRight className="size-4" /></Link><button type="button" onClick={startAnother} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cfd7dc] px-4 text-sm font-semibold text-[#435561]"><RotateCcw className="size-4" />{c.another}</button></div></Panel></div>;

  return <div>
    <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.desc} />
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Panel className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-[#65727c]">{c.step} {step + 1} / {c.steps.length}</span><span className="text-xs font-bold text-[#0a4b72]">{progress}%</span></div><div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#e7ebef]"><div className="h-full rounded-full bg-[#0a2d46] transition-[width]" style={{ width: `${progress}%` }} /></div><ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{c.steps.map((name,index) => <li key={name} className={cn("flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm", index === step ? "border-[#b8ccd9] bg-[#eaf0f5] font-semibold text-[#0a2d46]" : index < step ? "border-[#d5e1da] bg-[#f4f8f5] text-[#344955]" : "border-[#e1e6e9] text-[#89939a]")}><span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold", index === step ? "border-[#0a2d46] bg-[#0a2d46] text-white" : index < step ? "border-[#4c725e] bg-[#4c725e] text-white" : "border-[#ccd4da]")}>{index < step ? <Check className="size-3" /> : index + 1}</span><span className="leading-5">{name}</span></li>)}</ol></Panel>
      <Panel className="overflow-hidden"><div className="border-b border-[#e4e8eb] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#77838c]">{c.step} {step + 1}</p><h2 className="mt-2 text-xl font-semibold text-[#172e40]">{c.steps[step]}</h2></div><div className="p-5 sm:p-6">
        {error && <p role="alert" className="mb-5 rounded-md border border-[#eccdc8] bg-[#fbefed] px-3 py-2 text-xs text-[#98463c]">{error}</p>}
        {step === 0 && <section className="space-y-5"><div className="grid gap-2"><ModeButton active={mode === "existing"} onClick={() => { setMode("existing"); setError(""); }} icon={<UsersRound className="size-5" />} label={c.existing} description={c.existingIntro} /><ModeButton active={mode === "new"} onClick={() => { setMode("new"); setError(""); }} icon={<UserPlus className="size-5" />} label={c.quickAdd} description={c.newIntro} /></div>{mode === "existing" ? <div><Field label={c.chooseClient}><select value={selectedClientId} onChange={(event) => chooseExisting(event.target.value)} className={fieldClass}><option value="">{c.choosePlaceholder}</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName} · {client.email}</option>)}</select></Field></div> : <div><div className="mb-4 grid gap-2"><ChoiceButton active={draft.accountType === "individual"} onClick={() => { updateDraft("accountType","individual"); chooseAccountType("individual"); }} label={c.individual} /><ChoiceButton active={draft.accountType === "entity"} onClick={() => { updateDraft("accountType","entity"); chooseAccountType("entity"); }} label={c.entity} /></div><div className="grid gap-4 sm:grid-cols-2"><Field label={c.firstName}><input value={draft.firstName} onChange={(event) => updateDraft("firstName",event.target.value)} autoComplete="given-name" className={fieldClass} /></Field><Field label={c.lastName}><input value={draft.lastName} onChange={(event) => updateDraft("lastName",event.target.value)} autoComplete="family-name" className={fieldClass} /></Field>{draft.accountType === "entity" && <Field label={c.organization} className="sm:col-span-2"><input value={draft.organization} onChange={(event) => updateDraft("organization",event.target.value)} autoComplete="organization" className={fieldClass} /></Field>}<Field label={c.email} className="sm:col-span-2"><input type="email" value={draft.email} onChange={(event) => updateDraft("email",event.target.value)} autoComplete="email" className={fieldClass} /></Field><Field label={c.country}><input value={draft.country} onChange={(event) => updateDraft("country",event.target.value)} autoComplete="country-name" className={fieldClass} /></Field><Field label={c.province}><input value={draft.region} onChange={(event) => updateDraft("region",event.target.value)} autoComplete="address-level1" className={fieldClass} /></Field><Field label={c.city} className="sm:col-span-2"><input value={draft.city} onChange={(event) => updateDraft("city",event.target.value)} autoComplete="address-level2" className={fieldClass} /></Field></div></div>}</section>}
        {step === 1 && <section className="space-y-6"><p className="text-sm leading-6 text-[#65727c]">{c.pathIntro}</p><div><p className="mb-2 text-xs font-semibold text-[#42525e]">{c.accountType}</p><div className="grid gap-2"><ChoiceButton active={accountType === "individual"} onClick={() => chooseAccountType("individual")} label={c.individual} /><ChoiceButton active={accountType === "entity"} onClick={() => chooseAccountType("entity")} label={c.entity} /></div></div><div><p className="mb-2 text-xs font-semibold text-[#42525e]">{c.residenceOnFile}</p>{selectedClient && <p className="mb-3 text-sm text-[#61717d]">{[selectedClient.city,selectedClient.region,selectedClient.country].filter(Boolean).join(", ") || "—"}</p>}<div className="grid gap-3"><PathButton active={jurisdiction === "ontario"} onClick={() => chooseJurisdiction("ontario")} title={c.ontario} text={c.ontarioHelp} /><PathButton active={jurisdiction === "manual-review"} onClick={() => chooseJurisdiction("manual-review")} title={c.outside} text={c.outsideHelp} /></div></div><p className="rounded-md bg-[#f4f7f9] p-3 text-xs leading-5 text-[#647681]">{c.changeWarning}</p></section>}
        {step === 2 && <section className="space-y-5">
          <p className="text-sm leading-6 text-[#65727c]">{c.statementsIntro}</p>
          {jurisdiction === "manual-review" ? <div className="rounded-md border border-[#d9e2e8] bg-[#eef4f7] p-5"><ShieldCheck className="size-6 text-[#0a4b72]" /><h3 className="mt-3 font-semibold text-[#203744]">{c.results["manual-review"]}</h3><p className="mt-2 text-sm leading-6 text-[#65727c]">{c.outsideHelp}</p></div> : <>
            {accountType === "individual" ? <><QuestionGroup title={c.accreditedGroup} criteria={[...INDIVIDUAL_ACCREDITED_CRITERIA]} answers={answers} onAnswer={answer} lang={lang} copy={c} /><QuestionGroup title={c.eligibleGroup} criteria={[...INDIVIDUAL_ELIGIBLE_CRITERIA]} answers={answers} onAnswer={answer} lang={lang} copy={c} /></> : <><QuestionGroup title={c.entityGroup} criteria={[...ENTITY_ACCREDITED_CRITERIA, "entity-not-created-solely-for-accredited-exemption"]} answers={answers} onAnswer={answer} lang={lang} copy={c} /><p className="rounded-md border border-[#eadcb8] bg-[#fbf7eb] p-3 text-xs leading-5 text-[#6f5a28]">{c.entityNote}</p></>}
            <OfferingPurchaseFacts
              accountType={accountType}
              copy={c}
              lang={lang}
              offerings={offerings}
              offeringId={offeringId}
              onOfferingChange={setOfferingId}
              proposedAcquisitionCost={proposedAcquisitionCost}
              onProposedAcquisitionCostChange={setProposedAcquisitionCost}
              priorOmAcquisitionCost={priorOmAcquisitionCost}
              onPriorOmAcquisitionCostChange={setPriorOmAcquisitionCost}
              requiredFuturePayments={requiredFuturePayments}
              onRequiredFuturePaymentsChange={setRequiredFuturePayments}
              registeredSuitabilityAdvice={registeredSuitabilityAdvice}
              onRegisteredSuitabilityAdviceChange={setRegisteredSuitabilityAdvice}
              relationshipStatus={relationshipStatus}
              onRelationshipStatusChange={setRelationshipStatus}
              entityMinimumConditions={entityMinimumConditions}
              onEntityMinimumConditionChange={updateEntityMinimumCondition}
            />
          </>}
        </section>}
        {step === 3 && <section className="space-y-5"><ResultPanel decision={decision} lang={lang} copy={c} /><div className="space-y-2"><Consent checked={permission} onChange={setPermission} label={c.permission} /><Consent checked={accuracy} onChange={setAccuracy} label={c.accuracy} /></div></section>}
      </div><footer className="flex items-center justify-end gap-3 border-t border-[#e4e8eb] px-5 py-4 sm:px-6"><button type="button" onClick={previous} disabled={step === 0} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d2d9de] px-4 text-sm font-semibold text-[#53636f] disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft className="size-4" />{c.back}</button>{step < c.steps.length - 1 ? <button type="button" onClick={next} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]">{c.continue}<ArrowRight className="size-4" /></button> : <button type="button" onClick={save} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white hover:bg-[#123f5e]"><Check className="size-4" />{c.save}</button>}</footer></Panel>
    </div>
  </div>;
}

type Copy = (typeof COPY)["en"] | (typeof COPY)["tr"];

function moneyValue(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function formatCad(value: number, lang: "en" | "tr") {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
}

function OfferingPurchaseFacts({
  accountType, copy, lang, offerings, offeringId, onOfferingChange,
  proposedAcquisitionCost, onProposedAcquisitionCostChange,
  priorOmAcquisitionCost, onPriorOmAcquisitionCostChange,
  requiredFuturePayments, onRequiredFuturePaymentsChange,
  registeredSuitabilityAdvice, onRegisteredSuitabilityAdviceChange,
  relationshipStatus, onRelationshipStatusChange,
  entityMinimumConditions, onEntityMinimumConditionChange,
}: {
  accountType: ClientAccountType;
  copy: Copy;
  lang: "en" | "tr";
  offerings: ReturnType<typeof getOfferings>;
  offeringId: string;
  onOfferingChange: (value: string) => void;
  proposedAcquisitionCost: string;
  onProposedAcquisitionCostChange: (value: string) => void;
  priorOmAcquisitionCost: string;
  onPriorOmAcquisitionCostChange: (value: string) => void;
  requiredFuturePayments: string;
  onRequiredFuturePaymentsChange: (value: string) => void;
  registeredSuitabilityAdvice: "recorded" | "not-recorded" | "unknown";
  onRegisteredSuitabilityAdviceChange: (value: "recorded" | "not-recorded" | "unknown") => void;
  relationshipStatus: RelationshipStatus;
  onRelationshipStatusChange: (value: RelationshipStatus) => void;
  entityMinimumConditions: Record<"buysAsPrincipal" | "paysCashAtDistribution" | "purchasesSingleIssuer" | "notCreatedSolelyForMinimumAmount", EntityMinimumCondition>;
  onEntityMinimumConditionChange: (condition: "buysAsPrincipal" | "paysCashAtDistribution" | "purchasesSingleIssuer" | "notCreatedSolelyForMinimumAmount", value: EntityMinimumCondition) => void;
}) {
  return <section className="rounded-md border border-[#d8e0e5] bg-[#f8fafb] p-4 sm:p-5">
    <h3 className="text-sm font-semibold text-[#203744]">{copy.offeringFacts}</h3>
    <p className="mt-1 text-xs leading-5 text-[#657580]">{copy.offeringFactsHelp}</p>
    <div className="mt-4"><Field label={copy.offering}><select value={offeringId} onChange={(event) => onOfferingChange(event.target.value)} className={fieldClass}><option value="">{copy.noOffering}</option>{offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.shortName[lang]}</option>)}</select></Field></div>
    {offeringId && <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={copy.proposedAcquisition}><input required type="number" min="0" step="0.01" inputMode="decimal" value={proposedAcquisitionCost} onChange={(event) => onProposedAcquisitionCostChange(event.target.value)} className={fieldClass} /></Field>
        <Field label={copy.priorOmAcquisitions}><input type="number" min="0" step="0.01" inputMode="decimal" value={priorOmAcquisitionCost} onChange={(event) => onPriorOmAcquisitionCostChange(event.target.value)} className={fieldClass} /></Field>
        <Field label={copy.futurePayments}><input type="number" min="0" step="0.01" inputMode="decimal" value={requiredFuturePayments} onChange={(event) => onRequiredFuturePaymentsChange(event.target.value)} className={fieldClass} /></Field>
      </div>
      <p className="text-xs leading-5 text-[#687984]">{copy.offeringFactsHelp}</p>
      {accountType === "individual" && <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.suitabilityAdvice}><select value={registeredSuitabilityAdvice} onChange={(event) => onRegisteredSuitabilityAdviceChange(event.target.value as "recorded" | "not-recorded" | "unknown")} className={fieldClass}><option value="unknown">{copy.adviceUnknown}</option><option value="recorded">{copy.adviceRecorded}</option><option value="not-recorded">{copy.adviceNotRecorded}</option></select><span className="mt-1.5 block text-xs leading-5 text-[#687984]">{copy.adviceHelp}</span></Field>
        <Field label={copy.relationship}><select value={relationshipStatus} onChange={(event) => onRelationshipStatusChange(event.target.value as RelationshipStatus)} className={fieldClass}><option value="none">{copy.relationshipNone}</option><option value="claimed">{copy.relationshipClaimed}</option><option value="verified">{copy.relationshipVerified}</option></select><span className="mt-1.5 block text-xs leading-5 text-[#687984]">{copy.relationshipHelp}</span></Field>
      </div>}
      {accountType === "entity" && <div className="rounded border border-[#dfe5e9] bg-white p-4"><p className="text-sm font-semibold text-[#203744]">{copy.entityMinimumTitle}</p><p className="mt-1 text-xs leading-5 text-[#687984]">{copy.entityMinimumHelp}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><EntityConditionField label={copy.buysAsPrincipal} value={entityMinimumConditions.buysAsPrincipal} onChange={(value) => onEntityMinimumConditionChange("buysAsPrincipal", value)} copy={copy} /><EntityConditionField label={copy.cashAtDistribution} value={entityMinimumConditions.paysCashAtDistribution} onChange={(value) => onEntityMinimumConditionChange("paysCashAtDistribution", value)} copy={copy} /><EntityConditionField label={copy.singleIssuer} value={entityMinimumConditions.purchasesSingleIssuer} onChange={(value) => onEntityMinimumConditionChange("purchasesSingleIssuer", value)} copy={copy} /><EntityConditionField label={copy.notCreatedForMinimum} value={entityMinimumConditions.notCreatedSolelyForMinimumAmount} onChange={(value) => onEntityMinimumConditionChange("notCreatedSolelyForMinimumAmount", value)} copy={copy} /></div></div>}
    </div>}
  </section>;
}

function EntityConditionField({ label, value, onChange, copy }: { label: string; value: EntityMinimumCondition; onChange: (value: EntityMinimumCondition) => void; copy: Copy }) {
  return <Field label={label}><select value={value} onChange={(event) => onChange(event.target.value as EntityMinimumCondition)} className={fieldClass}><option value="unknown">{copy.unsure}</option><option value="yes">{copy.yes}</option><option value="no">{copy.no}</option></select></Field>;
}

function ResultPanel({ decision, lang, copy }: { decision: ReturnType<typeof assessOntarioInvestor>; lang: "en" | "tr"; copy: Copy }) {
  const criteriaCopy = CRITERIA_COPY[lang];
  const omCopy = decision.omCalculation.status === "not-available" ? copy.omUnavailable : copy.om[decision.omContext.kind];
  const calculation = decision.omCalculation;
  return <div role="status" aria-live="polite" className="rounded-md border border-[#b9ccd8] bg-[#edf4f7] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-6 shrink-0 text-[#0a4b72]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#5d7685]">{copy.preliminary}</p><h3 className="mt-1 text-lg font-semibold text-[#17384d]">{copy.results[decision.result]}</h3></div></div><div className="mt-5 border-t border-[#d2dfe6] pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6d7f8a]">{copy.basis}</p>{decision.qualifyingCriteria.length ? <ul className="mt-2 space-y-1.5">{decision.qualifyingCriteria.map((criterion) => <li key={criterion} className="text-sm leading-5 text-[#405765]">• {criteriaCopy[criterion].label}</li>)}</ul> : <p className="mt-2 text-sm text-[#617682]">{copy.noBasis}</p>}</div><div className="mt-4 rounded bg-white/75 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6d7f8a]">{copy.omContext}</p><p className="mt-1 text-sm leading-6 text-[#526b7a]">{omCopy}</p></div>{calculation.status === "calculated" && <div className="mt-4 rounded border border-[#d4e0e5] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6d7f8a]">{copy.capacity}</p><dl className="mt-2 grid gap-x-5 gap-y-1 text-sm text-[#405765] sm:grid-cols-2"><CapacityRow label={copy.limit} value={formatCad(calculation.limitCad ?? 0, lang)} /><CapacityRow label={copy.prior} value={formatCad(calculation.priorAcquisitionCostCad ?? 0, lang)} /><CapacityRow label={copy.proposed} value={formatCad(calculation.proposedAcquisitionCostCad ?? 0, lang)} /><CapacityRow label={copy.future} value={formatCad(calculation.requiredFuturePaymentsCad ?? 0, lang)} /><CapacityRow label={copy.postTrade} value={formatCad(calculation.totalAfterProposedCad ?? 0, lang)} /><CapacityRow label={copy.remaining} value={formatCad(calculation.remainingCapacityCad ?? 0, lang)} /></dl><p className={cn("mt-3 text-xs font-semibold", calculation.withinPreliminaryLimit ? "text-[#356b4a]" : "text-[#994f43]")}>{calculation.withinPreliminaryLimit ? copy.withinLimit : copy.exceedsLimit}</p></div>}<p className="mt-4 text-xs leading-5 text-[#596f7c]">{copy.disclaimer}</p><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#d2dfe6] pt-3 text-[10px] text-[#6c7e88]"><span>{copy.ruleset}: {READINESS_RULESET.id}</span><span>{copy.sources}:</span><a href={READINESS_RULESET.sources[0]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0a4b72]">{copy.sourceInstrument}<ExternalLink className="size-3" /></a><a href={READINESS_RULESET.sources[1]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0a4b72]">{copy.sourcePolicy}<ExternalLink className="size-3" /></a></div></div>;
}

function CapacityRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-2"><dt>{label}</dt><dd className="font-semibold text-[#203744]">{value}</dd></div>; }

function QuestionGroup({ title, criteria, answers, onAnswer, lang, copy }: { title: string; criteria: InvestorReadinessCriterion[]; answers: Partial<Record<InvestorReadinessCriterion, InvestorReadinessAnswer>>; onAnswer: (criterion: InvestorReadinessCriterion, answer: InvestorReadinessAnswer) => void; lang: "en" | "tr"; copy: Copy }) {
  return <div><h3 className="text-sm font-semibold text-[#203744]">{title}</h3><div className="mt-3 space-y-3">{criteria.map((criterion) => { const item = CRITERIA_COPY[lang][criterion]; return <fieldset key={criterion} className="rounded-md border border-[#dfe4e9] bg-[#fafbfc] p-4"><legend className="sr-only">{item.label}</legend><p className="text-sm font-medium leading-6 text-[#40515e]">{item.label}</p><p className="mt-1 text-xs leading-5 text-[#71808a]">{item.help}</p><div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label={item.label}>{(["yes","no","unsure"] as const).map((value) => <button key={value} type="button" role="radio" aria-checked={answers[criterion] === value} onClick={() => onAnswer(criterion,value)} className={cn("min-h-9 rounded-md border px-2 text-xs font-semibold", answers[criterion] === value ? "border-[#0a2d46] bg-[#0a2d46] text-white" : "border-[#ced7dd] bg-white text-[#536671] hover:border-[#8fa6b4]")}>{copy[value]}</button>)}</div></fieldset>; })}</div></div>;
}

function ModeButton({ active, onClick, icon, label, description }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; description: string }) { return <button type="button" onClick={onClick} aria-pressed={active} className={cn("flex min-h-20 items-center gap-3 rounded-md border p-4 text-left", active ? "border-[#0a4b72] bg-[#eef4f7] text-[#17384d]" : "border-[#d8dfe4] text-[#53636f]")}><span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-[#0a4b72] shadow-sm">{icon}</span><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs font-normal leading-5 text-[#71808a]">{description}</span></span></button>; }
function ChoiceButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) { return <button type="button" onClick={onClick} aria-pressed={active} className={cn("min-h-11 rounded-md border px-4 text-left text-sm font-semibold", active ? "border-[#0a2d46] bg-[#0a2d46] text-white" : "border-[#d2dae0] bg-white text-[#53636f]")}>{label}</button>; }
function PathButton({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text: string }) { return <button type="button" onClick={onClick} aria-pressed={active} className={cn("rounded-md border p-4 text-left", active ? "border-[#0a4b72] bg-[#eef4f7]" : "border-[#d8dfe4] bg-white")}><span className="block text-sm font-semibold text-[#203744]">{title}</span><span className="mt-1 block text-xs leading-5 text-[#71808a]">{text}</span></button>; }
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <label className={cn("block",className)}><span className="mb-1.5 block text-xs font-semibold text-[#42525e]">{label}</span>{children}</label>; }
function Consent({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) { return <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#dfe4e9] p-3.5"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-4 accent-[#0a2d46]" /><span className="text-sm leading-5 text-[#40515e]">{label}</span></label>; }
