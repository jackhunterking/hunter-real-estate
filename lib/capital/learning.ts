import type { LocalizedText } from "./types";

export type LearningPublicationStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "superseded"
  | "withdrawn";

export type LearningResourceSource = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedOn?: string;
  accessedAt: string;
  notes?: string;
  sortOrder: number;
};

export type LearningResourceSummary = {
  id: string;
  slug: string;
  resourceType: "guide";
  categoryKey: string;
  audience: "investor_and_professional";
  versionId: string;
  version: number;
  title: LocalizedText;
  summary: LocalizedText;
  readingMinutes: { en: number; tr: number };
  effectiveAt: string;
  publishedAt?: string;
  reviewedAt: string;
};

export type LearningResourceDetail = LearningResourceSummary & {
  bodyMarkdown: LocalizedText;
  disclaimer: LocalizedText;
  sources: LearningResourceSource[];
};

export type LearningResourceVersion = {
  id: string;
  resourceId: string;
  version: number;
  status: LearningPublicationStatus;
  title: LocalizedText;
  summary: LocalizedText;
  bodyMarkdown: LocalizedText;
  disclaimer: LocalizedText;
  readingMinutes: { en: number; tr: number };
  authorId: string;
  reviewerId?: string;
  complianceOwnerId?: string;
  effectiveAt?: string;
  publishedAt?: string;
  withdrawalAt?: string;
  createdAt: string;
};

export type LearningAdminResource = LearningResourceVersion & {
  slug: string;
  resourceType: "guide";
  categoryKey: string;
  audience: "investor_and_professional";
  currentVersionId?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  sources: LearningResourceSource[];
};

export const LEARNING_CATEGORIES: Record<string, LocalizedText> = {
  "investment-fundamentals": {
    en: "Investment fundamentals",
    tr: "Yatırım temelleri",
  },
};

