import type { Metadata } from "next";
import ThankYouLayout from "@/components/ThankYouLayout";

export const metadata: Metadata = {
  title: "Alıcı Rehberi, Teşekkür Ederiz",
  description: "Ev Alma Rehberiniz hazır. Kanada'da hayalinizdeki mülke giden yolda yanınızdayız.",
};

const ALICI_STEPS = [
  {
    number: "01",
    title: "Mortgage Ön Onayı",
    description:
      "Bütçenizi netleştirmenin ilk adımı. Doğru profesyonelle bağlantı kuralım.",
    href: "https://wa.me/16473913311?text=Mortgage%20%C3%96n%20Onay%C4%B1%20Hakk%C4%B1nda%20g%C3%B6r%C3%BC%C5%9Fmek%20istiyorum.",
    cta: "Görüşme Talep Et",
  },
  {
    number: "02",
    title: "Tercihlerinizi Konuşalım",
    description:
      "Mahalle, bütçe, zaman çizelgesi. Sizin için doğru fırsatları bulalım.",
    href: "https://wa.me/16473913311?text=Al%C4%B1c%C4%B1%20konsültasyonu%20hakk%C4%B1nda%20g%C3%B6r%C3%BC%C5%9Fmek%20istiyorum.",
    cta: "Konsültasyon Al",
  },
  {
    number: "03",
    title: "Satıcı Rehberine Göz At",
    description:
      "Satmayı da düşünüyorsanız, profesyonel satış stratejimizi inceleyin.",
    href: "/rehber/satici",
    cta: "Satıcı Rehberini Gör",
  },
];

export default function AliciTesekkur() {
  return (
    <ThankYouLayout
      guideType="alici"
      guideName="Alıcı Rehberi"
      guidePdfPath="/guides/ev-alma-rehberi.pdf"
      intro="Kanada'da mülk sahibi olmanın profesyonel yol haritası e-postanıza gönderildi. Bu arada, aşağıdaki adımlarla devam edebilirsiniz."
      nextSteps={ALICI_STEPS}
    />
  );
}
