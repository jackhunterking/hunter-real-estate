import type { Metadata, Viewport } from "next";
import InvestorMapClient from "./InvestorMapClient";

// viewport-fit=cover exposes env(safe-area-inset-*) so the map UI can clear the
// mobile browser chrome (status bar / notch / bottom toolbar) in a web view.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#03050a",
};

export const metadata: Metadata = {
  title: "Equiton Investor 3D Map Demo",
  description:
    "Mobile-first verified-address investor visualization for Equiton Apartment Fund exposure.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function InvestorMapPage() {
  return <InvestorMapClient />;
}