const EN_BODY = `
## The four strategies at a glance

Core, Core-Plus, Value-Add and Opportunistic are industry labels for the **risk and execution profile of a real estate business plan**. They are useful shorthand, but they are not legal definitions and no governing body assigns every property to one category.

The label should never replace analysis of the property, price, financing, market and manager. A high-quality building can support an opportunistic plan, while an older building can sometimes be a stable Core investment.

> **Key principle:** the strategy is determined by what must go right after acquisition—not simply by whether the building is called Class A, B or C.

## Risk and execution spectrum

The usual progression is:

**Core → Core-Plus → Value-Add → Opportunistic**

Moving to the right generally means less dependable income on day one, more capital and operational work, greater sensitivity to financing and market assumptions, and a wider range of possible outcomes. It also means a higher target return may be required to compensate for those risks. A target is not a promise.

| Dimension | Core | Core-Plus | Value-Add | Opportunistic |
| --- | --- | --- | --- | --- |
| Existing income | Usually stable and established | Mostly established, with manageable gaps | Often disrupted, below potential or partly absent | May be minimal or absent |
| Physical work | Routine maintenance | Light-to-moderate upgrades | Material renovation or repositioning | Major redevelopment or ground-up construction |
| Operational work | Limited | Select leasing or management improvements | Lease-up, tenant change and active operations | Complex execution, approvals, construction or turnaround |
| Capital requirements | Lower relative to asset value | Moderate | Significant | Often substantial and staged over time |
| Leverage tendency | Lower | Low-to-moderate | Moderate and highly deal-dependent | Can be higher or structurally complex |
| Primary return source | Current income and market appreciation | Income plus moderate value creation | Increased net operating income and improved value | Development profit, major transformation or distress resolution |
| Principal risks | Overpaying, tenant concentration, rates, obsolescence | Execution drift, rollover, financing and capex | Cost overruns, lease-up delays and market demand | Entitlement, construction, financing, timing and loss of capital |
| Illustrative plan | Hold a leased apartment property with limited change | Upgrade common areas and renew leases | Renovate units, improve operations and raise occupancy | Develop, convert or substantially rebuild an asset |

Leverage descriptions are tendencies, not thresholds. Debt can magnify gains and losses in every category.

## Core

A Core strategy usually starts with a completed, well-located and substantially occupied property producing dependable income. The business plan requires limited physical or operational change. The investor is primarily paying for an existing stream of cash flow.

Typical characteristics include:

- Established occupancy and operating history
- Market-standard building condition
- Limited near-term capital expenditure beyond normal reserves
- Tenants or residents considered relatively dependable for the asset type
- A return profile driven more by current income than by transformation

Core is lower risk **relative to the other strategies**, not risk-free. A Core property can still perform poorly if it is purchased at an excessive price, loses a major tenant, becomes obsolete, suffers an unexpected capital need or faces difficult refinancing conditions.

## Core-Plus

Core-Plus combines an income-producing foundation with a defined set of manageable improvements. The property may have upcoming lease expiries, modest vacancy, dated finishes, below-market operations or a secondary location, but the plan should not depend on a complete transformation.

Common initiatives include:

- Renovating common areas or a limited portion of units
- Improving leasing, expense controls or property management
- Addressing deferred maintenance
- Renewing or replacing selected tenants
- Refinancing after stabilization

The dividing line between Core-Plus and Value-Add is judgmental. A useful test is whether most of the investment value already exists and produces income, or whether substantial new value must be created through execution.

## Value-Add

A Value-Add strategy seeks to create value through meaningful physical, leasing or operational changes. Current income may be below potential because of vacancy, poor management, outdated space, weak tenant mix or deferred capital work.

The plan may involve:

- Renovating a large share of the property
- Repositioning the asset for a different tenant or resident segment
- Raising occupancy through active lease-up
- Correcting inefficient expenses or management practices
- Completing a moderate redevelopment

Value is not created merely because money is spent. The work must produce sustainable net operating income or a strategically stronger asset. Major risks include construction overruns, lost income during renovation, slower leasing, inaccurate rent assumptions and an exit market that values the property differently than expected.

## Opportunistic

Opportunistic strategies rely on the most substantial change or the most uncertain starting point. They can include ground-up development, major redevelopment, conversion to a new use, distressed property or debt, land entitlement, vacancy, recapitalization or a complex operating-company turnaround.

An Opportunistic investment is not simply a poor-quality building. A newly built Class A office project with no tenants can be Opportunistic because the outcome depends on construction, financing and lease-up. Likewise, acquiring distressed debt secured by excellent real estate can be Opportunistic because the legal and financial resolution is uncertain.

These plans can have long periods with little or no income. Success may depend on permits, construction pricing, financing availability, market timing and a future buyer or lender. The possibility of a higher return exists alongside a greater possibility of delay, permanent impairment or total loss.

## Property class does not determine strategy

Class A, B and C labels describe relative property quality within a market; they do not reliably classify the investment strategy.

- A stabilized Class B apartment building with durable occupancy and minimal work could be Core or Core-Plus.
- A vacant Class A office tower requiring a major conversion could be Opportunistic.
- A Class C building in a strong location might be Value-Add if renovation and lease-up are achievable without a complete redevelopment.

Always classify the business plan, not the marketing label.

## One property can move across the spectrum

Consider an older apartment building with substantial vacancy:

1. During acquisition, renovation and lease-up, the plan may be Value-Add.
2. After the work is completed and occupancy stabilizes, the property may resemble Core-Plus.
3. After several years of dependable operations and limited remaining work, a new owner might underwrite it as Core.

The physical property did not become a different building overnight. Its income stability, required work and remaining execution risk changed.

## How to evaluate the actual business plan

Before relying on a strategy label, ask:

1. How much income exists today, and how concentrated is it?
2. What physical and operational work is required?
3. How much additional capital is reserved, and who must provide it?
4. Which assumptions depend on higher rents, occupancy or property values?
5. What permits, approvals, construction milestones or refinancing events are required?
6. How much debt is used, when does it mature and what covenants apply?
7. What happens if the work costs more or takes longer?
8. Is the projected return gross or net of fees, and levered or unlevered?
9. How is the exit value calculated?
10. What experience does the manager have with this exact plan and market?

## Glossary

**IRR (internal rate of return):** an annualized return measure that is sensitive to the timing of cash flows. It should be reviewed alongside the underlying assumptions.

**Equity multiple:** total cash returned divided by equity invested. It does not show how long the investment took.

**Cash yield:** cash distributed during a period divided by invested equity. Definitions vary, so verify the numerator and denominator.

**LTV (loan-to-value):** debt divided by property value. Value can change, and LTV alone does not describe all financing risk.

**Cap rate:** a property's net operating income divided by its value or purchase price. It is not the investor's total return.

**Occupancy:** the proportion of space or units occupied. Physical and economic occupancy can differ.

**Lease-up:** the process of securing tenants or residents until a property reaches a stable occupancy level.

## Final perspective

The four labels are best used as the beginning of due diligence. Focus on existing income, required work, financing, assumptions and downside scenarios. The actual plan and its evidence matter more than the name attached to it.
`;

