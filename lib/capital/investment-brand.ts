import type { Lang } from "@/lib/i18n/dictionaries";

export const INVESTMENT_BASE_PATH = "/equity-market";

export const PARVIS_RELATIONSHIP = {
  brandName: "Parvis",
  legalName: "Parvis Investment Services Inc.",
  registrationCategory: "Exempt Market Dealer",
  nrdNumber: "74000",
  representativeName: "Jack Hunter",
  representativeCategory: "Dealing Representative",
  representativeJurisdiction: "Ontario",
  // Publish only exact language supplied by Parvis compliance.
  compensationDisclosure: { en: "", tr: "" } satisfies { tr: string; en: string },
} as const;

export const INVESTMENT_BRAND = {
  en: {
    name: "Hunter & Hunter Investment Advisors",
    primary: "Hunter & Hunter",
    descriptor: "Investment Advisors",
    poweredBy: "Powered by",
    // One-line surface disclosure. Everything else stays folded into the
    // `Disclosures` panel so no screen carries a wall of legal prose.
    registrationLine:
      "Jack Hunter, registered Dealing Representative at Parvis Investment Services Inc.",
    disclosuresToggle: "Disclosures",
    riskLine:
      "Targets are not guaranteed. Private-market investments carry risk, including loss of principal. Review the offering documents before investing.",
    legalLink: "Legal & privacy",
    microDisclosure:
      "Securities services through Parvis Investment Services Inc. · NRD #74000.",
    shortDisclosure:
      "Jack Hunter is registered in Ontario as a Dealing Representative with Parvis Investment Services Inc. Securities-related activities are conducted through and supervised by Parvis.",
    transactionalDisclosure:
      "Jack Hunter is registered in Ontario as a Dealing Representative with Parvis Investment Services Inc. Securities-related activities are conducted through and supervised by Parvis. Submitting information or recording interest does not establish eligibility or suitability and does not complete a transaction.",
    legalTitle: "Registration and relationship disclosure",
    legalParagraphs: [
      "Hunter & Hunter Investment Advisors is Jack Hunter’s Parvis-approved marketing and trade name. It provides investment education, opportunity information, account access, preliminary tools, and investor-relationship support.",
      "Parvis Investment Services Inc. (Parvis) is registered as an Exempt Market Dealer in each Canadian province (NRD #74000). Jack Hunter is registered in Ontario as a Dealing Representative with Parvis. All activities that require securities registration are conducted through and supervised by Parvis.",
      "Portal information, preliminary classifications, and interest records do not establish investor eligibility or suitability and are not an offer, prospectus, subscription, or completed transaction. Applicable offering documents govern each investment opportunity.",
      "Private-market securities can be speculative and illiquid and may result in the loss of the entire investment. Services are available only where permitted. Access by residents of Türkiye and any further activity are subject to separate jurisdictional and Parvis compliance review; no Turkish registration is represented or implied.",
    ],
    disclosuresLink: "Hunter registration and disclosures",
    parvisLink: "Parvis disclosures",
  },
  tr: {
    name: "Hunter & Hunter Investment Advisors",
    primary: "Hunter & Hunter",
    descriptor: "Investment Advisors",
    poweredBy: "Powered by",
    registrationLine:
      "Jack Hunter, Parvis Investment Services Inc. bünyesinde kayıtlı Dealing Representative.",
    disclosuresToggle: "Açıklamalar",
    riskLine:
      "Hedefler garanti değildir. Özel piyasa yatırımları, anapara kaybı dahil risk taşır. Yatırımdan önce ihraç belgelerini inceleyin.",
    legalLink: "Hukuki bilgiler ve gizlilik",
    microDisclosure:
      "Menkul kıymet hizmetleri Parvis Investment Services Inc. aracılığıyla sunulur · NRD No. 74000.",
    shortDisclosure:
      "Jack Hunter, Ontario’da Parvis Investment Services Inc. bünyesinde kayıtlı bir Dealing Representative olarak faaliyet göstermektedir. Menkul kıymetlere ilişkin kayıtlı faaliyetler Parvis aracılığıyla ve Parvis gözetiminde yürütülür.",
    transactionalDisclosure:
      "Jack Hunter, Ontario’da Parvis Investment Services Inc. bünyesinde kayıtlı bir Dealing Representative olarak faaliyet göstermektedir. Menkul kıymetlere ilişkin kayıtlı faaliyetler Parvis aracılığıyla ve Parvis gözetiminde yürütülür. Bilgi göndermek veya ilgi kaydı oluşturmak, yatırımcı uygunluğu ya da yerindeliğini kesinleştirmez ve bir işlemi tamamlamaz.",
    legalTitle: "Kayıt ve ilişki açıklaması",
    legalParagraphs: [
      "Hunter & Hunter Investment Advisors, Jack Hunter’ın Parvis tarafından onaylanan tanıtım ve ticari markasıdır. Yatırım eğitimi, fırsat bilgileri, hesap erişimi, ön değerlendirme araçları ve yatırımcı ilişkileri desteği sunar.",
      "Parvis Investment Services Inc. (Parvis), Kanada’nın tüm eyaletlerinde Exempt Market Dealer olarak kayıtlıdır (NRD No. 74000). Jack Hunter, Ontario’da Parvis bünyesinde kayıtlı bir Dealing Representative olarak faaliyet göstermektedir. Menkul kıymet kaydı gerektiren tüm faaliyetler Parvis aracılığıyla ve Parvis gözetiminde yürütülür.",
      "Portal bilgileri, ön sınıflandırmalar ve ilgi kayıtları yatırımcı uygunluğu veya yerindeliğini kesinleştirmez ve teklif, izahname, abonelik ya da tamamlanmış işlem niteliğinde değildir. Her yatırım fırsatında ilgili teklif belgeleri esas alınır.",
      "Özel piyasa menkul kıymetleri spekülatif ve likit olmayan yatırımlar olabilir ve sermayenin tamamının kaybına yol açabilir. Hizmetler yalnızca izin verilen yerlerde sunulur. Türkiye’de ikamet eden kişilerin erişimi ve sonraki tüm faaliyetleri ayrıca yetki alanı ve Parvis uyum incelemesine tabidir; herhangi bir Türkiye kaydı beyan veya ima edilmez.",
    ],
    disclosuresLink: "Hunter kayıt ve açıklamaları",
    parvisLink: "Parvis açıklamaları",
  },
} as const;

export function investmentBrandFor(lang: Lang) {
  return INVESTMENT_BRAND[lang === "tr" ? "tr" : "en"];
}
