import { PARVIS_RELATIONSHIP } from "./investment-brand.ts";

/**
 * The acknowledgement a visitor sees once, on first entry to the Hunter & Hunter
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
export const ENTRY_DISCLAIMER_VERSION = 1;

/** localStorage key holding `{ version, acknowledgedAt }`. */
export const ENTRY_DISCLAIMER_STORAGE_KEY = "hnc.entry-disclaimer";

/** Where "Leave this site" sends someone who does not want to continue. */
export const ENTRY_DISCLAIMER_EXIT_URL = "https://jackhunter.com";

const { legalName, nrdNumber, registrationCategory, representativeName } =
  PARVIS_RELATIONSHIP;

export const ENTRY_DISCLAIMER = {
  en: {
    eyebrow: "Important information",
    title: "Before you continue",
    // Registration first: who is registered, in what category, supervised by whom.
    paragraphs: [
      `Hunter & Hunter Investment Advisors is the Parvis-approved trade name used by ${representativeName}, who is registered in Ontario as a Dealing Representative of ${legalName} (NRD #${nrdNumber}), an ${registrationCategory}. Every activity that requires securities registration is carried out through and supervised by Parvis.`,
      "The information on this site is provided for information and education. It is not an offer to sell or a solicitation of an offer to buy any security, it is not a prospectus, and it is not investment, legal, or tax advice. Nothing here is tailored to your circumstances.",
      "Browsing this site, reading an investment page, or recording interest does not establish your eligibility or suitability and does not complete a transaction. Any investment proceeds only under the applicable offering documents, after review through Parvis.",
      "Private-market securities are speculative and illiquid, and you may lose some or all of your investment. Targets and projected returns are not guaranteed and are not a forecast.",
      "Securities services are offered only where Parvis is registered. This site is not directed at any person in a jurisdiction where its publication or availability would be contrary to local law.",
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
      `Hunter & Hunter Investment Advisors, ${representativeName} tarafından kullanılan ve Parvis tarafından onaylanmış ticari addır. ${representativeName}, Ontario'da ${legalName} (NRD No. ${nrdNumber}) bünyesinde kayıtlı bir Dealing Representative'tir; Parvis bir Exempt Market Dealer olarak kayıtlıdır. Menkul kıymet kaydı gerektiren tüm faaliyetler Parvis aracılığıyla ve Parvis gözetiminde yürütülür.`,
      "Bu sitedeki bilgiler bilgilendirme ve eğitim amaçlıdır. Herhangi bir menkul kıymetin satışına yönelik bir teklif veya alım teklifi daveti değildir, izahname değildir ve yatırım, hukuk ya da vergi danışmanlığı niteliği taşımaz. Buradaki hiçbir içerik kişisel durumunuza göre hazırlanmamıştır.",
      "Bu siteyi görüntülemek, bir yatırım sayfasını okumak veya ilgi kaydı oluşturmak; uygunluğunuzu ya da yerindeliğinizi kesinleştirmez ve bir işlemi tamamlamaz. Her yatırım yalnızca ilgili teklif belgeleri kapsamında ve Parvis incelemesinin ardından gerçekleşir.",
      "Özel piyasa menkul kıymetleri spekülatif ve likit değildir; yatırımınızın bir kısmını veya tamamını kaybedebilirsiniz. Hedefler ve öngörülen getiriler garanti edilmez ve bir tahmin niteliği taşımaz.",
      "Menkul kıymet hizmetleri yalnızca Parvis'in kayıtlı olduğu yerlerde sunulur. Bu site, yayımlanmasının veya erişilebilir olmasının yerel mevzuata aykırı olacağı bir yetki alanındaki kişilere yönelik değildir.",
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
