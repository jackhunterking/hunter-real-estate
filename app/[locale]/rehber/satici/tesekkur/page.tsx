import type { Metadata } from "next";
import ThankYouLayout from "@/components/ThankYouLayout";

export const metadata: Metadata = {
  title: "Satıcı Rehberi, Teşekkür Ederiz",
  description: "Ev Satma Rehberiniz hazır. Mülkünüzü en iyi koşullarda satmak için yanınızdayız.",
};

const SATICI_STEPS = [
  {
    number: "01",
    title: "Mülkünüzün Değerini Öğrenin",
    description:
      "Profesyonel piyasa analizi ile mülkünüzün gerçek değerini birlikte belirleyelim.",
    href: "https://wa.me/16473913311?text=Mülkümün%20değerini%20öğrenmek%20istiyorum.",
    cta: "Değer Analizi İste",
  },
  {
    number: "02",
    title: "Satış Stratejisi",
    description:
      "Fiyatlandırma, staging, pazarlama. Maksimum getiri için planı birlikte kuralım.",
    href: "https://wa.me/16473913311?text=Sat%C4%B1c%C4%B1%20konsültasyonu%20hakk%C4%B1nda%20g%C3%B6r%C3%BC%C5%9Fmek%20istiyorum.",
    cta: "Konsültasyon Al",
  },
  {
    number: "03",
    title: "Alıcı Rehberine Göz At",
    description:
      "Almayı da düşünüyorsanız, profesyonel alım stratejimizi inceleyin.",
    href: "/rehber/alici",
    cta: "Alıcı Rehberini Gör",
  },
];

export default function SaticiTesekkur() {
  return (
    <ThankYouLayout
      guideType="satici"
      guideName="Satıcı Rehberi"
      guidePdfPath="/guides/ev-satma-rehberi.pdf"
      intro="Mülkünüzü en iyi koşullarda satmak için profesyonel strateji e-postanıza gönderildi. Bu arada, aşağıdaki adımlarla devam edebilirsiniz."
      nextSteps={SATICI_STEPS}
    />
  );
}
