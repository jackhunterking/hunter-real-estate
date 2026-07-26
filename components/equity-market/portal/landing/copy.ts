/**
 * Marketing copy for the Equity Market public landing page.
 *
 * Plain-language, Instagram-first. English and Turkish are both authored in full
 * (`{ en, tr }`) so the language dropdown can switch between them without any
 * half-translated state. The audience is a cold visitor — often a Turkish
 * speaker in Turkey who is still *exploring* — so copy leads with the concept in
 * everyday words, keeps figures qualified, and is honest about eligibility.
 *
 * Keep positional arrays (icons in the section files) aligned by index to the
 * arrays here. Keep entity names / registrations (Parvis, Exempt Market Dealer,
 * NRD #74000) intact in every language.
 */

export interface LandingCopy {
  nav: {
    opportunities: string;
    platform: string;
    why: string;
    how: string;
    compare: string;
  };
  actions: {
    getAccess: string;
    seeOpportunities: string;
    seeHowItWorks: string;
    signIn: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    stat: { value: string; label: string; note: string };
  };
  simulator: {
    eyebrow: string;
    title: string;
    body: string;
    amountLabel: string;
    fundLabel: string;
    perYear: string;
    perMonth: string;
    invested: string;
    returnLabel: string;
    tableCaption: string;
    colPeriod: string;
    colReturn: string;
    colPerYear: string;
    colPerMonth: string;
    sinceInception: string;
    averageOfYears: string;
    disclaimer: string;
    cta: string;
  };
  trustBar: { items: string[] };
  featured: { eyebrow: string; title: string; body: string; open: string };
  benefits: {
    eyebrow: string;
    title: string;
    items: { title: string; body: string }[];
  };
  /**
   * Head-to-head comparison of the three ways a visitor can get real-estate
   * exposure. Deliberately argument-based: no index or market return figures
   * appear here, because we neither source nor maintain them. Every claim is a
   * structural characteristic of the three paths, not a performance promise.
   */
  compare: {
    eyebrow: string;
    title: string;
    body: string;
    /** Screen-reader label for the attribute column (visually empty). */
    rowHeader: string;
    columns: { self: string; portal: string; markets: string };
    /** Small pill on the highlighted middle column. */
    portalBadge: string;
    rows: { label: string; self: string; portal: string; markets: string }[];
    note: string;
    cta: string;
  };
  buildings: { eyebrow: string; title: string; body: string };
  ways: {
    eyebrow: string;
    title: string;
    caption: string;
    previewCaption: string;
    items: { title: string; body: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  final: { eyebrow: string; title: string; body: string };
  card: {
    open: string;
    targetReturn: string;
    minimum: string;
    distribution: string;
    portfolio: string;
    verifiedLocations: string;
    aum: string;
    term: string;
    reviewRequired: string;
    verifiedAsOf: string;
    view: string;
    accountNote: string;
    previewLabel: string;
    keyFacts: string;
  };
}

const en: LandingCopy = {
  nav: {
    opportunities: "Opportunities",
    platform: "The platform",
    why: "Why real estate",
    how: "How it works",
    compare: "How it compares",
  },
  actions: {
    getAccess: "Get access",
    seeOpportunities: "See the opportunities",
    seeHowItWorks: "See how it works",
    signIn: "Sign in",
  },
  hero: {
    eyebrow: "Real estate investing, made simple",
    title: "A share of real Canadian buildings.",
    body: "These buildings collect rent every month. You own a share of it, and you can start small.",
    // Union of the published Class A target ranges of the open funds (Legacy
    // 12–15%, Lankin 10–14%), both approved-public in lib/equity-market/data.ts.
    stat: {
      value: "10–15%",
      label: "Target annual return",
      note: "A target across current funds — not guaranteed.",
    },
  },
  simulator: {
    eyebrow: "Try it first",
    title: "See what your money could earn.",
    body: "Pick a fund, an amount, and a period. Every figure is a return the fund actually published — what it would have paid on your cash, per year and per month.",
    amountLabel: "Amount to invest",
    fundLabel: "Fund",
    perYear: "/yr",
    perMonth: "/mo",
    invested: "invested",
    returnLabel: "return",
    tableCaption: "Published returns by period — tap a row",
    colPeriod: "Period",
    colReturn: "Return",
    colPerYear: "Earned / yr",
    colPerMonth: "Earned / mo",
    sinceInception: "Since inception",
    averageOfYears: "Average of published years",
    disclaimer: "Every figure is a return the fund published — not a forecast, not guaranteed. Past returns are not a prediction of future results.",
    cta: "See the fund",
  },
  trustBar: {
    // Product-agnostic credibility only — no fund-specific figures here.
    items: [
      "Real Canadian real estate",
      "Independently audited",
      "RRSP · TFSA · RESP eligible",
      "Overseen by a licensed dealer (Parvis)",
    ],
  },
  featured: {
    eyebrow: "Open now",
    title: "Open for investment.",
    body: "Get access to see the full terms, documents, and numbers behind each one.",
    open: "Open now",
  },
  benefits: {
    eyebrow: "Why real estate",
    title: "Three simple reasons people invest.",
    items: [
      {
        title: "Passive income",
        body: "The buildings earn rent from tenants — and your share is paid to you on a schedule.",
      },
      {
        title: "Wealth protection",
        body: "As cash slowly loses value to inflation, real property has historically held its worth.",
      },
      {
        title: "Real Canadian real estate",
        body: "Actual apartment and commercial buildings you can see, in real Canadian cities.",
      },
    ],
  },
  compare: {
    eyebrow: "Compare the three paths",
    title: "Buy a rental yourself. Buy stocks. Or invest this way.",
    body: "Most people weighing real estate are really choosing between three things. Here is what each one actually asks of you — and what it gives back.",
    rowHeader: "What you're comparing",
    columns: {
      self: "Buying a rental yourself",
      portal: "Investing with us",
      markets: "Stocks & index funds",
    },
    portalBadge: "Our approach",
    rows: [
      {
        label: "What you own",
        self: "One property, at one address, in one city.",
        portal: "A share of a portfolio of real, income-producing Canadian buildings.",
        markets: "A slice of hundreds of listed companies — no building behind it.",
      },
      {
        label: "Who does the work",
        self: "You. Tenants, repairs, vacancies, the 2 a.m. call.",
        portal: "Professional managers run the buildings. You hold the shares.",
        markets: "Nobody you can reach. You watch the price and wait.",
      },
      {
        label: "Where the income comes from",
        self: "Rent — once the mortgage, taxes, repairs and vacancy are paid.",
        portal: "Rent from occupied buildings, paid to you on the offering's schedule.",
        markets: "Dividends, if and when the companies choose to pay them.",
      },
      {
        label: "Getting started",
        self: "Down payment, land transfer tax, legal and closing costs — usually a large lump sum.",
        portal: "A set minimum per offering. You see the exact amount once you have access.",
        markets: "Almost any amount, on your own, with no one reviewing the fit.",
      },
      {
        label: "How you get in",
        self: "Searching, offers, financing, lawyers, inspections — often months of it.",
        portal: "A guided sign-up with a licensed advisory team beside you at every step.",
        markets: "Instant — and entirely on you if it's the wrong holding.",
      },
      {
        label: "Debt in your name",
        self: "A mortgage you personally guarantee, plus the rate risk that comes with it.",
        portal: "None. You invest cash and are never on the hook for a loan.",
        markets: "None.",
      },
      {
        label: "Spreading the risk",
        self: "One building, one tenant pool, one local market.",
        portal: "Many buildings across Canadian cities, inside one investment.",
        markets: "Broad — but all of it sitting inside public markets at once.",
      },
      {
        label: "Day-to-day swings",
        self: "No daily price, and genuinely hard to value between sales.",
        portal: "Not repriced minute by minute — held for the term, valued periodically.",
        markets: "Prices move every second, with every headline.",
      },
      {
        label: "RRSP · TFSA · RESP",
        self: "A rental property generally can't be held in a registered account.",
        portal: "Eligible for RRSP, TFSA and RESP.",
        markets: "Eligible.",
      },
      {
        label: "Getting out",
        self: "List it, wait months for a buyer, then pay commissions and closing costs.",
        portal: "A stated term, with the redemption terms published up front before you invest.",
        markets: "Sell on any trading day — at whatever the market pays that morning.",
      },
    ],
    note: "A general comparison of three ways to hold real-estate exposure — not a forecast, and not investment advice. Private investments are not publicly traded, are far less liquid than listed shares, and carry risk including possible loss of principal. Terms differ by offering; review the offering documents before investing.",
    cta: "See how it works",
  },
  buildings: {
    eyebrow: "Real, not a concept",
    title: "See the actual buildings.",
    body: "These are real properties in the current funds — with real photos and locations. Nothing abstract.",
  },
  ways: {
    eyebrow: "How it works",
    title: "Getting started is simple.",
    caption: "A guided path, with a licensed advisory team beside you at every step.",
    previewCaption: "A guided path, with a licensed advisory team beside you at every step.",
    items: [
      {
        title: "Find an opportunity",
        body: "Browse a short, curated list of vetted private real estate offerings.",
      },
      {
        title: "Invest",
        body: "Complete a simple, supervised sign-up with a licensed advisor beside you.",
      },
      {
        title: "Receive income",
        body: "The buildings collect rent — and your share is paid to you on the offering's schedule.",
      },
    ],
  },
  faq: {
    eyebrow: "Good questions",
    title: "Questions people ask first.",
    items: [
      {
        q: "How much do I need to start?",
        a: "Each opportunity sets its own minimum. You'll see the exact amount for each one when you get access.",
      },
      {
        q: "How do I get paid?",
        a: "The properties generate rental income, and your share is paid to your account on each investment's schedule.",
      },
      {
        q: "Is this regulated? Is my money protected?",
        a: "Investments are independently audited, and securities services are provided through Parvis Investment Services Inc., an Exempt Market Dealer (NRD #74000). Every investment still carries risk, including possible loss of principal.",
      },
      {
        // TODO(jack/compliance): confirm the exact eligibility wording for
        // non-resident / outside-Canada investors before launch.
        q: "Can I invest from outside Canada?",
        a: "These opportunities are built for Canadian investors and use Canadian accounts (RRSP · TFSA · RESP). If you're outside Canada, the best first step is to speak with our licensed advisory team about whether and how you can take part.",
      },
    ],
  },
  final: {
    eyebrow: "By access",
    title: "The door to real estate is open.",
    body: "Join a growing group of investors putting their money into real, curated Canadian real estate — with a licensed team beside them.",
  },
  card: {
    open: "Open now",
    targetReturn: "Target return",
    minimum: "Minimum investment",
    distribution: "Target distribution",
    portfolio: "Portfolio",
    verifiedLocations: "verified locations",
    aum: "Assets under management",
    term: "Term",
    reviewRequired: "Get access to view",
    verifiedAsOf: "Verified",
    view: "Get access to view",
    accountNote: "Full terms and documents open once you have access.",
    previewLabel: "Opportunity overview",
    keyFacts: "Key facts",
  },
};

// Turkish is authored in full (not a machine pass). Warm, plain language for a
// Turkey-based visitor who is still exploring. Proper nouns and registrations
// stay in their original form. Jack reviews for nuance before launch.
const tr: LandingCopy = {
  nav: {
    opportunities: "Fırsatlar",
    platform: "Platform",
    why: "Neden gayrimenkul",
    how: "Nasıl işliyor",
    compare: "Karşılaştırma",
  },
  actions: {
    getAccess: "Erişim alın",
    seeOpportunities: "Fırsatları görün",
    seeHowItWorks: "Nasıl işlediğini görün",
    signIn: "Giriş yapın",
  },
  hero: {
    eyebrow: "Gayrimenkul yatırımı, sadeleştirildi",
    title: "Gerçek Kanada binalarından bir pay.",
    body: "Bu binalar her ay kira geliri toplar. Siz de bir payına sahip olursunuz — üstelik küçük bir tutarla başlayabilirsiniz.",
    stat: {
      value: "%10–15",
      label: "Hedeflenen yıllık getiri",
      note: "Mevcut fonlardaki bir hedeftir — garanti değildir.",
    },
  },
  simulator: {
    eyebrow: "Önce deneyin",
    title: "Paranızın ne kazanabileceğini görün.",
    body: "Bir fon, bir tutar ve bir dönem seçin. Her rakam fonun gerçekte yayımladığı bir getiridir — bu paranın yılda ve ayda ne ödeyeceğini gösterir.",
    amountLabel: "Yatırılacak tutar",
    fundLabel: "Fon",
    perYear: "/yıl",
    perMonth: "/ay",
    invested: "yatırıldı",
    returnLabel: "getiri",
    tableCaption: "Döneme göre yayımlanan getiriler — bir satıra dokunun",
    colPeriod: "Dönem",
    colReturn: "Getiri",
    colPerYear: "Yıllık kazanç",
    colPerMonth: "Aylık kazanç",
    sinceInception: "Kuruluştan bu yana",
    averageOfYears: "Yayımlanan yılların ortalaması",
    disclaimer: "Her rakam fonun yayımladığı bir getiridir — öngörü değildir, garanti edilmez. Geçmiş getiriler gelecekteki sonuçların göstergesi değildir.",
    cta: "Fonu görün",
  },
  trustBar: {
    items: [
      "Gerçek Kanada gayrimenkulü",
      "Bağımsız denetimli",
      "RRSP · TFSA · RESP uygun",
      "Lisanslı aracı (Parvis) gözetiminde",
    ],
  },
  featured: {
    eyebrow: "Şimdi açık",
    title: "Yatırıma açık.",
    body: "Her birinin tüm koşullarını, belgelerini ve rakamlarını görmek için erişim alın.",
    open: "Şimdi açık",
  },
  benefits: {
    eyebrow: "Neden gayrimenkul",
    title: "İnsanların yatırım yapmasının üç basit nedeni.",
    items: [
      {
        title: "Pasif gelir",
        body: "Binalar kiracılardan kira kazanır — ve payınız düzenli olarak size ödenir.",
      },
      {
        title: "Birikiminizi koruma",
        body: "Nakit, enflasyon karşısında yavaşça değer kaybederken gayrimenkul geçmişte değerini korumuştur.",
      },
      {
        title: "Gerçek Kanada gayrimenkulü",
        body: "Gerçek Kanada şehirlerinde, görebileceğiniz gerçek konut ve ticari binalar.",
      },
    ],
  },
  compare: {
    eyebrow: "Üç yolu karşılaştırın",
    title: "Kendiniz kiralık alın. Hisse alın. Ya da bu şekilde yatırım yapın.",
    body: "Gayrimenkulü düşünen çoğu kişi aslında üç seçenek arasında karar veriyor. İşte her birinin sizden istedikleri — ve karşılığında verdikleri.",
    rowHeader: "Karşılaştırılan konu",
    columns: {
      self: "Kendiniz kiralık almak",
      portal: "Bizimle yatırım yapmak",
      markets: "Hisse ve endeks fonları",
    },
    portalBadge: "Bizim yaklaşımımız",
    rows: [
      {
        label: "Neye sahip olursunuz",
        self: "Tek şehirde, tek adreste, tek bir mülk.",
        portal: "Gerçek, gelir getiren Kanada binalarından oluşan bir portföyün payı.",
        markets: "Yüzlerce borsa şirketinden küçük bir dilim — arkasında bina yok.",
      },
      {
        label: "İşi kim yapar",
        self: "Siz. Kiracılar, tamirat, boş kalan aylar, gece 2'deki telefon.",
        portal: "Binaları profesyonel yöneticiler işletir. Siz payları tutarsınız.",
        markets: "Ulaşabileceğiniz kimse yok. Fiyata bakar ve beklersiniz.",
      },
      {
        label: "Gelir nereden gelir",
        self: "Kiradan — ipotek, vergi, tamirat ve boş aylar ödendikten sonra kalan.",
        portal: "Dolu binaların kirasından; payınız yatırımın takvimine göre size ödenir.",
        markets: "Temettüden — şirketler ödemeyi seçerse ve seçtiği zaman.",
      },
      {
        label: "Başlangıç maliyeti",
        self: "Peşinat, tapu devir vergisi, avukat ve kapanış masrafları — genelde büyük bir toplu tutar.",
        portal: "Her fırsatın belirlediği bir asgari tutar. Kesin rakamı erişim aldığınızda görürsünüz.",
        markets: "Neredeyse her tutar — tek başınıza, uygunluğunu inceleyen kimse olmadan.",
      },
      {
        label: "Nasıl girersiniz",
        self: "Arama, teklif, kredi, avukat, ekspertiz — çoğu zaman aylar sürer.",
        portal: "Her adımda lisanslı bir danışman ekibinin yanınızda olduğu, rehberli bir kayıt.",
        markets: "Anında — ve yanlış bir yatırımsa sorumluluk tamamen sizde.",
      },
      {
        label: "Adınıza borç",
        self: "Şahsen kefil olduğunuz bir ipotek ve beraberinde gelen faiz riski.",
        portal: "Yok. Nakit yatırım yaparsınız; hiçbir kredinin altına girmezsiniz.",
        markets: "Yok.",
      },
      {
        label: "Riski dağıtmak",
        self: "Tek bina, tek kiracı havuzu, tek yerel piyasa.",
        portal: "Tek bir yatırımın içinde, Kanada şehirlerine yayılmış birçok bina.",
        markets: "Geniş — ama tamamı aynı anda halka açık piyasaların içinde.",
      },
      {
        label: "Günlük dalgalanma",
        self: "Günlük bir fiyatı yok; iki satış arasında değerini bilmek gerçekten zor.",
        portal: "Dakika dakika yeniden fiyatlanmaz — vade boyunca tutulur, dönemsel olarak değerlenir.",
        markets: "Fiyatlar her saniye, her haber başlığıyla birlikte hareket eder.",
      },
      {
        label: "RRSP · TFSA · RESP",
        self: "Kiralık bir mülk genellikle kayıtlı bir hesapta tutulamaz.",
        portal: "RRSP, TFSA ve RESP için uygundur.",
        markets: "Uygundur.",
      },
      {
        label: "Nasıl çıkarsınız",
        self: "İlana koyarsınız, aylarca alıcı beklersiniz, sonra komisyon ve kapanış masrafı ödersiniz.",
        portal: "Belirli bir vade; geri alım koşulları siz yatırım yapmadan önce açıkça yayınlanır.",
        markets: "Her işlem gününde satarsınız — o sabah piyasa ne veriyorsa o fiyattan.",
      },
    ],
    note: "Gayrimenkul riskini taşımanın üç yolunun genel bir karşılaştırmasıdır — tahmin değildir ve yatırım tavsiyesi değildir. Özel yatırımlar halka açık olarak işlem görmez, borsa hisselerine kıyasla çok daha az likittir ve anaparanın olası kaybı dahil risk taşır. Koşullar her fırsatta farklıdır; yatırım yapmadan önce ihraç belgelerini inceleyin.",
    cta: "Nasıl işlediğini görün",
  },
  buildings: {
    eyebrow: "Kavram değil, gerçek",
    title: "Gerçek binaları görün.",
    body: "Bunlar mevcut fonlardaki gerçek mülkler — gerçek fotoğraflar ve konumlarla. Hiçbir şey soyut değil.",
  },
  ways: {
    eyebrow: "Nasıl işliyor",
    title: "Başlamak çok basit.",
    caption: "Her adımda lisanslı bir danışman ekibinin yanınızda olduğu, rehberli bir yol.",
    previewCaption: "Her adımda lisanslı bir danışman ekibinin yanınızda olduğu, rehberli bir yol.",
    items: [
      {
        title: "Bir fırsat bulun",
        body: "İncelenmiş özel gayrimenkul yatırımlarından oluşan kısa, seçilmiş bir listeye göz atın.",
      },
      {
        title: "Yatırım yapın",
        body: "Lisanslı bir danışman yanınızdayken basit, gözetimli bir kayıt tamamlayın.",
      },
      {
        title: "Gelir alın",
        body: "Binalar kira toplar — payınız da yatırımın takvimine göre size ödenir.",
      },
    ],
  },
  faq: {
    eyebrow: "Güzel sorular",
    title: "İnsanların ilk sorduğu sorular.",
    items: [
      {
        q: "Başlamak için ne kadar gerekli?",
        a: "Her fırsat kendi asgari tutarını belirler. Erişim aldığınızda her biri için kesin tutarı görürsünüz.",
      },
      {
        q: "Gelirimi nasıl alırım?",
        a: "Mülkler kira geliri üretir ve payınız her yatırımın takvimine göre hesabınıza ödenir.",
      },
      {
        q: "Bu düzenlemeye tabi mi? Param güvende mi?",
        a: "Yatırımlar bağımsız olarak denetlenir ve menkul kıymet hizmetleri, bir Exempt Market Dealer (NRD #74000) olan Parvis Investment Services Inc. aracılığıyla sağlanır. Yine de her yatırım, anaparanın kaybı dahil risk taşır.",
      },
      {
        q: "Kanada dışından yatırım yapabilir miyim?",
        a: "Bu fırsatlar Kanadalı yatırımcılar için tasarlanmıştır ve Kanada hesaplarını (RRSP · TFSA · RESP) kullanır. Kanada dışındaysanız, en iyi ilk adım, katılıp katılamayacağınızı ve nasıl katılabileceğinizi lisanslı danışman ekibimizle konuşmaktır.",
      },
    ],
  },
  final: {
    eyebrow: "Erişimle",
    title: "Gayrimenkulün kapısı açık.",
    body: "Paralarını gerçek, seçilmiş Kanada gayrimenkulüne yatıran — yanlarında lisanslı bir ekip olan — büyüyen bir yatırımcı grubuna katılın.",
  },
  card: {
    open: "Şimdi açık",
    targetReturn: "Hedef getiri",
    minimum: "Asgari yatırım",
    distribution: "Hedef dağıtım",
    portfolio: "Portföy",
    verifiedLocations: "doğrulanmış konum",
    aum: "Yönetilen varlıklar",
    term: "Vade",
    reviewRequired: "Görmek için erişim alın",
    verifiedAsOf: "Doğrulandı",
    view: "Görmek için erişim alın",
    accountNote: "Tüm koşullar ve belgeler, erişim aldığınızda açılır.",
    previewLabel: "Fırsat özeti",
    keyFacts: "Temel bilgiler",
  },
};

export const LANDING_COPY: { en: LandingCopy; tr: LandingCopy } = { en, tr };
