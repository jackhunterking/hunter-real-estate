/**
 * Legal page content, Privacy Policy, Terms of Use, Advertising Disclosure.
 *
 * Ported and rebranded from the Kredibaba source and approved for launch.
 * Kept here, isolated, so regulated copy is easy to audit.
 */

export const LEGAL_LAST_MODIFIED = "2026-06-08";

export const LEGAL_CONTACT = {
  privacyEmail: "jack@jackhunter.com",
  complaintsEmail: "jack@jackhunter.com",
  legalEmail: "jack@jackhunter.com",
};

export const LEGAL_SLUGS = {
  privacy: "gizlilik",
  terms: "kullanim-kosullari",
  advertising: "reklam-aciklamasi",
} as const;

export type LegalKey = keyof typeof LEGAL_SLUGS;

export type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "contact"; name: string; lines: string[] };

export interface LegalSection {
  heading: string;
  blocks: Block[];
}

export interface LegalLink {
  href: string;
  label: string;
}

export interface LegalDoc {
  metaTitle: string;
  eyebrow: string;
  title: string;
  lastModifiedLabel: string;
  intro?: string;
  sections: LegalSection[];
  seeAlsoLabel: string;
  seeAlso: LegalLink[];
}

const p = (text: string): Block => ({ kind: "p", text });
const ul = (items: string[]): Block => ({ kind: "ul", items });

const LIC =
  "Real Mortgage Associates Brokerage Licence #10464 · Jack Hunter FSRA Lisans No: M26001258";
const LIC_EN =
  "Real Mortgage Associates Brokerage Licence #10464 · Jack Hunter FSRA Licence #M26001258";

const href = {
  privacy: `/${LEGAL_SLUGS.privacy}`,
  terms: `/${LEGAL_SLUGS.terms}`,
  advertising: `/${LEGAL_SLUGS.advertising}`,
};


