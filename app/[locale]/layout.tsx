import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { routing } from "@/i18n/routing";
import { dictionaries, type Lang } from "@/lib/i18n/dictionaries";
import { PostHogProvider } from "../providers";
import { IntercomMessenger } from "@/components/intercom/IntercomMessenger";
import { STYLESHEET_RECOVERY } from "@/lib/stylesheet-recovery";
import "../globals.css";
import "../theme.css";

// Vendored locally (variable fonts) so compile needs no network — see app/fonts/.
const notoSerif = localFont({
  src: "../fonts/NotoSerif.woff2",
  weight: "400 900",
  style: "normal",
  variable: "--font-serif",
  display: "swap",
});

const manrope = localFont({
  src: "../fonts/Manrope.woff2",
  weight: "300 700",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});

// OpenGraph locale tag per app locale.
const OG_LOCALE: Record<Lang, string> = {
  tr: "tr_TR",
  en: "en_CA",
  fr: "fr_FR",
  es: "es_ES",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang: Lang = hasLocale(routing.locales, locale)
    ? (locale as Lang)
    : routing.defaultLocale;
  const meta = dictionaries[lang].siteMeta;

  // hreflang cluster: every locale points at its own home, plus x-default → en.
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `/${l}`;
  languages["x-default"] = `/${routing.defaultLocale}`;

  return {
    title: {
      default: meta.title,
      template: `%s | ${meta.siteName}`,
    },
    description: meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      locale: OG_LOCALE[lang],
      alternateLocale: routing.locales
        .filter((l) => l !== lang)
        .map((l) => OG_LOCALE[l]),
      siteName: meta.siteName,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering for this locale subtree.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${notoSerif.variable} ${manrope.variable}`}>
      <body>
        <PostHogProvider>
          {/* next-intl provider for server + future useTranslations consumers. */}
          <NextIntlClientProvider>
            {/* Bridge the URL locale into the existing dictionary context so the
                ~60 useT()/useLang() consumers keep working, now server-driven. */}
            <LanguageProvider lang={locale}>{children}</LanguageProvider>
          </NextIntlClientProvider>
        </PostHogProvider>
        {/* Intercom Messenger — anonymous on the marketing site, identified
            (with a server-signed HS256 JWT) once a portal session exists. It
            renders nothing itself, so it sits outside the providers. */}
        <IntercomMessenger locale={locale} />
        {/* Inline on purpose: when a stylesheet 404s, the layout's JS chunk
            fails with it, so anything React-mounted would never run. This is
            written straight into the HTML and needs no chunk to execute. */}
        <script dangerouslySetInnerHTML={{ __html: STYLESHEET_RECOVERY }} />
      </body>
    </html>
  );
}
