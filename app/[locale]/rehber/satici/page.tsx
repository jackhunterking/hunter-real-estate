import type { Metadata } from "next";
import SaticiClient from "./SaticiClient";

export const metadata: Metadata = {
  title: "Satım Rehberi, Ücretsiz İndir",
  description:
    "Mülkünüzü en iyi koşullarda satmanın profesyonel stratejisi. Ücretsiz görüntüleyin veya indirin.",
};

export default function SaticiRehber() {
  return <SaticiClient />;
}
