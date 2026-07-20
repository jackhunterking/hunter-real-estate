import type { Metadata } from "next";
import localFont from "next/font/local";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { PostHogProvider } from "./providers";
import "./globals.css";
import "./theme.css";

// Vendored locally (variable fonts) so compile needs no network — see app/fonts/.
const notoSerif = localFont({
  src: "./fonts/NotoSerif.woff2",
  weight: "400 900",
  style: "normal",
  variable: "--font-serif",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/Manrope.woff2",
  weight: "300 700",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jackhunter.com"),
  title: {
    default: "Hunter Group Real Estate, Toronto Merkezli Türk Emlak Grubu",
    template: "%s | Hunter Group Real Estate",
  },
  description:
    "Toronto Merkezli Türk Emlak Grubu. Jack & Tara Hunter, RE/MAX Hallmark ile Toronto ve GTA'da alım, satım ve yatırım.",
  alternates: {
    canonical: "https://jackhunter.com",
  },
  icons: {
    icon: [
      { url: "/logos/HUNTER_Brandmark_Gold.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Hunter Group Real Estate, Toronto Merkezli Türk Emlak Grubu",
    description: "Toronto Merkezli Türk Emlak Grubu. Jack & Tara Hunter, RE/MAX Hallmark.",
    type: "website",
    locale: "tr_TR",
    siteName: "Hunter Group Real Estate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${notoSerif.variable} ${manrope.variable}`}>
      <body>
        <PostHogProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