const TR_BODY = `
## Dört stratejiye genel bakış

Core, Core-Plus, Value-Add ve Opportunistic, bir gayrimenkul iş planının **risk ve uygulama profilini** anlatan sektör terimleridir. Yararlı bir kısa anlatım sağlarlar; ancak hukuki tanım değildirler ve her mülkü bu kategorilerden birine atayan bir kurum yoktur.

Etiket; mülkün, satın alma fiyatının, finansmanın, pazarın ve yöneticinin analizinin yerini tutmaz. Yüksek kaliteli bir bina fırsatçı bir plana konu olabilirken daha eski bir bina istikrarlı bir Core yatırımı olabilir.

> **Temel ilke:** stratejiyi yalnızca binanın A, B veya C sınıfı olarak adlandırılması değil, satın alma sonrasında nelerin başarıyla gerçekleşmesi gerektiği belirler.

## Risk ve uygulama yelpazesi

Genel sıralama şöyledir:

**Core → Core-Plus → Value-Add → Opportunistic**

Sağa doğru ilerledikçe ilk gün mevcut gelirin güvenilirliği genellikle azalır; sermaye ve operasyon ihtiyacı, finansman ve piyasa varsayımlarına duyarlılık ve olası sonuçların aralığı artar. Bu riskleri karşılamak için daha yüksek hedef getiri aranabilir. Hedef, taahhüt değildir.

| Boyut | Core | Core-Plus | Value-Add | Opportunistic |
| --- | --- | --- | --- | --- |
| Mevcut gelir | Genellikle istikrarlı ve yerleşik | Yönetilebilir eksiklerle büyük ölçüde yerleşik | Çoğu zaman kesintili, potansiyelin altında veya kısmen yok | Çok sınırlı olabilir veya hiç olmayabilir |
| Fiziksel çalışma | Rutin bakım | Hafif-orta ölçekli iyileştirme | Önemli renovasyon veya yeniden konumlandırma | Büyük yeniden geliştirme veya sıfırdan inşaat |
| Operasyonel çalışma | Sınırlı | Seçili kiralama veya yönetim iyileştirmeleri | Doluluk artırma, kiracı değişimi ve aktif operasyon | Karmaşık uygulama, izin, inşaat veya dönüşüm |
| Sermaye ihtiyacı | Mülk değerine göre daha düşük | Orta | Önemli | Çoğu zaman yüksek ve zamana yayılmış |
| Borç kullanımı eğilimi | Daha düşük | Düşük-orta | Orta ve işleme çok bağlı | Daha yüksek veya yapısal olarak karmaşık olabilir |
| Başlıca getiri kaynağı | Cari gelir ve piyasa değer artışı | Gelir ve ölçülü değer yaratımı | Net işletme gelirinin ve mülk değerinin artırılması | Geliştirme kazancı, büyük dönüşüm veya sorun çözümü |
| Temel riskler | Aşırı fiyat, kiracı yoğunlaşması, faiz, eskime | Uygulamanın büyümesi, sözleşme yenilemeleri, finansman ve yatırım harcamaları | Maliyet aşımı, doluluk gecikmesi ve talep | İmar/izin, inşaat, finansman, zamanlama ve sermaye kaybı |
| Örnek plan | Kiralanmış bir apartmanı sınırlı değişiklikle tutmak | Ortak alanları yenilemek ve kira sözleşmelerini düzenlemek | Daireleri yenilemek, operasyonu ve doluluğu geliştirmek | Mülkü geliştirmek, dönüştürmek veya büyük ölçüde yeniden inşa etmek |

Borç kullanımı açıklamaları sabit eşikler değil, genel eğilimlerdir. Borç her kategoride kazançları ve zararları büyütebilir.

## Core

Core stratejisi genellikle tamamlanmış, iyi konumlu, büyük ölçüde dolu ve güvenilir gelir üreten bir mülkle başlar. İş planı sınırlı fiziksel veya operasyonel değişiklik gerektirir. Yatırımcı esas olarak mevcut bir nakit akışını satın alır.

Yaygın özellikler:

- Yerleşik doluluk ve faaliyet geçmişi
- Piyasa standardına uygun bina durumu
- Normal rezervler dışında sınırlı yakın dönem yatırım harcaması
- Mülk türüne göre görece güvenilir kabul edilen kiracılar veya sakinler
- Dönüşümden çok cari gelire dayanan getiri profili

Core, diğer stratejilere **göre** daha düşük risklidir; risksiz değildir. Aşırı fiyatla alınan, önemli kiracısını kaybeden, kullanım açısından eskiyen, beklenmeyen sermaye ihtiyacı doğuran veya yeniden finansman sorunu yaşayan bir Core mülk kötü performans gösterebilir.

## Core-Plus

Core-Plus, gelir üreten bir temel ile tanımlı ve yönetilebilir iyileştirmeleri birleştirir. Yaklaşan kira bitişleri, ölçülü boşluk, eski yüzeyler, piyasanın altında operasyon veya ikincil konum söz konusu olabilir; ancak plan tam bir dönüşüme bağlı olmamalıdır.

Yaygın çalışmalar:

- Ortak alanları veya sınırlı sayıda birimi yenilemek
- Kiralama, gider kontrolü veya mülk yönetimini geliştirmek
- Ertelenmiş bakımı tamamlamak
- Seçili kiracıları yenilemek veya değiştirmek
- İstikrar sonrasında yeniden finansman sağlamak

Core-Plus ile Value-Add arasındaki çizgi yoruma açıktır. Değerin büyük kısmı zaten mevcut ve gelir üretiyor mu, yoksa önemli yeni değer uygulama yoluyla mı yaratılmalı sorusu yararlı bir testtir.

## Value-Add

Value-Add stratejisi anlamlı fiziksel, kiralama veya operasyon değişiklikleriyle değer yaratmayı amaçlar. Boşluk, zayıf yönetim, eski alanlar, yetersiz kiracı karması veya ertelenmiş yatırımlar nedeniyle cari gelir potansiyelin altında olabilir.

Plan şunları içerebilir:

- Mülkün büyük bölümünü yenilemek
- Farklı bir kiracı veya sakin segmenti için yeniden konumlandırmak
- Aktif kiralama ile doluluğu artırmak
- Verimsiz gider veya yönetim uygulamalarını düzeltmek
- Orta ölçekli yeniden geliştirme yapmak

Yalnızca para harcanması değer yaratıldığı anlamına gelmez. Çalışmanın sürdürülebilir net işletme geliri veya stratejik açıdan daha güçlü bir mülk üretmesi gerekir. İnşaat maliyet aşımı, yenileme süresindeki gelir kaybı, yavaş kiralama, hatalı kira varsayımları ve beklenenden farklı bir satış piyasası başlıca risklerdir.

## Opportunistic

Opportunistic stratejiler en büyük değişime veya en belirsiz başlangıç noktasına dayanır. Sıfırdan geliştirme, büyük yeniden geliştirme, kullanım dönüşümü, sorunlu mülk veya borç, arsa izinleri, boş bina, yeniden sermayelendirme ya da karmaşık işletme dönüşümü bu gruba girebilir.

Opportunistic yatırım yalnızca düşük kaliteli bina demek değildir. Kiracısı olmayan yeni bir A sınıfı ofis projesi; sonuç inşaat, finansman ve kiralamaya bağlı olduğu için Opportunistic olabilir. Benzer şekilde kaliteli bir gayrimenkulle teminatlandırılmış sorunlu borcun satın alınması, hukuki ve finansal çözüm belirsiz olduğu için Opportunistic olabilir.

Bu planlarda uzun süre az gelir olabilir veya hiç gelir olmayabilir. Başarı; izinlere, inşaat fiyatlarına, finansmana, piyasa zamanlamasına ve gelecekteki alıcı veya kredi verene bağlı olabilir. Daha yüksek getiri olasılığı; gecikme, kalıcı değer kaybı veya sermayenin tamamen kaybı olasılığıyla birlikte gelir.

## Mülk sınıfı stratejiyi belirlemez

A, B ve C sınıfları bir pazardaki göreli mülk kalitesini anlatır; yatırım stratejisini güvenilir biçimde sınıflandırmaz.

- İstikrarlı doluluğa ve sınırlı iş ihtiyacına sahip B sınıfı bir apartman Core veya Core-Plus olabilir.
- Büyük kullanım dönüşümü gereken boş bir A sınıfı ofis kulesi Opportunistic olabilir.
- Güçlü konumdaki C sınıfı bir bina, tam yeniden geliştirme gerekmeksizin yenileme ve kiralama yapılabiliyorsa Value-Add olabilir.

Pazarlama etiketini değil, iş planını sınıflandırın.

## Bir mülk yelpazede hareket edebilir

Yüksek boşluğa sahip eski bir apartmanı düşünün:

1. Satın alma, yenileme ve kiralama sırasında plan Value-Add olabilir.
2. Çalışma tamamlanıp doluluk istikrar kazandığında mülk Core-Plus'a benzeyebilir.
3. Birkaç yıllık güvenilir operasyon ve sınırlı kalan iş sonrasında yeni bir alıcı bunu Core olarak değerlendirebilir.

Fiziksel mülk bir gecede başka bir binaya dönüşmedi. Gelir istikrarı, gereken çalışma ve kalan uygulama riski değişti.

## Gerçek iş planı nasıl değerlendirilir?

Strateji etiketine güvenmeden önce şunları sorun:

1. Bugün ne kadar gelir var ve gelir ne ölçüde yoğunlaşmış durumda?
2. Hangi fiziksel ve operasyonel çalışmalar gerekiyor?
3. Ne kadar ek sermaye ayrılmış ve bu sermayeyi kim sağlayacak?
4. Hangi varsayımlar daha yüksek kira, doluluk veya mülk değerine bağlı?
5. Hangi izin, onay, inşaat kilometre taşı veya yeniden finansman olayı gerekiyor?
6. Ne kadar borç kullanılıyor, vadesi ne zaman ve hangi koşullar uygulanıyor?
7. Çalışma daha pahalıya mal olur veya uzarsa ne olur?
8. Öngörülen getiri ücretlerden önce mi sonra mı, borç etkisini içeriyor mu?
9. Çıkış değeri nasıl hesaplanıyor?
10. Yöneticinin aynı plan ve pazardaki deneyimi nedir?

## Sözlük

**IRR (iç verim oranı):** nakit akışlarının zamanlamasına duyarlı yıllıklandırılmış getiri ölçüsüdür. Temel varsayımlarla birlikte incelenmelidir.

**Equity multiple (özkaynak çarpanı):** toplam geri dönen nakdin yatırılan özkaynağa oranıdır. Yatırımın ne kadar sürdüğünü göstermez.

**Cash yield (nakit getirisi):** bir dönemde dağıtılan nakdin yatırılan özkaynağa oranıdır. Tanımlar değişebilir; pay ve paydayı doğrulayın.

**LTV (kredi/değer oranı):** borcun mülk değerine oranıdır. Değer değişebilir ve LTV tek başına tüm finansman riskini açıklamaz.

**Cap rate (kapitalizasyon oranı):** mülkün net işletme gelirinin değerine veya satın alma fiyatına oranıdır. Yatırımcının toplam getirisi değildir.

**Doluluk:** alan veya birimlerin ne kadarının kullanıldığını gösterir. Fiziksel ve ekonomik doluluk farklı olabilir.

**Lease-up (kiralama dönemi):** mülk istikrarlı doluluk seviyesine ulaşana kadar kiracı veya sakin kazanma sürecidir.

## Son değerlendirme

Dört etiket, durum tespitinin başlangıcı olarak kullanılmalıdır. Mevcut gelire, gereken çalışmaya, finansmana, varsayımlara ve olumsuz senaryolara odaklanın. Gerçek plan ve dayanakları, ona verilen isimden daha önemlidir.
`;

