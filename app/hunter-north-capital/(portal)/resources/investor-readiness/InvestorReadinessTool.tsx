"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Globe2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import type {
  ClientAccountType,
  ClientJurisdiction,
  InvestorFinancialResult,
  InvestorJurisdictionReview,
  InvestorReadinessAnswer,
  InvestorReadinessCriterion,
  InvestorReadinessReviewReason,
} from "@/lib/capital/types";
import {
  assessCanadianFinancialProfile,
  preliminaryMaximumInvestment,
  qualificationBandsToReadinessAnswers,
  resolveInvestorJurisdiction,
  type InvestorQualificationBands,
  type RegisteredSuitabilityAdvice,
} from "@/lib/capital/investor-readiness";
import { canUseWorkspace } from "@/lib/capital/portal-access";
import { omContextForResult } from "@/lib/capital/ontario-investor-assessment";
import { READINESS_RULESET } from "@/lib/capital/readiness";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { useClients } from "@/components/capital/north/ClientProvider";
import { NORTH_BASE } from "@/components/capital/north/NorthBrand";
import { usePortalAccess } from "@/components/capital/north/PortalAccessProvider";
import { PageHeader, Panel } from "@/components/capital/north/PortalUI";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Stage = "intro" | "questions" | "result";
type ProfileAnswers = InvestorQualificationBands;

type ProspectDraft = {
  firstName: string;
  lastName: string;
  email: string;
};

const COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ " +
  "NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ " +
  "TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

const CANADIAN_REGIONS = [
  { code: "AB", en: "Alberta", tr: "Alberta" },
  { code: "BC", en: "British Columbia", tr: "Britanya Kolumbiyası" },
  { code: "MB", en: "Manitoba", tr: "Manitoba" },
  { code: "NB", en: "New Brunswick", tr: "New Brunswick" },
  { code: "NL", en: "Newfoundland and Labrador", tr: "Newfoundland ve Labrador" },
  { code: "NS", en: "Nova Scotia", tr: "Nova Scotia" },
  { code: "NT", en: "Northwest Territories", tr: "Kuzeybatı Toprakları" },
  { code: "NU", en: "Nunavut", tr: "Nunavut" },
  { code: "ON", en: "Ontario", tr: "Ontario" },
  { code: "PE", en: "Prince Edward Island", tr: "Prens Edward Adası" },
  { code: "QC", en: "Quebec", tr: "Quebec" },
  { code: "SK", en: "Saskatchewan", tr: "Saskatchewan" },
  { code: "YT", en: "Yukon", tr: "Yukon" },
] as const;

const PARVIS_GUIDE_URL = "https://www.parvisinvest.com/insights/what-is-a-non-accredited-investor";

