import type { Metadata } from "next";

// The document shell (<html>/<body>), fonts, and providers live in the
// locale-aware layout at app/[locale]/layout.tsx so that <html lang> is
// server-authoritative per URL. This root layout stays a passthrough — required
// by Next.js so root-level special files (not-found, etc.) have a layout — and
// carries only site-wide, locale-independent metadata defaults.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jackhunter.com",
  ),
  icons: {
    icon: [{ url: "/logos/HUNTER_Brandmark_Gold.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