export const FLAGSHIP_LEARNING_RESOURCE: LearningResourceDetail = {
  id: "fixture-core-strategies",
  slug: "core-core-plus-value-add-opportunistic-real-estate",
  resourceType: "guide",
  categoryKey: "investment-fundamentals",
  audience: "investor_and_professional",
  versionId: "fixture-core-strategies-v1",
  version: 1,
  title: {
    en: "Understanding Core, Core-Plus, Value-Add and Opportunistic Real Estate",
    tr: "Core, Core-Plus, Value-Add ve Opportunistic Gayrimenkul Stratejileri",
  },
  summary: {
    en: "Learn how the four common real estate strategies differ in income stability, required work, financing, execution risk and sources of return.",
    tr: "Dört yaygın gayrimenkul stratejisinin gelir istikrarı, gereken çalışma, finansman, uygulama riski ve getiri kaynakları açısından nasıl ayrıldığını öğrenin.",
  },
  readingMinutes: { en: 10, tr: 11 },
  effectiveAt: "2026-07-18T00:00:00.000Z",
  publishedAt: "2026-07-18T00:00:00.000Z",
  reviewedAt: "2026-07-18T00:00:00.000Z",
  bodyMarkdown: { en: EN_BODY.trim(), tr: TR_BODY.trim() },
  disclaimer: {
    en: "Educational information only. This guide is not investment, legal, tax or suitability advice and does not recommend any investment or strategy.",
    tr: "Yalnızca eğitim amaçlı bilgidir. Bu rehber yatırım, hukuk, vergi veya uygunluk tavsiyesi değildir ve herhangi bir yatırım ya da strateji önermez.",
  },
  sources: [
    {
      id: "uli-strategies",
      title: "Five Trends in Commercial Real Estate to Watch",
      url: "https://urbanland.uli.org/economy-markets-trends/five-trends-commercial-real-estate-watch-2017-2",
      publisher: "Urban Land Institute",
      accessedAt: "2026-07-18",
      sortOrder: 0,
    },
    {
      id: "pgim-core-plus",
      title: "Core Plus Equity",
      url: "https://www.pgim.com/de/en/institutional/investments/strategies/alternatives/real-assets/real-estate/core-plus-equity",
      publisher: "PGIM Real Estate",
      accessedAt: "2026-07-18",
      sortOrder: 1,
    },
    {
      id: "valiance-strategies",
      title: "Understanding Core, Core Plus, Value-Add, and Opportunistic Investments",
      url: "https://valiancecap.com/investor-resources/understanding-core-core-plus-value-add-and-opportunistic-investments/",
      publisher: "Valiance Capital",
      accessedAt: "2026-07-18",
      notes: "Used as contextual manager commentary; firm-specific return claims are not reproduced.",
      sortOrder: 2,
    },
  ],
};

export function learningCategoryLabel(categoryKey: string): LocalizedText {
  return LEARNING_CATEGORIES[categoryKey] ?? { en: categoryKey, tr: categoryKey };
}

export function learningSummary(resource: LearningResourceDetail): LearningResourceSummary {
  return {
    id: resource.id,
    slug: resource.slug,
    resourceType: resource.resourceType,
    categoryKey: resource.categoryKey,
    audience: resource.audience,
    versionId: resource.versionId,
    version: resource.version,
    title: resource.title,
    summary: resource.summary,
    readingMinutes: resource.readingMinutes,
    effectiveAt: resource.effectiveAt,
    publishedAt: resource.publishedAt,
    reviewedAt: resource.reviewedAt,
  };
}