const COPY = {
  en: {
    eyebrow: "Professional resource",
    title: "Investor qualification",
    description: "Identify the Canadian financial category indicated by a client’s answers, regardless of where they live.",
    selfEyebrow: "Investor self-check",
    selfTitle: "Check your investor category",
    selfDescription: "Answer the questions yourself to see your preliminary Canadian financial category and Canadian offering OM investment ceiling.",
    introEyebrow: "Country-aware screening",
    introTitle: "Start with the questions. Use the guide only when you need it.",
    selfIntroTitle: "Check your category and preliminary investment ceiling.",
    introBody: "Seven core questions produce a financial-threshold result and a separate jurisdiction review path.",
    selfIntroBody: "Answer seven core questions, plus the registered-advice question when applicable. The result applies the Canadian financial thresholds and shows the preliminary rolling 12-month OM ceiling.",
    start: "Start qualification",
    guide: "View qualification guide",
    time: "About 3 minutes",
    complete: "All financial questions are required",
    referenceMode: "Reference-only mode",
    referenceBody: "You opened this tool from an existing client. Complete the questions for reference; this result will not overwrite their record.",
    backToClient: "Back to client",
    question: "Question",
    of: "of",
    back: "Back",
    next: "Next",
    seeResult: "See result",
    restart: "Restart",
    cadNote: "All thresholds are in Canadian dollars (CAD). Use the purchaser’s CAD-equivalent values.",
    accountTitle: "Who is the purchaser?",
    accountBody: "Choose the legal purchaser, not the person completing this tool.",
    individual: "Individual",
    individualHelp: "A person purchasing personally or jointly with a spouse.",
    entity: "Company or entity",
    entityHelp: "A corporation, trust, partnership, fund, estate, or other organization.",
    residenceTitle: "Where does the purchaser primarily reside?",
    residenceBody: "Residence determines the compliance review path, but it does not block the Canadian financial-threshold screen.",
    country: "Country of residence",
    chooseCountry: "Choose a country",
    province: "Province or territory",
    chooseProvince: "Choose a province or territory",
    registrationTitle: "Does the purchaser have qualifying Canadian securities registration?",
    registrationBody: "This includes current registration as a representative of a Canadian dealer or adviser, and certain qualifying former registration.",
    financialAssetsTitle: "What are the purchaser’s net financial assets?",
    financialAssetsBody: "Use financial assets owned alone or with a spouse, after related liabilities. Do not include real estate.",
    incomeTitle: "What was the purchaser’s individual net income before tax?",
    incomeBody: "Choose the band that was exceeded in each of the previous two calendar years and is reasonably expected to be exceeded this year.",
    spouseTitle: "What was the purchaser’s combined net income with a spouse?",
    spouseBody: "Use the same two-prior-years and current-year expectation test.",
    netAssetsTitle: "What are the purchaser’s total net assets?",
    netAssetsBody: "Use total assets minus total liabilities, alone or with a spouse. Real estate may be included here.",
    adviceTitle: "Has the required registered suitability advice been provided?",
    adviceBody: "To use the higher CAD $100,000 Canadian OM ceiling, a portfolio manager, investment dealer, or exempt market dealer must advise that exceeding CAD $30,000—and the investment itself—is suitable.",
    adviceYes: "Yes, for the proposed investment",
    adviceNo: "No",
    adviceUnsure: "Not sure",
    answers: {
      yes: "Yes",
      no: "No",
      unsure: "Not sure",
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
    resultEyebrow: "Canadian financial-threshold result",
    resultTitles: {
      "potentially-accredited": "Matches accredited-investor thresholds",
      "potentially-eligible": "Matches eligible-investor thresholds",
      "potentially-non-eligible": "Does not currently match either threshold",
      "needs-information": "More information is needed",
      "entity-review": "Entity classification requires professional review",
    } satisfies Record<InvestorFinancialResult, string>,
    resultBodies: {
      "potentially-accredited": "At least one recorded answer matches a Canadian accredited-investor financial or registration criterion.",
      "potentially-eligible": "No accredited criterion was recorded, and at least one answer matches a Canadian eligible-investor financial criterion.",
      "potentially-non-eligible": "The recorded answers do not establish an accredited- or eligible-investor financial criterion.",
      "needs-information": "At least one required answer is uncertain, so the financial category cannot be stated confidently.",
      "entity-review": "Entity categories depend on legal form, ownership, financial statements, and statutory status and are not automated here.",
    } satisfies Record<InvestorFinancialResult, string>,
    jurisdictionEyebrow: "Jurisdiction path",
    jurisdictionTitles: {
      "ontario-licensed-review": "Ontario licensed verification required",
      "canada-outside-ontario-review": "Applicable Canadian jurisdiction review required",
      "cross-border-review": "Cross-border review required",
    } satisfies Record<InvestorJurisdictionReview, string>,
    jurisdictionBodies: {
      "ontario-licensed-review": "Verify evidence, the issuer, the available exemption, KYC/KYP, and suitability before relying on this result.",
      "canada-outside-ontario-review": "Confirm local registration and prospectus-exemption requirements for the purchaser’s province or territory.",
      "cross-border-review": "Confirm Canadian and local-country distribution, registration, tax, AML, source-of-funds, and transfer requirements.",
    } satisfies Record<InvestorJurisdictionReview, string>,
    recordedBasis: "Recorded basis",
    noBasis: "No qualifying criterion can be recorded from these answers.",
    criteria: {
      "individual-registration": "Qualifying Canadian registration",
      "individual-financial-assets": "Net financial assets over CAD $1,000,000",
      "individual-income": "Individual income over CAD $200,000",
      "individual-spousal-income": "Combined spousal income over CAD $300,000",
      "individual-net-assets": "Net assets of at least CAD $5,000,000",
      "eligible-net-assets": "Net assets over CAD $400,000",
      "eligible-income": "Individual income over CAD $75,000",
      "eligible-spousal-income": "Combined spousal income over CAD $125,000",
    } as Partial<Record<InvestorReadinessCriterion, string>>,
    disclaimer: "This is a preliminary financial indicator—not transaction approval, suitability, legal advice, or permission to invest. Licensed review remains required.",
    maximumEyebrow: "Preliminary Canadian OM ceiling",
    maximumLimitBody: "For this Canadian offering screen, the Ontario OM ruleset is applied regardless of residence. The ceiling covers the aggregate acquisition cost of all securities bought under the offering-memorandum exemption in the preceding 12 months.",
    maximumAdviceBody: "The CAD $100,000 ceiling depends on the specified registrant advice for the investment. A registrant may still determine that a lower amount is suitable.",
    maximumBaseBody: "A registrant may still determine that a lower amount is suitable.",
    maximumBalanceNote: "This is not your remaining balance. A registrant must account for applicable OM purchases in the preceding 12 months and confirm whether any transaction-specific relief applies.",
    maximumNoLimitTitle: "No individual OM ceiling indicated",
    maximumNoLimitBody: "This preliminary accredited result is not subject to an individual investment ceiling in this Canadian OM screen. Other exemptions, offering terms, suitability, and compliance requirements can still limit a transaction.",
    maximumNeedsTitle: "Maximum cannot be estimated yet",
    maximumNeedsBody: "Resolve every uncertain financial answer before relying on a category or preliminary investment ceiling.",
    maximumEntityTitle: "Entity maximum requires professional review",
    maximumEntityBody: "Entity limits depend on legal form, ownership, the exemption used, and the specific offering.",
    exploreFunds: "Explore funds",
    addClient: "Add as a client",
    addTitle: "Add this investor as a client",
    addBody: "Identity is collected only after the qualification result.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    permission: "I confirm the client has permitted this information to be recorded for preliminary review and contact.",
    accuracy: "I confirm the answers are accurate to my knowledge and are not a final eligibility determination.",
    create: "Create client",
    cancel: "Cancel",
    required: "Complete all fields and acknowledgements.",
    saveError: "The client could not be created. Please try again.",
    duplicateTitle: "A client with this email already exists.",
    viewExisting: "View existing client",
    guideTitle: "Canadian qualification guide",
    guideDescription: "A compact reference for the individual thresholds used by this screening tool.",
    guideRows: [
      { title: "Accredited investor", tone: "blue", points: ["Net financial assets over CAD $1M", "Income over CAD $200k individually or $300k with a spouse", "No individual ceiling under Ontario’s OM exemption"] },
      { title: "Eligible investor", tone: "green", points: ["Net assets over CAD $400k or the qualifying income threshold", "Ontario OM ceiling: CAD $30k over 12 months", "Up to CAD $100k only with the specified registered advice"] },
      { title: "Non-eligible indicator", tone: "sand", points: ["No accredited or eligible threshold is established", "Ontario OM ceiling: CAD $10k over 12 months", "Does not mean a transaction is approved or rejected"] },
    ],
    guideNote: "These Canadian labels are not universal investor categories. Residence is assessed separately, and foreign purchasers always require a cross-border review.",
    sources: "Sources and further reading",
    parvis: "Parvis overview",
    instrument: "NI 45-106",
    policy: "45-106 companion policy",
  },
  tr: {
    eyebrow: "Profesyonel kaynak",
    title: "Yatırımcı sınıflandırması",
    description: "Müşterinin nerede yaşadığına bakılmaksızın, yanıtlarının gösterdiği Kanada finansal kategorisini belirleyin.",
    selfEyebrow: "Yatırımcı öz kontrolü",
    selfTitle: "Yatırımcı kategorinizi kontrol edin",
    selfDescription: "Ön Kanada finansal kategorinizi ve Kanada teklifi OM yatırım tavanınızı görmek için soruları kendiniz yanıtlayın.",
    introEyebrow: "Ülke duyarlı ön inceleme",
    introTitle: "Sorularla başlayın. Rehberi yalnızca gerektiğinde açın.",
    selfIntroTitle: "Kategorinizi ve ön yatırım tavanınızı kontrol edin.",
    introBody: "Yedi temel soru, finansal eşik sonucunu ve ayrı bir yargı alanı inceleme yolunu gösterir.",
    selfIntroBody: "Yedi temel soruyu ve uygunsa kayıtlı tavsiye sorusunu yanıtlayın. Sonuç Kanada finansal eşiklerini uygular ve ön hareketli 12 aylık OM tavanını gösterir.",
    start: "Sınıflandırmayı başlat",
    guide: "Sınıflandırma rehberini aç",
    time: "Yaklaşık 3 dakika",
    complete: "Tüm finansal sorular zorunludur",
    referenceMode: "Yalnızca referans modu",
    referenceBody: "Bu aracı mevcut bir müşteriden açtınız. Soruları referans için tamamlayın; sonuç müşteri kaydının üzerine yazılmaz.",
    backToClient: "Müşteriye dön",
    question: "Soru",
    of: "/",
    back: "Geri",
    next: "İleri",
    seeResult: "Sonucu göster",
    restart: "Yeniden başlat",
    cadNote: "Tüm eşikler Kanada dolarıdır (CAD). Alıcının CAD karşılığı değerlerini kullanın.",
    accountTitle: "Yasal alıcı kim?",
    accountBody: "Bu aracı dolduran kişiyi değil, yasal olarak satın alacak tarafı seçin.",
    individual: "Bireysel",
    individualHelp: "Kişisel olarak veya eşiyle birlikte satın alan gerçek kişi.",
    entity: "Şirket veya kuruluş",
    entityHelp: "Şirket, trust, ortaklık, fon, tereke veya başka bir kuruluş.",
    residenceTitle: "Alıcı esas olarak hangi ülkede ikamet ediyor?",
    residenceBody: "İkamet, uyum inceleme yolunu belirler; Kanada finansal eşik incelemesini engellemez.",
    country: "İkamet ülkesi",
    chooseCountry: "Ülke seçin",
    province: "İl veya bölge",
    chooseProvince: "İl veya bölge seçin",
    registrationTitle: "Alıcının uygun bir Kanada menkul kıymet kaydı var mı?",
    registrationBody: "Kanadalı bir dealer veya adviser temsilcisi olarak mevcut kayıt ve belirli uygun eski kayıt türlerini içerir.",
    financialAssetsTitle: "Alıcının net finansal varlıkları ne kadar?",
    financialAssetsBody: "Tek başına veya eşle sahip olunan finansal varlıklardan ilgili borçları çıkarın. Gayrimenkulü dahil etmeyin.",
    incomeTitle: "Alıcının vergi öncesi bireysel net geliri ne kadardı?",
    incomeBody: "Önceki iki takvim yılının her birinde aşılan ve bu yıl da aşılması makul olarak beklenen aralığı seçin.",
    spouseTitle: "Alıcının eşiyle birleşik net geliri ne kadardı?",
    spouseBody: "Aynı iki önceki yıl ve cari yıl beklentisi testini kullanın.",
    netAssetsTitle: "Alıcının toplam net varlıkları ne kadar?",
    netAssetsBody: "Tek başına veya eşle birlikte toplam varlıklardan toplam borçları çıkarın. Gayrimenkul burada dahil edilebilir.",
    adviceTitle: "Gerekli kayıtlı uygunluk tavsiyesi verildi mi?",
    adviceBody: "Daha yüksek 100.000 CAD Kanada OM tavanını kullanmak için bir portfolio manager, investment dealer veya exempt market dealer; 30.000 CAD sınırının aşılmasının ve yatırımın kendisinin uygun olduğunu belirtmelidir.",
    adviceYes: "Evet, önerilen yatırım için",
    adviceNo: "Hayır",
    adviceUnsure: "Emin değilim",
    answers: {
      yes: "Evet",
      no: "Hayır",
      unsure: "Emin değilim",
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
    resultEyebrow: "Kanada finansal eşik sonucu",
    resultTitles: {
      "potentially-accredited": "Akredite yatırımcı eşikleriyle eşleşiyor",
      "potentially-eligible": "Uygun yatırımcı eşikleriyle eşleşiyor",
      "potentially-non-eligible": "Şu anda iki eşikten biriyle eşleşmiyor",
      "needs-information": "Daha fazla bilgi gerekli",
      "entity-review": "Kuruluş sınıflandırması profesyonel inceleme gerektirir",
    } satisfies Record<InvestorFinancialResult, string>,
    resultBodies: {
      "potentially-accredited": "Kaydedilen en az bir yanıt, Kanada akredite yatırımcı finansal veya kayıt kriteriyle eşleşiyor.",
      "potentially-eligible": "Akredite kriter kaydedilmedi ve en az bir yanıt Kanada uygun yatırımcı finansal kriteriyle eşleşiyor.",
      "potentially-non-eligible": "Kaydedilen yanıtlar akredite veya uygun yatırımcı finansal kriteri oluşturmuyor.",
      "needs-information": "En az bir zorunlu yanıt belirsiz olduğundan finansal kategori güvenle belirtilemiyor.",
      "entity-review": "Kuruluş kategorileri hukuki yapı, sahiplik, finansal tablolar ve yasal statüye bağlıdır; burada otomatik belirlenmez.",
    } satisfies Record<InvestorFinancialResult, string>,
    jurisdictionEyebrow: "Yargı alanı yolu",
    jurisdictionTitles: {
      "ontario-licensed-review": "Ontario lisanslı doğrulaması gerekli",
      "canada-outside-ontario-review": "İlgili Kanada yargı alanı incelemesi gerekli",
      "cross-border-review": "Sınır ötesi inceleme gerekli",
    } satisfies Record<InvestorJurisdictionReview, string>,
    jurisdictionBodies: {
      "ontario-licensed-review": "Bu sonuca güvenmeden önce kanıtı, ihraççıyı, mevcut muafiyeti, KYC/KYP ve suitability sürecini doğrulayın.",
      "canada-outside-ontario-review": "Alıcının il veya bölgesi için yerel kayıt ve izahname muafiyeti gerekliliklerini doğrulayın.",
      "cross-border-review": "Kanada ve yerel ülkenin dağıtım, kayıt, vergi, AML, fon kaynağı ve transfer gerekliliklerini doğrulayın.",
    } satisfies Record<InvestorJurisdictionReview, string>,
    recordedBasis: "Kaydedilen dayanak",
    noBasis: "Bu yanıtlardan yeterlilik kriteri kaydedilemiyor.",
    criteria: {
      "individual-registration": "Uygun Kanada menkul kıymet kaydı",
      "individual-financial-assets": "1.000.000 CAD üzerinde net finansal varlık",
      "individual-income": "200.000 CAD üzerinde bireysel gelir",
      "individual-spousal-income": "300.000 CAD üzerinde eşle birleşik gelir",
      "individual-net-assets": "En az 5.000.000 CAD net varlık",
      "eligible-net-assets": "400.000 CAD üzerinde net varlık",
      "eligible-income": "75.000 CAD üzerinde bireysel gelir",
      "eligible-spousal-income": "125.000 CAD üzerinde eşle birleşik gelir",
    } as Partial<Record<InvestorReadinessCriterion, string>>,
    disclaimer: "Bu yalnızca ön finansal göstergedir; işlem onayı, suitability kararı, hukuki tavsiye veya yatırım izni değildir. Lisanslı inceleme zorunludur.",
    maximumEyebrow: "Ön Kanada OM tavanı",
    maximumLimitBody: "Bu Kanada teklifi ön incelemesinde Ontario OM kural seti ikametten bağımsız uygulanır. Tavan, önceki 12 ay içinde teklif muhtırası muafiyeti kapsamında alınan tüm menkul kıymetlerin toplam edinim maliyetine uygulanır.",
    maximumAdviceBody: "100.000 CAD tavan, yatırım için belirtilen kayıtlı kuruluş tavsiyesine bağlıdır. Kayıtlı kuruluş daha düşük bir tutarın uygun olduğuna karar verebilir.",
    maximumBaseBody: "Kayıtlı kuruluş daha düşük bir tutarın uygun olduğuna karar verebilir.",
    maximumBalanceNote: "Bu, kalan bakiyeniz değildir. Kayıtlı kuruluş, önceki 12 aydaki ilgili OM alımlarını hesaba katmalı ve işleme özgü bir muafiyet olup olmadığını doğrulamalıdır.",
    maximumNoLimitTitle: "Bireysel OM tavanı görünmüyor",
    maximumNoLimitBody: "Bu ön akredite sonuç, bu Kanada OM ön incelemesinde bireysel yatırım tavanına tabi görünmüyor. Diğer muafiyetler, teklif koşulları, uygunluk ve uyum gereklilikleri işlemi yine sınırlayabilir.",
    maximumNeedsTitle: "Azami tutar henüz tahmin edilemiyor",
    maximumNeedsBody: "Bir kategoriye veya ön yatırım tavanına güvenmeden önce tüm belirsiz finansal yanıtları netleştirin.",
    maximumEntityTitle: "Kuruluş azami tutarı profesyonel inceleme gerektirir",
    maximumEntityBody: "Kuruluş limitleri hukuki yapıya, sahipliğe, kullanılan muafiyete ve belirli teklife bağlıdır.",
    exploreFunds: "Fonları keşfet",
    addClient: "Müşteri olarak ekle",
    addTitle: "Bu yatırımcıyı müşteri olarak ekle",
    addBody: "Kimlik bilgileri yalnızca sınıflandırma sonucundan sonra alınır.",
    firstName: "Ad",
    lastName: "Soyad",
    email: "E-posta",
    permission: "Müşterinin bu bilgilerin ön inceleme ve iletişim amacıyla kaydedilmesine izin verdiğini onaylıyorum.",
    accuracy: "Yanıtların bilgim dahilinde doğru olduğunu ve nihai uygunluk kararı olmadığını onaylıyorum.",
    create: "Müşteri oluştur",
    cancel: "İptal",
    required: "Tüm alanları ve onayları tamamlayın.",
    saveError: "Müşteri oluşturulamadı. Lütfen tekrar deneyin.",
    duplicateTitle: "Bu e-posta adresiyle bir müşteri zaten var.",
    viewExisting: "Mevcut müşteriyi görüntüle",
    guideTitle: "Kanada sınıflandırma rehberi",
    guideDescription: "Bu ön inceleme aracında kullanılan bireysel eşikler için kısa referans.",
    guideRows: [
      { title: "Akredite yatırımcı", tone: "blue", points: ["1 milyon CAD üzerinde net finansal varlık", "Bireysel 200 bin CAD veya eşle 300 bin CAD üzerinde gelir", "Ontario OM muafiyetinde bireysel tavan yok"] },
      { title: "Uygun yatırımcı", tone: "green", points: ["400 bin CAD üzerinde net varlık veya uygun gelir eşiği", "Ontario OM tavanı: 12 ayda 30 bin CAD", "Yalnızca belirtilen kayıtlı tavsiyeyle 100 bin CAD'a kadar"] },
      { title: "Uygun olmayan göstergesi", tone: "sand", points: ["Akredite veya uygun eşik oluşmamıştır", "Ontario OM tavanı: 12 ayda 10 bin CAD", "İşlemin onaylandığı veya reddedildiği anlamına gelmez"] },
    ],
    guideNote: "Bu Kanada terimleri evrensel yatırımcı kategorileri değildir. İkamet ayrıca değerlendirilir ve yabancı alıcılar her zaman sınır ötesi inceleme gerektirir.",
    sources: "Kaynaklar ve ek okuma",
    parvis: "Parvis özeti",
    instrument: "NI 45-106",
    policy: "45-106 companion policy",
  },
} as const;

const fieldClass = "h-11 w-full rounded-md border border-[#cfd9df] bg-white px-3 text-sm text-[#263f4f] outline-none transition focus:border-[#0a4b72] focus:ring-2 focus:ring-[#0a4b72]/15";

export function InvestorReadinessTool() {
  const router = useRouter();
  const params = useSearchParams();
  const { lang } = useLang();
  const c = COPY[lang];
  const { context } = usePortalAccess();
  const professionalMode = canUseWorkspace(context, "professional");
  const { clients, createProspect, saveInvestorAssessment } = useClients();
  const referenceClientId = params.get("clientId") ?? "";
  const referenceClient = professionalMode
    ? clients.find((client) => client.id === referenceClientId)
    : undefined;
  const referenceMode = Boolean(referenceClient);

  const countryOptions = useMemo(() => {
    const displayNames = new Intl.DisplayNames([lang === "tr" ? "tr" : "en"], { type: "region" });
    return COUNTRY_CODES.map((code) => ({ code, label: displayNames.of(code) ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label, lang === "tr" ? "tr" : "en"));
  }, [lang]);

  const [stage, setStage] = useState<Stage>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [accountType, setAccountType] = useState<ClientAccountType>();
  const [countryCode, setCountryCode] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [profile, setProfile] = useState<ProfileAnswers>({});
  const [registeredAdvice, setRegisteredAdvice] = useState<RegisteredSuitabilityAdvice>();
  const [guideOpen, setGuideOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<ProspectDraft>({ firstName: "", lastName: "", email: "" });
  const [permission, setPermission] = useState(false);
  const [accuracy, setAccuracy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [duplicateClientId, setDuplicateClientId] = useState("");

  useEffect(() => {
    if (!referenceClient || accountType || countryCode) return;
    const normalizedCountry = referenceClient.country.trim().toLocaleLowerCase("en");
    const matchedCountry = countryOptions.find((country) =>
      country.label.trim().toLocaleLowerCase("en") === normalizedCountry
      || (country.code === "CA" && normalizedCountry === "canada")
      || (country.code === "TR" && ["turkey", "türkiye"].includes(normalizedCountry)),
    );
    setAccountType(referenceClient.accountType);
    setCountryCode(matchedCountry?.code ?? "");
    if (matchedCountry?.code === "CA") {
      const region = CANADIAN_REGIONS.find((item) =>
        item.code === referenceClient.region?.toUpperCase()
        || item.en.toLowerCase() === referenceClient.region?.toLowerCase(),
      );
      setRegionCode(region?.code ?? "");
    }
  }, [accountType, countryCode, countryOptions, referenceClient]);

  useEffect(() => {
    if (professionalMode || accountType || countryCode) return;
    const residence = context.user.residenceJurisdiction?.trim().toLocaleLowerCase("en") ?? "";
    setAccountType(context.user.investorAccountType ?? "individual");
    if (residence.includes("canada")) {
      setCountryCode("CA");
      if (residence.includes("ontario")) setRegionCode("ON");
    } else if (residence.includes("turkey") || residence.includes("türkiye")) {
      setCountryCode("TR");
    }
  }, [accountType, context.user.investorAccountType, context.user.residenceJurisdiction, countryCode, professionalMode]);

  const readinessAnswers = useMemo(() => qualificationBandsToReadinessAnswers(profile), [profile]);
  const decision = useMemo(() => assessCanadianFinancialProfile({
    accountType: accountType ?? "individual",
    answers: readinessAnswers,
  }), [accountType, readinessAnswers]);
  const jurisdictionReview = resolveInvestorJurisdiction({
    residenceCountryCode: countryCode,
    residenceRegionCode: regionCode || undefined,
  });
  const selectedCountry = countryOptions.find((country) => country.code === countryCode);
  const selectedRegion = CANADIAN_REGIONS.find((region) => region.code === regionCode);
  const adviceQuestionRequired = accountType === "individual"
    && decision.financialResult === "potentially-eligible";
  const totalQuestions = accountType === "entity" ? 2 : adviceQuestionRequired ? 8 : 7;
  const maximumInvestment = preliminaryMaximumInvestment({
    financialResult: decision.financialResult,
    registeredSuitabilityAdvice: registeredAdvice,
  });

  function start() {
    setStage("questions");
    setQuestionIndex(0);
  }

  function reset() {
    setStage("intro");
    setQuestionIndex(0);
    setProfile({});
    setRegisteredAdvice(undefined);
    setAccountType(referenceClient?.accountType);
    const normalizedCountry = referenceClient?.country.toLowerCase();
    setCountryCode(normalizedCountry === "canada" ? "CA" : normalizedCountry === "turkey" || normalizedCountry === "türkiye" ? "TR" : "");
    setRegionCode(referenceClient?.region?.toLowerCase() === "ontario" ? "ON" : "");
    setAddOpen(false);
    setDuplicateClientId("");
    setSaveStatus("idle");
  }

  function canContinue() {
    if (questionIndex === 0) return Boolean(accountType);
    if (questionIndex === 1) return Boolean(countryCode && (countryCode !== "CA" || regionCode));
    if (questionIndex === 2) return Boolean(profile.registration);
    if (questionIndex === 3) return Boolean(profile.financialAssets);
    if (questionIndex === 4) return Boolean(profile.individualIncome);
    if (questionIndex === 5) return Boolean(profile.spousalIncome);
    if (questionIndex === 6) return Boolean(profile.netAssets);
    if (questionIndex === 7) return Boolean(registeredAdvice);
    return false;
  }

  function next() {
    if (!canContinue()) return;
    const lastQuestion = accountType === "entity"
      ? questionIndex === 1
      : questionIndex === 6 ? !adviceQuestionRequired : questionIndex === 7;
    if (lastQuestion) {
      setStage("result");
      return;
    }
    setQuestionIndex((current) => current + 1);
  }

  function back() {
    if (questionIndex === 0) {
      setStage("intro");
      return;
    }
    setQuestionIndex((current) => current - 1);
  }

  async function addClient() {
    if (!professionalMode) return;
    setSaveStatus("idle");
    setDuplicateClientId("");
    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim() || !permission || !accuracy || !accountType || !selectedCountry) {
      setSaveStatus("error");
      return;
    }
    const duplicate = clients.find((client) => client.email.trim().toLowerCase() === draft.email.trim().toLowerCase());
    if (duplicate) {
      setDuplicateClientId(duplicate.id);
      return;
    }

    setSaveStatus("saving");
    const jurisdiction: ClientJurisdiction = jurisdictionReview === "ontario-licensed-review" ? "ontario" : "manual-review";
    const reviewReasons: InvestorReadinessReviewReason[] = [];
    if (decision.financialResult === "needs-information") reviewReasons.push("incomplete-or-uncertain-financial-facts");
    if (jurisdictionReview !== "ontario-licensed-review") reviewReasons.push("outside-ontario");
    const timestamp = new Date().toISOString();
    try {
      const clientId = await createProspect({
        accountType,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        country: selectedCountry.label,
        region: selectedRegion?.[lang],
        jurisdiction,
      });
      saveInvestorAssessment(clientId, {
        jurisdiction,
        accountType,
        answers: readinessAnswers,
        result: decision.result,
        financialResult: decision.financialResult,
        jurisdictionReview,
        residenceCountryCode: countryCode,
        residenceRegionCode: regionCode || undefined,
        qualifyingCriteria: decision.qualifyingCriteria,
        omContext: omContextForResult(decision.result),
        candidateRoutes: ["licensed-review"],
        reviewReasons,
        omCalculation: maximumInvestment.status === "limit"
          ? { status: "calculated", limitCad: maximumInvestment.limitCad }
          : maximumInvestment.status === "no-individual-om-limit"
            ? { status: "not-applicable" }
            : { status: "manual-review" },
        assessmentInput: {
          residenceCountryCode: countryCode,
          residenceRegionCode: regionCode || undefined,
          profileAnswers: profile,
          registeredSuitabilityAdvice: registeredAdvice,
        },
        rulesetId: decision.rulesetId,
        sourceUrls: decision.sourceUrls,
        reassessmentTriggers: [
          "jurisdiction",
          "purchaser-type",
          "financial-facts",
          ...(adviceQuestionRequired ? ["registered-suitability-advice" as const] : []),
        ],
        assessor: "Partner professional",
        acknowledgementAt: timestamp,
      });
      router.push(`${NORTH_BASE}/clients/${clientId}`);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaveStatus((current) => current === "saving" ? "idle" : current);
    }
  }

  return <div>
    <PageHeader
      eyebrow={professionalMode ? c.eyebrow : c.selfEyebrow}
      title={professionalMode ? c.title : c.selfTitle}
      description={professionalMode ? c.description : c.selfDescription}
    />

    {referenceMode && <div className="mx-auto mb-5 flex max-w-3xl flex-col gap-3 rounded-md border border-[#cddce5] bg-[#eef4f7] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#0a4b72]" /><div><p className="text-sm font-semibold text-[#203f52]">{c.referenceMode}</p><p className="mt-1 text-xs leading-5 text-[#607581]">{c.referenceBody}</p></div></div>
      {referenceClient && <Link href={`${NORTH_BASE}/clients/${referenceClient.id}`} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#b8cbd6] bg-white px-3 text-xs font-semibold text-[#31566c]"><ArrowLeft className="size-3.5" />{c.backToClient}</Link>}
    </div>}

    <div className="mx-auto max-w-3xl">
      {stage === "intro" && <Panel className="overflow-hidden">
        <div className="relative overflow-hidden bg-[#0a2d46] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/[0.03]" />
          <Globe2 className="size-8 text-[#9cc8df]" />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a9cadc]">{c.introEyebrow}</p>
          <h2 className="mt-2 max-w-xl font-serif text-2xl font-semibold leading-tight sm:text-3xl">{professionalMode ? c.introTitle : c.selfIntroTitle}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#d2e0e8]">{professionalMode ? c.introBody : c.selfIntroBody}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={start} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#0a2d46] shadow-sm hover:bg-[#f1f6f8]">{c.start}<ArrowRight className="size-4" /></button>
            <button type="button" onClick={() => setGuideOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/30 px-5 text-sm font-semibold text-white hover:bg-white/10"><BookOpen className="size-4" />{c.guide}</button>
          </div>
        </div>
        <div className="grid gap-3 px-6 py-5 text-xs text-[#5e717d] sm:grid-cols-2 sm:px-9">
          <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#4c755c]" />{c.time}</p>
          <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#4c755c]" />{c.complete}</p>
        </div>
      </Panel>}

      {stage === "questions" && <Panel className="overflow-hidden">
        <div className="border-b border-[#e2e8eb] bg-[#f8fafb] px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold text-[#526976]">{c.question} {questionIndex + 1} {c.of} {totalQuestions}</p>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607480] hover:text-[#0a2d46]"><RotateCcw className="size-3.5" />{c.restart}</button>
          </div>
          <Progress value={((questionIndex + 1) / totalQuestions) * 100} className="mt-3 h-1.5 bg-[#dce6eb] [&_[data-slot=progress-indicator]]:bg-[#0a4b72]" />
        </div>

        <div className="min-h-[390px] px-5 py-7 sm:px-8 sm:py-9">
          <QuestionContent
            index={questionIndex}
            copy={c}
            accountType={accountType}
            onAccountType={setAccountType}
            countryCode={countryCode}
            onCountryCode={(value) => { setCountryCode(value); if (value !== "CA") setRegionCode(""); }}
            regionCode={regionCode}
            onRegionCode={setRegionCode}
            countryOptions={countryOptions}
            lang={lang}
            profile={profile}
            onProfile={setProfile}
            registeredAdvice={registeredAdvice}
            onRegisteredAdvice={setRegisteredAdvice}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e2e8eb] px-5 py-4 sm:px-7">
          <button type="button" onClick={back} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d1d9de] px-4 text-sm font-semibold text-[#536570] hover:bg-[#f6f8f9]"><ArrowLeft className="size-4" />{c.back}</button>
          <button type="button" onClick={next} disabled={!canContinue()} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white hover:bg-[#123f5e] disabled:cursor-not-allowed disabled:opacity-40">{questionIndex === totalQuestions - 1 ? c.seeResult : c.next}<ArrowRight className="size-4" /></button>
        </div>
      </Panel>}

      {stage === "result" && <ResultView
        copy={c}
        decision={decision}
        jurisdictionReview={jurisdictionReview}
        countryLabel={selectedCountry?.label ?? countryCode}
        regionLabel={selectedRegion?.[lang]}
        referenceClientId={referenceClient?.id}
        selfMode={!professionalMode}
        maximumInvestment={maximumInvestment}
        onAdd={() => setAddOpen(true)}
        onGuide={() => setGuideOpen(true)}
        onRestart={reset}
      />}
    </div>

    <QualificationGuide open={guideOpen} onOpenChange={setGuideOpen} copy={c} />

    {professionalMode && <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setDuplicateClientId(""); setSaveStatus("idle"); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-[#172e40]">{c.addTitle}</DialogTitle>
          <DialogDescription>{c.addBody}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1 sm:grid-cols-2">
          <Field label={c.firstName}><input value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} className={fieldClass} autoComplete="given-name" /></Field>
          <Field label={c.lastName}><input value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} className={fieldClass} autoComplete="family-name" /></Field>
          <Field label={c.email} className="sm:col-span-2"><input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className={fieldClass} autoComplete="email" /></Field>
        </div>
        <div className="space-y-2">
          <Consent checked={permission} onChange={setPermission} label={c.permission} />
          <Consent checked={accuracy} onChange={setAccuracy} label={c.accuracy} />
        </div>
        {saveStatus === "error" && <p role="alert" className="rounded-md border border-[#edcec8] bg-[#fbefed] px-3 py-2 text-xs text-[#91483f]">{draft.firstName && draft.lastName && draft.email && permission && accuracy ? c.saveError : c.required}</p>}
        {duplicateClientId && <div role="alert" className="rounded-md border border-[#eadcb8] bg-[#fbf7eb] p-3 text-sm text-[#685526]"><p className="font-semibold">{c.duplicateTitle}</p><Link href={`${NORTH_BASE}/clients/${duplicateClientId}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4b72]">{c.viewExisting}<ArrowRight className="size-3.5" /></Link></div>}
        <DialogFooter>
          <button type="button" onClick={() => setAddOpen(false)} className="h-10 rounded-md border border-[#d1d9de] px-4 text-sm font-semibold text-[#536570]">{c.cancel}</button>
          <button type="button" onClick={addClient} disabled={saveStatus === "saving"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-50"><UserPlus className="size-4" />{c.create}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </div>;
}

type Copy = (typeof COPY)["en"] | (typeof COPY)["tr"];

function QuestionContent({
  index,
  copy,
  accountType,
  onAccountType,
  countryCode,
  onCountryCode,
  regionCode,
  onRegionCode,
  countryOptions,
  lang,
  profile,
  onProfile,
  registeredAdvice,
  onRegisteredAdvice,
}: {
  index: number;
  copy: Copy;
  accountType?: ClientAccountType;
  onAccountType: (value: ClientAccountType) => void;
  countryCode: string;
  onCountryCode: (value: string) => void;
  regionCode: string;
  onRegionCode: (value: string) => void;
  countryOptions: Array<{ code: string; label: string }>;
  lang: "en" | "tr";
  profile: ProfileAnswers;
  onProfile: (value: ProfileAnswers) => void;
  registeredAdvice?: RegisteredSuitabilityAdvice;
  onRegisteredAdvice: (value: RegisteredSuitabilityAdvice) => void;
}) {
  if (index === 0) return <QuestionLayout title={copy.accountTitle} body={copy.accountBody}>
    <div className="grid gap-3 sm:grid-cols-2">
      <LargeChoice active={accountType === "individual"} onClick={() => onAccountType("individual")} icon={<UserRound className="size-5" />} title={copy.individual} body={copy.individualHelp} />
      <LargeChoice active={accountType === "entity"} onClick={() => onAccountType("entity")} icon={<Building2 className="size-5" />} title={copy.entity} body={copy.entityHelp} />
    </div>
  </QuestionLayout>;

  if (index === 1) return <QuestionLayout title={copy.residenceTitle} body={copy.residenceBody}>
    <div className="mx-auto max-w-md space-y-4">
      <Field label={copy.country}>
        <select value={countryCode} onChange={(event) => onCountryCode(event.target.value)} className={fieldClass}>
          <option value="">{copy.chooseCountry}</option>
          {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}
        </select>
      </Field>
      {countryCode === "CA" && <Field label={copy.province}>
        <select value={regionCode} onChange={(event) => onRegionCode(event.target.value)} className={fieldClass}>
          <option value="">{copy.chooseProvince}</option>
          {CANADIAN_REGIONS.map((region) => <option key={region.code} value={region.code}>{region[lang]}</option>)}
        </select>
      </Field>}
    </div>
  </QuestionLayout>;

  if (index === 2) return <QuestionLayout title={copy.registrationTitle} body={copy.registrationBody}>
    <AnswerGrid value={profile.registration} onChange={(value) => onProfile({ ...profile, registration: value as InvestorReadinessAnswer })} options={[
      { value: "yes", label: copy.answers.yes },
      { value: "no", label: copy.answers.no },
      { value: "unsure", label: copy.answers.unsure },
    ]} />
  </QuestionLayout>;

  if (index === 3) return <FinancialQuestion title={copy.financialAssetsTitle} body={copy.financialAssetsBody} note={copy.cadNote}>
    <AnswerGrid value={profile.financialAssets} onChange={(value) => onProfile({ ...profile, financialAssets: value as NonNullable<ProfileAnswers["financialAssets"]> })} options={[
      { value: "above-million", label: copy.answers["above-million"] },
      { value: "million-or-less", label: copy.answers["million-or-less"] },
      { value: "unsure", label: copy.answers.unsure },
    ]} />
  </FinancialQuestion>;

  if (index === 4) return <FinancialQuestion title={copy.incomeTitle} body={copy.incomeBody} note={copy.cadNote}>
    <AnswerGrid value={profile.individualIncome} onChange={(value) => onProfile({ ...profile, individualIncome: value as NonNullable<ProfileAnswers["individualIncome"]> })} options={[
      { value: "above-200", label: copy.answers["above-200"] },
      { value: "above-75-to-200", label: copy.answers["above-75-to-200"] },
      { value: "75-or-less", label: copy.answers["75-or-less"] },
      { value: "unsure", label: copy.answers.unsure },
    ]} />
  </FinancialQuestion>;

  if (index === 5) return <FinancialQuestion title={copy.spouseTitle} body={copy.spouseBody} note={copy.cadNote}>
    <AnswerGrid value={profile.spousalIncome} onChange={(value) => onProfile({ ...profile, spousalIncome: value as NonNullable<ProfileAnswers["spousalIncome"]> })} options={[
      { value: "above-300", label: copy.answers["above-300"] },
      { value: "above-125-to-300", label: copy.answers["above-125-to-300"] },
      { value: "125-or-less", label: copy.answers["125-or-less"] },
      { value: "not-applicable", label: copy.answers["not-applicable"] },
      { value: "unsure", label: copy.answers.unsure },
    ]} />
  </FinancialQuestion>;

  if (index === 6) return <FinancialQuestion title={copy.netAssetsTitle} body={copy.netAssetsBody} note={copy.cadNote}>
    <AnswerGrid value={profile.netAssets} onChange={(value) => onProfile({ ...profile, netAssets: value as NonNullable<ProfileAnswers["netAssets"]> })} options={[
      { value: "five-million-plus", label: copy.answers["five-million-plus"] },
      { value: "above-400-under-five", label: copy.answers["above-400-under-five"] },
      { value: "400-or-less", label: copy.answers["400-or-less"] },
      { value: "unsure", label: copy.answers.unsure },
    ]} />
  </FinancialQuestion>;

  return <FinancialQuestion title={copy.adviceTitle} body={copy.adviceBody} note={copy.cadNote}>
    <AnswerGrid value={registeredAdvice} onChange={(value) => onRegisteredAdvice(value as RegisteredSuitabilityAdvice)} options={[
      { value: "yes", label: copy.adviceYes },
      { value: "no", label: copy.adviceNo },
      { value: "unsure", label: copy.adviceUnsure },
    ]} />
  </FinancialQuestion>;
}

function ResultView({ copy, decision, jurisdictionReview, countryLabel, regionLabel, referenceClientId, selfMode, maximumInvestment, onAdd, onGuide, onRestart }: {
  copy: Copy;
  decision: ReturnType<typeof assessCanadianFinancialProfile>;
  jurisdictionReview: InvestorJurisdictionReview;
  countryLabel: string;
  regionLabel?: string;
  referenceClientId?: string;
  selfMode: boolean;
  maximumInvestment: ReturnType<typeof preliminaryMaximumInvestment>;
  onAdd: () => void;
  onGuide: () => void;
  onRestart: () => void;
}) {
  return <div className="space-y-4">
    <Panel className="overflow-hidden">
      <div className="bg-[#0a2d46] px-6 py-7 text-white sm:px-8">
        <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10"><ShieldCheck className="size-6 text-[#b8d7e7]" /></span><div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a9cadc]">{copy.resultEyebrow}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">{copy.resultTitles[decision.financialResult]}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#d3e0e7]">{copy.resultBodies[decision.financialResult]}</p>
        </div></div>
      </div>
      <div className="grid gap-4 p-5 sm:p-7 md:grid-cols-2">
        <MaximumInvestmentCard copy={copy} maximumInvestment={maximumInvestment} />
        <div className="rounded-md border border-[#dfe6ea] bg-[#f8fafb] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7d88]">{copy.recordedBasis}</p>
          {decision.qualifyingCriteria.length ? <ul className="mt-3 space-y-2">{decision.qualifyingCriteria.map((criterion) => <li key={criterion} className="flex gap-2 text-xs leading-5 text-[#405965]"><Check className="mt-0.5 size-3.5 shrink-0 text-[#4d735a]" /><span>{copy.criteria[criterion]}</span></li>)}</ul> : <p className="mt-3 text-xs leading-5 text-[#667985]">{copy.noBasis}</p>}
        </div>
        <div className="rounded-md border border-[#cddde6] bg-[#eef4f7] p-4">
          <div className="flex items-center gap-2 text-[#0a4b72]"><MapPin className="size-4" /><p className="text-[10px] font-bold uppercase tracking-[0.1em]">{copy.jurisdictionEyebrow}</p></div>
          <h3 className="mt-3 text-sm font-semibold text-[#203f52]">{copy.jurisdictionTitles[jurisdictionReview]}</h3>
          <p className="mt-1 text-xs font-medium text-[#486474]">{[regionLabel, countryLabel].filter(Boolean).join(", ")}</p>
          <p className="mt-2 text-xs leading-5 text-[#607581]">{copy.jurisdictionBodies[jurisdictionReview]}</p>
        </div>
      </div>
      <div className="border-t border-[#e3e8eb] px-5 py-4 sm:px-7"><p className="text-xs leading-5 text-[#62747f]">{copy.disclaimer}</p></div>
    </Panel>

    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <button type="button" onClick={onRestart} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d1d9de] bg-white px-4 text-sm font-semibold text-[#536570]"><RotateCcw className="size-4" />{copy.restart}</button>
        <button type="button" onClick={onGuide} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d1d9de] bg-white px-4 text-sm font-semibold text-[#536570]"><BookOpen className="size-4" />{copy.guide}</button>
      </div>
      {referenceClientId
        ? <Link href={`${NORTH_BASE}/clients/${referenceClientId}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white"><ArrowLeft className="size-4" />{copy.backToClient}</Link>
        : selfMode
          ? <Link href={`${NORTH_BASE}/funds`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white">{copy.exploreFunds}<ArrowRight className="size-4" /></Link>
          : <button type="button" onClick={onAdd} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white"><UserPlus className="size-4" />{copy.addClient}</button>}
    </div>
  </div>;
}

function MaximumInvestmentCard({ copy, maximumInvestment }: {
  copy: Copy;
  maximumInvestment: ReturnType<typeof preliminaryMaximumInvestment>;
}) {
  let title: string = copy.maximumNeedsTitle;
  let body: string = copy.maximumNeedsBody;
  let showBalanceNote = false;

  if (maximumInvestment.status === "limit") {
    title = `CAD $${new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(maximumInvestment.limitCad)}`;
    body = `${copy.maximumLimitBody} ${maximumInvestment.adviceConfirmed ? copy.maximumAdviceBody : copy.maximumBaseBody}`;
    showBalanceNote = true;
  } else if (maximumInvestment.status === "no-individual-om-limit") {
    title = copy.maximumNoLimitTitle;
    body = copy.maximumNoLimitBody;
  } else if (maximumInvestment.status === "needs-information") {
    title = copy.maximumNeedsTitle;
    body = copy.maximumNeedsBody;
  } else if (maximumInvestment.status === "entity-review") {
    title = copy.maximumEntityTitle;
    body = copy.maximumEntityBody;
  }

  return <div className="rounded-md border border-[#b9d1de] bg-[#eaf3f7] p-5 md:col-span-2">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#0a4b72] text-white"><CircleDollarSign className="size-5" /></span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#426b80]">{copy.maximumEyebrow}</p>
        <h3 className="mt-1.5 font-serif text-xl font-semibold text-[#173b50]">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-[#506d7c]">{body}</p>
        {showBalanceNote && <p className="mt-3 rounded-md border border-[#ccdde5] bg-white/70 px-3 py-2 text-xs font-medium leading-5 text-[#476675]">{copy.maximumBalanceNote}</p>}
      </div>
    </div>
  </div>;
}

function QualificationGuide({ open, onOpenChange, copy }: { open: boolean; onOpenChange: (open: boolean) => void; copy: Copy }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle className="font-serif text-2xl text-[#172e40]">{copy.guideTitle}</DialogTitle>
        <DialogDescription>{copy.guideDescription}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 md:grid-cols-3">
        {copy.guideRows.map((row) => <section key={row.title} className={cn("rounded-md border p-4", row.tone === "blue" && "border-[#c8dae4] bg-[#eef4f7]", row.tone === "green" && "border-[#d2e1d6] bg-[#f1f6f2]", row.tone === "sand" && "border-[#e8ddc6] bg-[#fbf7ef]")}>
          <h3 className="text-sm font-semibold text-[#203f52]">{row.title}</h3>
          <ul className="mt-3 space-y-2">{row.points.map((point) => <li key={point} className="flex gap-2 text-xs leading-5 text-[#526a77]"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#4e735d]" /><span>{point}</span></li>)}</ul>
        </section>)}
      </div>
      <p className="rounded-md border border-[#e2e7ea] bg-[#f8fafb] p-4 text-xs leading-5 text-[#5d717d]">{copy.guideNote}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e4e8eb] pt-4 text-xs">
        <span className="font-semibold text-[#425762]">{copy.sources}:</span>
        <a href={PARVIS_GUIDE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0a4b72]">{copy.parvis}<ExternalLink className="size-3" /></a>
        <a href={READINESS_RULESET.sources[0]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0a4b72]">{copy.instrument}<ExternalLink className="size-3" /></a>
        <a href={READINESS_RULESET.sources[1]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0a4b72]">{copy.policy}<ExternalLink className="size-3" /></a>
      </div>
    </DialogContent>
  </Dialog>;
}

function QuestionLayout({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return <div><div className="mx-auto max-w-xl text-center"><h2 className="font-serif text-2xl font-semibold text-[#172e40]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#657783]">{body}</p></div><div className="mx-auto mt-7 max-w-xl">{children}</div></div>;
}

function FinancialQuestion({ title, body, note, children }: { title: string; body: string; note: string; children: React.ReactNode }) {
  return <QuestionLayout title={title} body={body}><p className="mb-4 rounded-md bg-[#eef4f7] px-3 py-2 text-center text-xs font-medium leading-5 text-[#4e6a79]">{note}</p>{children}</QuestionLayout>;
}

function LargeChoice({ active, onClick, icon, title, body }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; body: string }) {
  return <button type="button" role="radio" aria-checked={active} onClick={onClick} className={cn("flex min-h-32 flex-col items-start rounded-md border p-5 text-left transition", active ? "border-[#0a4b72] bg-[#eef4f7] shadow-sm" : "border-[#d9e1e5] bg-white hover:border-[#9eb2bd]")}><span className={cn("grid size-9 place-items-center rounded-md", active ? "bg-[#0a4b72] text-white" : "bg-[#eef2f4] text-[#476477]")}>{icon}</span><span className="mt-4 text-sm font-semibold text-[#203f52]">{title}</span><span className="mt-1 text-xs leading-5 text-[#6b7c86]">{body}</span></button>;
}

function AnswerGrid({ value, onChange, options }: { value?: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div className="grid gap-2" role="radiogroup">{options.map((option) => <button key={option.value} type="button" role="radio" aria-checked={value === option.value} onClick={() => onChange(option.value)} className={cn("flex min-h-12 items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm font-semibold transition", value === option.value ? "border-[#0a4b72] bg-[#eef4f7] text-[#173f57] shadow-sm" : "border-[#d6dfe4] bg-white text-[#526671] hover:border-[#9db0bb]")}><span>{option.label}</span><span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", value === option.value ? "border-[#0a4b72] bg-[#0a4b72] text-white" : "border-[#bdc9d0]")}>{value === option.value && <Check className="size-3" />}</span></button>)}</div>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("block", className)}><span className="mb-1.5 block text-xs font-semibold text-[#425762]">{label}</span>{children}</label>;
}

function Consent({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#dfe5e8] p-3"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-4 accent-[#0a2d46]" /><span className="text-xs leading-5 text-[#526671]">{label}</span></label>;
}
