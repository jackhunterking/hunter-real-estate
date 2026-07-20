"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

const COPY = {
  tr: {
    title: "Yasal bilgiler ve platform açıklamaları",
    intro: "Hunter & Hunter Yatırım Danışmanlığı, Kanada’daki özel gayrimenkul ve alternatif yatırım fırsatları için araştırma, hesap, ilgi kaydı ve insan destekli inceleme akışları sağlar. Menkul kıymet kaydı gerektiren faaliyetler Parvis Investment Services Inc. aracılığıyla ve Parvis gözetiminde yürütülür.",
    sections: [
      ["Teklif materyalleri", "Yayımlanmış fon sayfaları kontrollü teklif materyali olarak ele alınır. Her sürüm; kaynak, geçerlilik tarihi, yazar, inceleyen ve uyum sahibiyle onaylanır. Hedefler garanti değildir ve geri çekilen içerik kamu görünümünden çıkarılır."],
      ["Uygunluk ve suitability", "Hesap yolu, profil yanıtları veya ilgi talebi; akredite yatırımcı statüsü, muafiyet, suitability, fon izni veya tamamlanmış işlem oluşturmaz. Menkul kıymet kaydı gerektiren kararlar Parvis’in onaylı sürecinde doğrulanır."],
      ["Türkiye ve sınır ötesi erişim", "Türkiye’de ikamet eden kişilerin erişimi ve sonraki tüm faaliyetleri ayrıca yetki alanı ve Parvis uyum incelemesine tabidir. Ontario kaydı herhangi bir Türkiye kaydı veya yetkisi olarak sunulmaz."],
      ["Gizlilik ve iletişim", "İlgi talepleri, seçilen iletişim kanalı ve açık izinle kaydedilir. WhatsApp bağlantıları yalnızca fon slug bilgisini içerir. Canlı sohbet sağlayıcısı seçilene ve gerekli izin alınana kadar üçüncü taraf sohbet betiği yüklenmez."],
    ],
    sources: "Düzenleyici kaynaklar",
    back: "Keşfet'e dön",
  },
  en: {
    title: "Legal information and platform disclosures",
    intro: "Hunter & Hunter Investment Advisory supports research, accounts, interest records, and human-assisted review for Canadian private real estate and alternative investment opportunities. Activities requiring securities registration are conducted through and supervised by Parvis Investment Services Inc.",
    sections: [
      ["Offering material", "Published fund pages are treated as controlled offering material. Each version is approved with its sources, effective date, author, reviewer, and compliance owner. Targets are not guarantees, and withdrawn content is removed from public view."],
      ["Eligibility and suitability", "An account path, profile response, or interest request does not establish accredited-investor status, an exemption, suitability, fund permission, or a completed transaction. Decisions requiring securities registration are verified through Parvis’s approved process."],
      ["Türkiye and cross-border access", "Access by residents of Türkiye and any further activity are subject to separate jurisdictional and Parvis compliance review. Ontario registration is not presented as Turkish registration or authorization."],
      ["Privacy and contact", "Interest requests record the selected channel and explicit contact consent. WhatsApp links contain only a fund slug. No third-party chat script loads until a provider is selected and the required consent is obtained."],
    ],
    sources: "Regulatory sources",
    back: "Return to Discover",
  },
} as const;

export function HncLegal() {
  const { lang } = useLang();
  const c = COPY[lang];
  return <main className="min-h-screen bg-[#f7f4ed] text-[#172b3a]"><header className="bg-[#071c2c] px-5 py-5 text-white"><div className="mx-auto max-w-5xl"><NorthBrand /></div></header><article className="mx-auto max-w-5xl px-5 py-16 sm:py-24"><h1 className="max-w-3xl font-serif text-4xl font-semibold sm:text-5xl">{c.title}</h1><p className="mt-6 max-w-3xl text-base leading-8 text-[#5f6d77]">{c.intro}</p><DealerDisclosure level="full" className="mt-10" /><div className="mt-6 grid gap-5 md:grid-cols-2">{c.sections.map(([title, body]) => <section key={title} className="border border-[#d8d1c2] bg-white p-6"><h2 className="font-serif text-2xl font-semibold">{title}</h2><p className="mt-4 text-sm leading-7 text-[#65727b]">{body}</p></section>)}</div><section className="mt-6 border border-[#d8d1c2] bg-white p-6"><h2 className="font-semibold">{c.sources}</h2><div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[#0a4b72]"><a href="https://www.osc.ca/sites/default/files/2023-05/rule_20220921_45-501cp_unofficial-consolidation.pdf" target="_blank" rel="noreferrer">OSC Rule 45-501 Companion Policy</a><a href="https://spk.gov.tr/kurumlar/fonlar/yatirim-fonlari/yabanci-yatirim-fonlari/tanitim-rehberi" target="_blank" rel="noreferrer">SPK Foreign Investment Fund Guidance</a></div></section><Link href={NORTH_BASE} className="mt-8 inline-flex h-11 items-center bg-[#0a2d46] px-5 text-sm font-semibold text-white">{c.back}</Link></article></main>;
}