const tr: Record<LegalKey, LegalDoc> = {
  privacy: {
    metaTitle: "Gizlilik Politikası · Real Mortgage Associates",
    eyebrow: "Yasal",
    title: "Gizlilik Politikası",
    lastModifiedLabel: "Son güncelleme",
    sections: [
      {
        heading: "Giriş",
        blocks: [
          p("Mortgage hizmetleri, Ontario'da lisanslı bir mortgage brokerage olan Real Mortgage Associates (birlikte “biz”, “bize” veya “bizim”) bünyesinde sunulur. Bu Gizlilik Politikası, mortgage danışmanlık hizmetlerimizi kullandığınızda kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı, paylaştığımızı ve koruduğumuzu açıklar."),
          p("WhatsApp, telefon, e-posta veya başka bir kanal aracılığıyla bizimle iletişime geçtiğinizde, bilgilerinizin bu Politikada açıklandığı şekilde toplanmasını ve kullanılmasını kabul etmiş olursunuz. Bu Politika, Kullanım Koşullarımızla birlikte geçerlidir."),
          p(`Kişisel Bilgilerin Korunması ve Elektronik Belgeler Yasası (PIPEDA) ile geçerli Ontario gizlilik gerekliliklerine uyarız. ${LIC}.`),
        ],
      },
      {
        heading: "Topladığımız Kişisel Bilgiler",
        blocks: [
          p("Aşağıdaki kişisel bilgi kategorilerini toplayabiliriz:"),
          ul([
            "Kimlik bilgileri: ad soyad, tercih edilen dil ve iletişim tercihleri.",
            "İletişim bilgileri: e-posta adresi, telefon numarası (WhatsApp tercih edilir) ve posta adresi.",
            "Finansal bilgiler: yıllık hane geliri aralığı, peşinat tutarı, istihdam türü ve yaklaşık kredi profili.",
            "Mülk bilgileri: yaklaşık mülk değeri, konum (şehir/bölge) ve mülkün kullanım amacı.",
            "Görüşme bilgileri: mortgage hedefleriniz, zamanlama, belgeler ve doğru yolu belirlememiz için paylaşmayı seçtiğiniz diğer ayrıntılar.",
          ]),
          p("Bu bilgileri doğrudan sizden, WhatsApp, e-posta veya telefon yoluyla bizimle iletişime geçtiğinizde toplarız."),
        ],
      },
      {
        heading: "Bilgilerinizi Nasıl Kullanırız",
        blocks: [
          p("Kişisel bilgilerinizi şu amaçlarla kullanırız:"),
          ul([
            "Mortgage durumunuzu değerlendirmek ve uygun sonraki adımları, ürünleri veya lender'ları belirlemek.",
            "Açık onayınızla, adınıza bir mortgage başvurusu hazırlamak ve sunmak.",
            "Dosyanız, sonraki adımlar ve gerekli belgeler hakkında sizinle iletişim kurmak.",
            "Ontario ve federal yasalar kapsamındaki yasal, düzenleyici ve lender gerekliliklerine uymak.",
            "Hizmetimizi geliştirmek ve müşterilerin araçlarımızla nasıl etkileşim kurduğunu anlamak.",
          ]),
          p("Kişisel bilgilerinizi, açık onayınız olmadan ilgisiz pazarlama amaçlarıyla kullanmayız. Pazarlama iletişimleri opt-in onay gerektirir ve istediğiniz zaman geri çekilebilir."),
        ],
      },
      {
        heading: "Üçüncü Taraflara Açıklama",
        blocks: [
          p("Kişisel bilgilerinizi yalnızca talep ettiğiniz hizmetleri yerine getirmek için gerekli olduğu ölçüde üçüncü taraflarla paylaşabiliriz:"),
          ul([
            "Lender'lar ve finans kuruluşları: adınıza bir mortgage başvurusu sunarken veya görüşürken.",
            "Mortgage sigortacıları (ör. CMHC, Sagen, Canada Guaranty): dosyanız için geçerli olduğunda.",
            "Operasyonlarımızı destekleyen hizmet sağlayıcılar (ör. CRM, analitik): gizlilik yükümlülüklerine tabi ve yalnızca belirtilen amaçlarla.",
            "Düzenleyici kurumlar: yasaların gerektirdiği durumlarda veya FSRA uyum yükümlülüklerimizin bir parçası olarak.",
          ]),
          p("Kişisel bilgilerinizi üçüncü taraflara satmayız. Verilerinizi bilginiz ve onayınız olmadan lender veya sigortacılarla paylaşmayız."),
        ],
      },
      {
        heading: "Çerezler ve Web Sitesi Analitiği",
        blocks: [
          p("Web sitemiz, ziyaretçilerin sayfalarımızla nasıl etkileşime girdiğini anlamak için çerezler ve benzeri teknolojiler kullanabilir. Bu şunları içerebilir:"),
          ul([
            "Sitenin doğru çalışmasına yardımcı olan oturum çerezleri.",
            "Sayfa görüntüleme ve oturum süresi gibi toplu kullanım verilerini izleyen analitik araçlar (ör. Google Analytics).",
            "Çerezler aracılığıyla hiçbir kişisel finansal veri iletilmez.",
          ]),
          p("Çerezleri tarayıcı ayarlarınızdan devre dışı bırakabilirsiniz; ancak bazı site özellikleri amaçlandığı gibi çalışmayabilir."),
        ],
      },
      {
        heading: "Veri Saklama",
        blocks: [
          p("Kişisel bilgilerinizi yalnızca şu amaçlar için gerekli olduğu sürece saklarız:"),
          ul([
            "Toplandığı amacı yerine getirmek.",
            "Yasal, düzenleyici veya lender kayıt tutma gerekliliklerine uymak.",
            "Anlaşmazlıkları çözmek veya dolandırıcılığı önlemek.",
          ]),
          p("Bilgileriniz artık gerekmediğinde güvenli şekilde silinir veya anonimleştirilir."),
        ],
      },
      {
        heading: "Güvenlik Önlemleri",
        blocks: [
          p("Kişisel bilgilerinizin güvenliğini ciddiye alırız. Önlemlerimiz erişim kontrolleri, aktarım sırasında şifreleme ve kişisel verilere yalnızca gerektiği kadar erişim içerir."),
          p("Ancak hiçbir internet aktarımı veya elektronik depolama sistemi tamamen güvenli olduğu garanti edilemez. Bilgilerinizin tehlikeye girdiğini düşünüyorsanız, lütfen derhal bizimle iletişime geçin."),
        ],
      },
      {
        heading: "Haklarınız",
        blocks: [
          p("PIPEDA kapsamında şu haklara sahipsiniz:"),
          ul([
            "Hakkınızda tuttuğumuz kişisel bilgilere erişmek.",
            "Bilgiler yanlış veya eksikse düzeltilmesini talep etmek.",
            "Bilgilerinizin toplanması veya kullanılmasına ilişkin onayınızı geri çekmek (yasal veya sözleşmesel sınırlara tabi).",
            "Bilgilerinizin nasıl kullanıldığını ve kiminle paylaşıldığını sormak.",
          ]),
          p("Bu haklardan herhangi birini kullanmak için lütfen Gizlilik Sorumlumuzla iletişime geçin (aşağıya bakın). 30 gün içinde yanıt veririz. Yanıtımızdan memnun kalmazsanız, Kanada Gizlilik Komiserliği'ne 1-800-282-1376 numarasından veya www.priv.gc.ca adresinden ulaşabilirsiniz."),
        ],
      },
      {
        heading: "İletişim, Gizlilik Sorumlusu",
        blocks: [
          p("Gizliliğinizle ilgili sorularınız, endişeleriniz veya talepleriniz için lütfen iletişime geçin:"),
          {
            kind: "contact",
            name: "Gizlilik Sorumlusu, Real Mortgage Associates",
            lines: [
              `E-posta: ${LEGAL_CONTACT.privacyEmail}`,
              `Mortgage şikâyetleri: ${LEGAL_CONTACT.complaintsEmail}`,
            ],
          },
        ],
      },
      {
        heading: "Bu Politikadaki Değişiklikler",
        blocks: [
          p("Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Değişiklikler, güncellenmiş bir “Son güncelleme” tarihiyle bu sayfada yayınlanır. Bir değişiklik yayınlandıktan sonra hizmetlerimizi kullanmaya devam etmeniz, revize edilmiş Politikayı kabul ettiğiniz anlamına gelir."),
        ],
      },
    ],
    seeAlsoLabel: "Ayrıca bakınız",
    seeAlso: [
      { href: href.advertising, label: "Reklam Açıklaması" },
      { href: href.terms, label: "Kullanım Koşulları" },
    ],
  },

  terms: {
    metaTitle: "Kullanım Koşulları · Real Mortgage Associates",
    eyebrow: "Yasal",
    title: "Kullanım Koşulları",
    lastModifiedLabel: "Son güncelleme",
    sections: [
      {
        heading: "Koşulların Kabulü",
        blocks: [
          p("Mortgage danışmanlık hizmetlerimizden herhangi birini kullanarak bu Kullanım Koşullarına bağlı kalmayı kabul edersiniz. Kabul etmiyorsanız lütfen hizmetlerimizi kullanmayın."),
          p("Bu Koşullar, sitemize masaüstü veya mobil cihazdan erişseniz de geçerlidir. Hizmetlerimizi kullanarak, referans yoluyla buraya dahil edilen Gizlilik Politikamızı da kabul edersiniz."),
        ],
      },
      {
        heading: "Real Mortgage Associates Hakkında",
        blocks: [
          p(`Mortgage hizmetleri, Ontario'da Finansal Hizmetler Düzenleme Kurumu (FSRA) yetkisi altında faaliyet gösteren lisanslı bir mortgage brokerage olan Real Mortgage Associates bünyesinde sunulur. ${LIC}.`),
          p("Kanadalılara, özellikle Türk topluluğuna, mortgage seçeneklerini anlamaları, dosyalarını hazırlamaları ve uygun lender'larla buluşmaları için Türkçe ve İngilizce bir mortgage danışmanlık deneyimi sunarız. Bir lender, banka veya sigortacı değiliz."),
        ],
      },
      {
        heading: "Uygunluk",
        blocks: [
          p("Mortgage hizmetlerimizi kullanmak için en az 18 yaşında ve Ontario sakini olmalısınız. Sitemizi kullanarak veya mortgage rehberliği için bizimle iletişime geçerek bu gereklilikleri karşıladığınızı beyan edersiniz."),
        ],
      },
      {
        heading: "Sitenin Bilgilendirme Amaçlı Niteliği",
        blocks: [
          p("Bu web sitesindeki içerik, mortgage açıklamaları, araçlar, makaleler ve rehberler dahil, yalnızca genel bilgilendirme ve eğitim amaçlıdır. Şunları oluşturmaz:"),
          ul([
            "Kredi onayı veya ön onay garantisi.",
            "Oran kilidi veya lender taahhüdü.",
            "Finansal, hukuki veya vergi danışmanlığı.",
          ]),
          p("Bu sitedeki hiçbir şey, kişiselleştirilmiş profesyonel danışmanlık almanın yerine geçmez. Nihai oranlar, ürün uygunluğu ve onay, lender'lar tarafından tam dosyanıza göre belirlenir."),
        ],
      },
      {
        heading: "Mortgage Seçenekleri ve Nihai Fiyatlama",
        blocks: [
          p("Bu site güncel, örnek veya garanti edilmiş mortgage fiyatlaması yayımlamaz. Ürün seçenekleri ve nihai fiyatlama, lender'ın dosyanızı tam olarak incelemesinden ve yazılı taahhüt vermesinden sonra netleşir."),
          p("Nihai sonuç; gelir, kredi geçmişi, mevcut borçlar, mülk ayrıntıları, peşinat, kullanım amacı, lender koşulları ve geçerli mortgage sigortası gerekliliklerine bağlıdır."),
        ],
      },
      {
        heading: "Verdiğiniz Bilgilerin Doğruluğu",
        blocks: [
          p("WhatsApp, telefon, e-posta veya başka bir kanal aracılığıyla bilgi verdiğinizde, tüm bilgilerin bildiğiniz kadarıyla doğru, gerçek, güncel ve eksiksiz olduğunu beyan ve garanti edersiniz. Bir mortgage başvurusuyla bağlantılı olarak yanlış veya yanıltıcı bilgi vermek dolandırıcılık teşkil edebilir ve ilgili kurumlara ve lender'lara bildirilebilir."),
        ],
      },
      {
        heading: "Ücret Açıklaması",
        blocks: [
          p("Real Mortgage Associates, mortgage'lar fonlandığında lender'lar tarafından ödenen komisyonlarla ücretlendirilir. Bu ücretlendirme, ödediğiniz oranı veya maliyeti artırmaz, lender'lar oranlarını broker ücretinden bağımsız olarak belirler."),
          p("Borçluya bir ücretin uygulanabileceği durumlarda, herhangi bir taahhüt veya sözleşme imzalamadan önce yazılı olarak ve sade bir dille açıklanır."),
        ],
      },
      {
        heading: "Üçüncü Taraf Lender'lar ve Hizmetler",
        blocks: [
          p("Bu sitede bir lender teklifinin veya ürününün sunulması, o lender'ın tavsiye edildiği veya onaylandığı anlamına gelmez. Tüm mortgage başvuruları, sizin tarafınızdan bir teklif olarak lender'lara sunulur; nihai kredi kararını Real Mortgage Associates değil, lender verir."),
          p("Üçüncü taraf web sitelerine bağlantılar yalnızca kolaylık için sağlanır. Herhangi bir üçüncü taraf sitenin içeriğinden, doğruluğundan veya gizlilik uygulamalarından sorumlu değiliz."),
        ],
      },
      {
        heading: "İzin Verilen Kullanım",
        blocks: [
          p("Aşağıdakileri yapmamayı kabul edersiniz:"),
          ul([
            "Web sitemize veya hizmetlerimize erişmek için otomatik botlar, kazıyıcılar veya komut dosyaları kullanmak.",
            "Kimliğinizi yanlış beyan etmek veya başka biri gibi davranmak.",
            "İçeriğimizi yazılı izin olmadan çoğaltmak, dağıtmak veya ticari olarak kullanmak.",
            "Hizmetlerimizi yasa dışı bir amaçla veya geçerli yasaları ihlal ederek kullanmak.",
            "Sistemlerimize veya verilerimize yetkisiz erişim sağlamaya çalışmak.",
          ]),
        ],
      },
      {
        heading: "Fikri Mülkiyet",
        blocks: [
          p("Bu web sitesindeki tüm içerik, metin, grafikler, logolar ve araçlar dahil, Real Mortgage Associates'ın mülkiyetindedir ve geçerli fikri mülkiyet yasalarıyla korunmaktadır. Bu sitedeki hiçbir şey, önceden yazılı izin olmadan fikri mülkiyetimizi kullanma lisansı vermez."),
        ],
      },
      {
        heading: "Sorumluluğun Sınırlandırılması",
        blocks: [
          p("Geçerli yasaların izin verdiği azami ölçüde, Real Mortgage Associates bu web sitesini veya hizmetlerimizi kullanmanızdan (veya kullanamamanızdan) kaynaklanan dolaylı, arızi, özel veya sonuçsal zararlardan, burada sağlanan araçlara veya genel bilgilere güvenmek dahil, sorumlu olmayacaktır."),
          p("Hizmetlerimiz “olduğu gibi” ve “mevcut olduğu şekliyle” sağlanır. Bu sitedeki herhangi bir içeriğin doğruluğu, eksiksizliği veya amaca uygunluğu konusunda açık veya zımni hiçbir garanti vermeyiz."),
        ],
      },
      {
        heading: "Kullanıcı Hesabı Yok",
        blocks: [
          p("Mevcut kamuya açık deneyim, bir kullanıcı hesabı veya panel sunmaz. Mortgage rehberliği doğrudan WhatsApp, telefon, e-posta veya üzerinde anlaşılan diğer iletişim kanalları aracılığıyla yürütülür."),
        ],
      },
      {
        heading: "Geçerli Hukuk ve Yargı Yetkisi",
        blocks: [
          p("Bu Kullanım Koşulları, Ontario Eyaleti yasaları ve Kanada'nın geçerli federal yasalarıyla yönetilir. Bu Koşullardan kaynaklanan herhangi bir anlaşmazlık, Ontario mahkemelerinin münhasır yargı yetkisine tabi olacaktır."),
        ],
      },
      {
        heading: "Bu Koşullardaki Değişiklikler",
        blocks: [
          p("Bu Kullanım Koşullarını, bu sayfada revize edilmiş bir sürüm yayınlayarak istediğimiz zaman güncelleyebiliriz. Herhangi bir güncellemenin ardından hizmetlerimizi kullanmaya devam etmeniz, revize edilmiş Koşulları kabul ettiğiniz anlamına gelir. Sayfanın üst kısmındaki “Son güncelleme” tarihi, Koşulların en son ne zaman güncellendiğini gösterir."),
        ],
      },
      {
        heading: "Bize Ulaşın",
        blocks: [
          p("Bu Koşullar hakkında sorularınız varsa lütfen şu adresten bize ulaşın:"),
          {
            kind: "contact",
            name: "Real Mortgage Associates",
            lines: [`E-posta: ${LEGAL_CONTACT.legalEmail}`],
          },
        ],
      },
    ],
    seeAlsoLabel: "Ayrıca bakınız",
    seeAlso: [
      { href: href.advertising, label: "Reklam Açıklaması" },
      { href: href.privacy, label: "Gizlilik Politikası" },
    ],
  },

  advertising: {
    metaTitle: "Reklam Açıklaması · Real Mortgage Associates",
    eyebrow: "Yasal",
    title: "Reklam Açıklaması",
    lastModifiedLabel: "Son güncelleme",
    sections: [
      {
        heading: "Real Mortgage Associates Hizmeti",
        blocks: [
          p(`Mortgage hizmetleri, Ontario'da faaliyet gösteren lisanslı bir mortgage brokerage olan Real Mortgage Associates bünyesinde sunulur. Mortgage aracılık hizmetleri, Ontario Finansal Hizmetler Düzenleme Kurumu (FSRA) tarafından düzenlenir. ${LIC}.`),
          p("Real Mortgage Associates, mortgage'lar fonlandığında lender'lardan komisyon alabilir. Bu komisyonlar lender tarafından ödenir, sizin tarafınızdan değil. Borçluya herhangi bir ücretin uygulandığı durumlarda, herhangi bir taahhüt imzalamadan önce yazılı ve sade bir dille açıklanır."),
        ],
      },
      {
        heading: "Mortgage Seçenekleri Sorumluluk Reddi",
        blocks: [
          p("Bu site güncel, örnek, tarihi veya kişiye özel mortgage oranları yayımlamaz. Eğitim içeriği bir oran garantisi, kredi onayı veya lender taahhüdü oluşturmaz."),
          ul([
            "Nihai fiyatlama, başvuru aşamasında toplanan ek bilgiler ve lender'ın geçerli ürün koşullarına bağlıdır.",
            "Gelir, mevcut borçlar, kredi geçmişi, peşinat ve mülk ayrıntıları değerlendirmenin parçasıdır.",
            "Konut sigortası, emlak vergisi, yasal masraflar ve diğer maliyetler ayrıca değerlendirilir.",
            "Piyasadaki her lender ürünü veya teklif bu sitede temsil edilmez.",
            "Tüm mortgage ürünlerinin gelir, borç servis oranları, kredi skoru, mülk değeri ve mülk türü dahil belirli uygunluk kriterleri vardır.",
          ]),
          p("Nihai oranlar ve onay; gelir, kredi geçmişi, mülk ayrıntıları, peşinat ve lender koşullarına göre belirlenir ve yazılı bir taahhütte belgelenir."),
          p("Tüm ayrıntılar için lütfen Kullanım Koşullarımıza bakın."),
        ],
      },
      {
        heading: "Gizlilik Sorumluluk Reddi",
        blocks: [
          p("Real Mortgage Associates ile WhatsApp, telefon, e-posta veya başka bir kanal aracılığıyla etkileşime girdiğinizde; mortgage rehberliği sağlamak ve dosyanızı uygun lender'larla buluşturmak için adınızı, iletişim bilgilerinizi, finansal bilgilerinizi ve mülk ayrıntılarınızı toplayabiliriz."),
          p("Kişisel verileriniz, Kişisel Bilgilerin Korunması ve Elektronik Belgeler Yasası (PIPEDA) ve geçerli Ontario gizlilik gerekliliklerine uygun olarak işlenir. Bilgilerinizin kullanımını toplama anında belirtilen amaçlarla sınırlandırır, yalnızca gerekli olduğu sürece saklar ve uygun önlemlerle koruruz."),
          p("Verilerinizin nasıl toplandığı, kullanıldığı ve korunduğuna ilişkin tüm ayrıntılar için lütfen Gizlilik Politikamıza bakın."),
        ],
      },
      {
        heading: "Sorularınız mı var?",
        blocks: [
          p(`Bu açıklamayla ilgili sorularınız varsa ${LEGAL_CONTACT.privacyEmail} adresinden bizimle iletişime geçebilirsiniz. Ayrıca Gizlilik Politikamızı ve Kullanım Koşullarımızı inceleyebilirsiniz.`),
        ],
      },
    ],
    seeAlsoLabel: "Ayrıca bakınız",
    seeAlso: [
      { href: href.privacy, label: "Gizlilik Politikası" },
      { href: href.terms, label: "Kullanım Koşulları" },
    ],
  },
};


