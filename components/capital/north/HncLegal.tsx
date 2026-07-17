"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

const COPY = {
  tr: {
    title: "Yasal bilgiler ve platform açıklamaları",
    intro: "Hunter North Capital araştırma, hesap, ilgi kaydı ve insan destekli inceleme akışları sağlar. Platform çevrimiçi menkul kıymet alımı, ödeme veya abonelik işlemi gerçekleştirmez.",
    sections: [
      ["Teklif materyalleri", "Yayımlanmış fon sayfaları kontrollü teklif materyali olarak ele alınır. Her sürüm; kaynak, geçerlilik tarihi, yazar, inceleyen ve uyum sahibiyle onaylanır. Hedefler garanti değildir ve geri çekilen içerik kamu görünümünden çıkarılır."],
      ["Uygunluk ve suitability", "Hesap yolu, profil yanıtları veya ilgi talebi; akredite yatırımcı statüsü, muafiyet, suitability, fon izni veya yatırım tavsiyesi oluşturmaz. Bunlar ilgili lisanslı taraflarca doğrulanır."],
      ["Türkiye ve sınır ötesi erişim", "Türkiye'ye fon özel pazarlama veya satış yönlendirmesi yapılmadan önce ayrı Kanada ve Türkiye uyum onayı gerekir. SPL veya firma bilgisi sunmak partner erişimini otomatik açmaz."],
      ["Gizlilik ve iletişim", "İlgi talepleri, seçilen iletişim kanalı ve açık izinle kaydedilir. WhatsApp bağlantıları yalnızca fon slug bilgisini içerir. Canlı sohbet sağlayıcısı seçilene ve gerekli izin alınana kadar üçüncü taraf sohbet betiği yüklenmez."],
    ],
    sources: "Düzenleyici kaynaklar",
    back: "Fonlara dön",
  },
  en: {
    title: "Legal information and platform disclosures",
    intro: "Hunter North Capital supports research, accounts, interest records, and human-assisted review. The platform does not execute an online securities purchase, payment, or subscription.",
    sections: [
      ["Offering material", "Published fund pages are treated as controlled offering material. Each version is approved with its sources, effective date, author, reviewer, and compliance owner. Targets are not guarantees, and withdrawn content is removed from public view."],
      ["Eligibility and suitability", "An account path, profile response, or interest request does not establish accredited-investor status, an exemption, suitability, fund permission, or investment advice. Applicable licensed parties must verify these matters."],
      ["Türkiye and cross-border access", "Separate Canadian and Turkish compliance approval is required before fund-specific marketing or sales direction is provided to Türkiye. Submitting SPL or firm information never activates partner access automatically."],
      ["Privacy and contact", "Interest requests record the selected channel and explicit contact consent. WhatsApp links contain only a fund slug. No third-party chat script loads until a provider is selected and the required consent is obtained."],
    ],
    sources: "Regulatory sources",
    back: "Return to funds",
  },
} as const;

export function HncLegal() {
  const { lang } = useLang();
  const c = COPY[lang];
  return <main className="min-h-screen bg-[#f7f4ed] text-[#172b3a]"><header className="bg-[#071c2c] px-5 py-5 text-white"><div className="mx-auto max-w-5xl"><NorthBrand /></div></header><article className="mx-auto max-w-5xl px-5 py-16 sm:py-24"><h1 className="max-w-3xl font-serif text-4xl font-semibold sm:text-5xl">{c.title}</h1><p className="mt-6 max-w-3xl text-base leading-8 text-[#5f6d77]">{c.intro}</p><div className="mt-12 grid gap-5 md:grid-cols-2">{c.sections.map(([title, body]) => <section key={title} className="border border-[#d8d1c2] bg-white p-6"><h2 className="font-serif text-2xl font-semibold">{title}</h2><p className="mt-4 text-sm leading-7 text-[#65727b]">{body}</p></section>)}</div><section className="mt-6 border border-[#d8d1c2] bg-white p-6"><h2 className="font-semibold">{c.sources}</h2><div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[#0a4b72]"><a href="https://www.osc.ca/sites/default/files/2023-05/rule_20220921_45-501cp_unofficial-consolidation.pdf" target="_blank" rel="noreferrer">OSC Rule 45-501 Companion Policy</a><a href="https://spk.gov.tr/kurumlar/fonlar/yatirim-fonlari/yabanci-yatirim-fonlari/tanitim-rehberi" target="_blank" rel="noreferrer">SPK Foreign Investment Fund Guidance</a></div></section><Link href={NORTH_BASE} className="mt-8 inline-flex h-11 items-center bg-[#0a2d46] px-5 text-sm font-semibold text-white">{c.back}</Link></article></main>;
}
