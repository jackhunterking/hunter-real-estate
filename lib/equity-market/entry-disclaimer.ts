import { PARVIS_RELATIONSHIP } from "./investment-brand.ts";

/**
 * The acknowledgement a visitor sees once, on first entry to the Equity Market
 * advisory surface.
 *
 * What this is NOT, deliberately: an accredited-investor gate. Asking a stranger
 * to click "I am an accredited investor" produces a self-certification the dealer
 * never verified, and CSA guidance is explicit that exemption eligibility must
 * rest on the registrant's own verification rather than on a disclaimer. The real
 * eligibility and suitability work happens through Parvis; a door that pretends
 * to do it here would weaken the record, not strengthen it.
 *
 * What it IS: the registration, no-offer, no-advice, risk and jurisdiction
 * statements that must reach a reader before they browse private-market content,
 * plus a timestamped record that they were shown.
 *
 * Bump `ENTRY_DISCLAIMER_VERSION` whenever the wording changes — a stored
 * acknowledgement of an older version re-prompts, so nobody is bound by a
 * disclaimer they never read.
 */
export const ENTRY_DISCLAIMER_VERSION = 3;

/** localStorage key holding `{ version, acknowledgedAt }`. */
export const ENTRY_DISCLAIMER_STORAGE_KEY = "em.entry-disclaimer";

/** Where "Leave this site" sends someone who does not want to continue. */
export const ENTRY_DISCLAIMER_EXIT_URL = "https://jackhunter.com";

const { legalName, nrdNumber, registrationCategory, representativeName } =
  PARVIS_RELATIONSHIP;

export const ENTRY_DISCLAIMER = {
  en: {
    eyebrow: "Important information",
    title: "Before you continue",
    // Registration first: who is registered, in what category, supervised by
    // whom. The NRD number stays because it is the one fact a reader can
    // actually verify; everything else that used to sit here now lives behind
    // the disclosure link.
    paragraphs: [
      `Equity Market is the trade name of ${representativeName}, registered in Ontario as a Dealing Representative of ${legalName} (NRD #${nrdNumber}), an ${registrationCategory}. Securities activity is carried out through and supervised by Parvis, and only where Parvis is registered.`,
      "This site is for information and education. It is not an offer or a prospectus, and it is not investment, legal, or tax advice. Browsing it does not establish your eligibility or suitability and does not complete a transaction.",
      "Private-market securities are speculative and illiquid. You may lose some or all of your investment, and targets are not guaranteed.",
    ],
    acknowledge: "I understand",
    leave: "Leave this site",
    legalLink: "Read the full registration and relationship disclosure",
    ariaLabel: "Important information before continuing",
  },
  tr: {
    eyebrow: "Önemli bilgilendirme",
    title: "Devam etmeden önce",
    paragraphs: [
      `Equity Market, ${representativeName}'ın ticari adıdır. ${representativeName}, Ontario'da ${legalName} (NRD No. ${nrdNumber}) bünyesinde kayıtlı bir Dealing Representative'tir; Parvis bir Exempt Market Dealer olarak kayıtlıdır. Menkul kıymet faaliyetleri Parvis aracılığıyla, Parvis gözetiminde ve yalnızca Parvis'in kayıtlı olduğu yerlerde yürütülür.`,
      "Bu site bilgilendirme ve eğitim amaçlıdır. Bir teklif ya da izahname değildir; yatırım, hukuk veya vergi danışmanlığı niteliği taşımaz. Siteyi görüntülemek uygunluğunuzu ya da yerindeliğinizi kesinleştirmez ve bir işlemi tamamlamaz.",
      "Özel piyasa menkul kıymetleri spekülatif ve likit değildir. Yatırımınızın bir kısmını veya tamamını kaybedebilirsiniz ve hedefler garanti edilmez.",
    ],
    acknowledge: "Anladım",
    leave: "Siteden ayrıl",
    legalLink: "Kayıt ve ilişki açıklamasının tamamını okuyun",
    ariaLabel: "Devam etmeden önce önemli bilgilendirme",
  },
} as const;

/**
 * French and Spanish intentionally fall back to English, matching
 * `investmentBrandFor`. Regulated wording is not machine-translated into a
 * market before compliance has reviewed it in that language.
 */
export function entryDisclaimerFor(lang: string) {
  return ENTRY_DISCLAIMER[lang === "tr" ? "tr" : "en"];
}
