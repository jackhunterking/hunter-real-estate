import type { Metadata } from "next";
import AliciClient from "./AliciClient";

export const metadata: Metadata = {
  title: "Alım Rehberi, Ücretsiz İndir",
  description:
    "Kanada'da mülk satın almanın profesyonel yol haritası. Ücretsiz görüntüleyin veya indirin.",
};

export default function AliciRehber() {
  return <AliciClient />;
}