const en: Record<LegalKey, LegalDoc> = {
  privacy: {
    metaTitle: "Privacy Policy · Real Mortgage Associates",
    eyebrow: "Legal",
    title: "Privacy Policy",
    lastModifiedLabel: "Last modified",
    sections: [
      {
        heading: "Introduction",
        blocks: [
          p("Mortgage services are offered through Real Mortgage Associates (collectively, “we”, “us”, or “our”), a licensed mortgage brokerage in Ontario. This Privacy Policy describes how we collect, use, disclose, and protect personal information when you use our mortgage advisory services."),
          p("By contacting us through WhatsApp, phone, email, or another channel, you consent to the collection and use of your information as described in this Policy. This Policy works alongside our Terms of Use."),
          p(`We comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable Ontario privacy requirements. ${LIC_EN}.`),
        ],
      },
      {
        heading: "Personal Information We Collect",
        blocks: [
          p("We may collect the following categories of personal information:"),
          ul([
            "Identity information: full name, preferred language, and communication preferences.",
            "Contact information: email address, phone number (WhatsApp preferred), and mailing address.",
            "Financial information: annual household income range, down payment amount, employment type, and approximate credit profile.",
            "Property information: approximate property value, location (city/region), and intended property use.",
            "Intake information: mortgage goals, timing, documents, and other details you choose to share so we can identify the right mortgage path.",
          ]),
          p("We collect this information directly from you when you contact us via WhatsApp, email, or phone, or otherwise interact with our services."),
        ],
      },
      {
        heading: "How We Use Your Information",
        blocks: [
          p("We use your personal information to:"),
          ul([
            "Assess your mortgage situation and identify suitable next steps, products, or lenders.",
            "Prepare and submit a mortgage application on your behalf (with your explicit consent).",
            "Communicate with you about your file, next steps, and any required documents.",
            "Comply with legal, regulatory, and lender requirements under Ontario and federal law.",
            "Improve our service and understand how clients interact with our tools and content.",
          ]),
          p("We will not use your personal information for unrelated marketing purposes without your explicit consent. Any marketing communications require opt-in consent and can be withdrawn at any time."),
        ],
      },
      {
        heading: "Disclosure to Third Parties",
        blocks: [
          p("We may share your personal information with third parties only as necessary to fulfil the services you requested:"),
          ul([
            "Lenders and financial institutions: when submitting or discussing a mortgage application on your behalf.",
            "Mortgage insurers (e.g., CMHC, Sagen, Canada Guaranty): when applicable to your file.",
            "Service providers who support our operations (e.g., CRM, analytics): subject to confidentiality obligations and only for the stated purposes.",
            "Regulatory authorities: where required by law or as part of our FSRA compliance obligations.",
          ]),
          p("We do not sell your personal information to third parties. We do not share your data with lenders or insurers without your knowledge and consent."),
        ],
      },
      {
        heading: "Cookies & Website Analytics",
        blocks: [
          p("Our website may use cookies and similar tracking technologies to understand how visitors interact with our pages and tools. This may include:"),
          ul([
            "Session cookies that help the site function correctly.",
            "Analytics tools (e.g., Google Analytics) that track aggregate usage data such as page views and session duration.",
            "No personal financial data is transmitted through cookies.",
          ]),
          p("You may disable cookies in your browser settings, though some site features may not function as intended."),
        ],
      },
      {
        heading: "Data Retention",
        blocks: [
          p("We retain your personal information only as long as necessary to:"),
          ul([
            "Fulfil the purpose for which it was collected.",
            "Comply with legal, regulatory, or lender record-keeping requirements.",
            "Resolve disputes or prevent fraud.",
          ]),
          p("When your information is no longer required, it is securely deleted or anonymized."),
        ],
      },
      {
        heading: "Security Safeguards",
        blocks: [
          p("We take the security of your personal information seriously. Our safeguards include access controls, encryption for data in transit, and restricted access to personal data on a need-to-know basis."),
          p("However, no internet transmission or electronic storage system can be guaranteed to be completely secure. If you believe your information has been compromised, please contact us immediately."),
        ],
      },
      {
        heading: "Your Rights",
        blocks: [
          p("Under PIPEDA, you have the right to:"),
          ul([
            "Access the personal information we hold about you.",
            "Request a correction if the information is inaccurate or incomplete.",
            "Withdraw consent to the collection or use of your information (subject to legal or contractual limits).",
            "Ask how your information is being used and with whom it has been shared.",
          ]),
          p("To exercise any of these rights, please contact our Privacy Officer (see below). We will respond within 30 days. If you are unsatisfied with our response, you may contact the Office of the Privacy Commissioner of Canada at 1-800-282-1376 or www.priv.gc.ca."),
        ],
      },
      {
        heading: "Contact, Privacy Officer",
        blocks: [
          p("If you have questions, concerns, or requests related to your privacy, please contact:"),
          {
            kind: "contact",
            name: "Privacy Officer, Real Mortgage Associates",
            lines: [
              `Email: ${LEGAL_CONTACT.privacyEmail}`,
              `Mortgage complaints: ${LEGAL_CONTACT.complaintsEmail}`,
            ],
          },
        ],
      },
      {
        heading: "Changes to This Policy",
        blocks: [
          p("We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated “Last Modified” date. Continued use of our services after a change is posted constitutes your acceptance of the revised Policy."),
        ],
      },
    ],
    seeAlsoLabel: "See also",
    seeAlso: [
      { href: href.advertising, label: "Advertising Disclosure" },
      { href: href.terms, label: "Terms of Use" },
    ],
  },

  terms: {
    metaTitle: "Terms of Use · Real Mortgage Associates",
    eyebrow: "Legal",
    title: "Terms of Use",
    lastModifiedLabel: "Last modified",
    sections: [
      {
        heading: "Acceptance of Terms",
        blocks: [
          p("By using any of our mortgage advisory services, you agree to be bound by these Terms of Use. If you do not agree, please do not use our services."),
          p("These Terms apply to you whether you access our site on a desktop or mobile device. By using our services, you also agree to our Privacy Policy, which is incorporated herein by reference."),
        ],
      },
      {
        heading: "About Real Mortgage Associates",
        blocks: [
          p(`Mortgage services are offered through Real Mortgage Associates, a licensed mortgage brokerage operating in Ontario under the authority of the Financial Services Regulatory Authority of Ontario (FSRA). ${LIC_EN}.`),
          p("We provide a bilingual (Turkish and English) mortgage advisory experience to help Canadians, particularly members of the Turkish community, understand their mortgage options, prepare their files, and connect with suitable lenders. We are not a lender, a bank, or an insurer."),
        ],
      },
      {
        heading: "Eligibility",
        blocks: [
          p("You must be at least 18 years of age and a resident of Ontario to use our mortgage services. By using our site or contacting us for mortgage guidance, you represent that you meet these requirements."),
        ],
      },
      {
        heading: "Informational Nature of This Site",
        blocks: [
          p("The content on this website, including mortgage explanations, tools, articles, and guides, is provided for general informational and educational purposes only. It does not constitute:"),
          ul([
            "A credit approval or pre-approval guarantee.",
            "A rate lock or lender commitment.",
            "Financial, legal, or tax advice.",
          ]),
          p("Nothing on this site should be relied upon as a substitute for obtaining personalized professional advice. Final rates, product eligibility, and approval are determined by lenders based on your complete file."),
        ],
      },
      {
        heading: "Mortgage Options and Final Pricing",
        blocks: [
          p("This site does not publish current, sample, or guaranteed mortgage pricing. Product options and final pricing are determined after a lender reviews your complete file and issues a written commitment."),
          p("The final result depends on income, credit history, existing debt, property details, down payment, intended use, lender conditions, and applicable mortgage insurance requirements."),
        ],
      },
      {
        heading: "Accuracy of Information You Provide",
        blocks: [
          p("When you provide information through WhatsApp, phone, email, or any other service channel, you represent and warrant that all information is accurate, truthful, current, and complete to the best of your knowledge. Providing false or misleading information in connection with a mortgage application may constitute fraud and may be reported to the relevant authorities and lenders."),
        ],
      },
      {
        heading: "Compensation Disclosure",
        blocks: [
          p("Real Mortgage Associates is compensated through commissions paid by lenders when mortgages are funded. This compensation does not increase the rate or cost you pay, lenders set their rates independently of broker compensation."),
          p("In circumstances where a fee to the borrower may apply, it will be disclosed to you in writing, in plain language, before you sign any commitment or agreement."),
        ],
      },
      {
        heading: "Third-Party Lenders and Services",
        blocks: [
          p("Presenting a lender offer or product on this site does not constitute a recommendation or endorsement of that lender. All mortgage applications are submitted to lenders as an offer by you; the lender, not Real Mortgage Associates, makes the final credit decision."),
          p("Links to third-party websites are provided for convenience only. We are not responsible for the content, accuracy, or privacy practices of any third-party site."),
        ],
      },
      {
        heading: "Permitted Use",
        blocks: [
          p("You agree not to:"),
          ul([
            "Use automated bots, scrapers, or scripts to access our website or services.",
            "Misrepresent your identity or impersonate another person.",
            "Reproduce, distribute, or commercially exploit our content without written permission.",
            "Use our services for any unlawful purpose or in violation of applicable law.",
            "Attempt to gain unauthorized access to our systems or data.",
          ]),
        ],
      },
      {
        heading: "Intellectual Property",
        blocks: [
          p("All content on this website, including text, graphics, logos, and tools, is the property of Real Mortgage Associates and is protected by applicable intellectual property laws. Nothing on this site grants you a licence to use our intellectual property without prior written consent."),
        ],
      },
      {
        heading: "Limitation of Liability",
        blocks: [
          p("To the maximum extent permitted by applicable law, Real Mortgage Associates shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of (or inability to use) this website or our services, including reliance on any tools or general information provided here."),
          p("Our services are provided “as is” and “as available.” We make no warranties, express or implied, as to the accuracy, completeness, or fitness for purpose of any content on this site."),
        ],
      },
      {
        heading: "No Public Account",
        blocks: [
          p("The current public experience does not provide a user account or dashboard. Mortgage guidance is handled directly through WhatsApp, phone, email, or other agreed communication channels."),
        ],
      },
      {
        heading: "Governing Law & Jurisdiction",
        blocks: [
          p("These Terms of Use are governed by the laws of the Province of Ontario and the applicable federal laws of Canada. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Ontario."),
        ],
      },
      {
        heading: "Changes to These Terms",
        blocks: [
          p("We may update these Terms of Use at any time by posting a revised version on this page. Your continued use of our services following any update constitutes your acceptance of the revised Terms. The “Last Modified” date at the top of this page indicates when the Terms were last updated."),
        ],
      },
      {
        heading: "Contact Us",
        blocks: [
          p("If you have questions about these Terms, please contact us at:"),
          {
            kind: "contact",
            name: "Real Mortgage Associates",
            lines: [`Email: ${LEGAL_CONTACT.legalEmail}`],
          },
        ],
      },
    ],
    seeAlsoLabel: "See also",
    seeAlso: [
      { href: href.advertising, label: "Advertising Disclosure" },
      { href: href.privacy, label: "Privacy Policy" },
    ],
  },

  advertising: {
    metaTitle: "Advertising Disclosure · Real Mortgage Associates",
    eyebrow: "Legal",
    title: "Advertising Disclosure",
    lastModifiedLabel: "Last modified",
    sections: [
      {
        heading: "Real Mortgage Associates Service",
        blocks: [
          p(`Mortgage services are offered through Real Mortgage Associates, a licensed mortgage brokerage operating in Ontario. Mortgage brokerage services are regulated by the Financial Services Regulatory Authority of Ontario (FSRA). ${LIC_EN}.`),
          p("Real Mortgage Associates may receive commissions from lenders when mortgages are funded. These commissions are paid by the lender, not by you. Where any fee applies to the borrower, it is disclosed in writing and in plain language before you sign any commitment."),
        ],
      },
      {
        heading: "Mortgage Options Disclaimer",
        blocks: [
          p("This site does not publish current, sample, historical, or personalized mortgage rates. Educational content does not constitute a rate guarantee, credit approval, or lender commitment."),
          ul([
            "Final pricing depends on the information collected during the application stage and the lender's current product terms.",
            "Income, existing debt, credit history, down payment, and property details form part of the assessment.",
            "Homeowners insurance, property taxes, legal costs, and other expenses are considered separately.",
            "Not every lender product or offer available in the market is represented on this site.",
            "All mortgage products have specific qualification criteria, including income, debt servicing ratios, credit score, property value, and property type.",
          ]),
          p("Final rates and approval are confirmed based on your income, credit history, property details, down payment, and lender conditions, and are documented in a written commitment."),
          p("For full details, please refer to our Terms of Use."),
        ],
      },
      {
        heading: "Privacy Disclaimer",
        blocks: [
          p("When you interact with Real Mortgage Associates through WhatsApp, phone, email, or another channel, we may collect your name, contact information, financial information, and property details in order to provide mortgage guidance and connect your file with suitable lenders."),
          p("Your personal data is handled in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable Ontario privacy requirements. We limit use of your information to the purposes stated at collection, retain it only as long as necessary, and protect it with appropriate safeguards."),
          p("For the full details on how your data is collected, used, and protected, please see our Privacy Policy."),
        ],
      },
      {
        heading: "Questions?",
        blocks: [
          p(`If you have questions about this disclosure, contact us at ${LEGAL_CONTACT.privacyEmail}. You can also review our Privacy Policy and Terms of Use.`),
        ],
      },
    ],
    seeAlsoLabel: "See also",
    seeAlso: [
      { href: href.privacy, label: "Privacy Policy" },
      { href: href.terms, label: "Terms of Use" },
    ],
  },
};

export const LEGAL_DOCS = { tr, en };
