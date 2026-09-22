"use client";

import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useLang } from "@/lib/i18n/LanguageProvider";
import styles from "./ThankYouLayout.module.css";

const WA_URL = "https://wa.me/16473913311";

interface ThankYouLayoutProps {
  guideType: "alici" | "satici";
  guidePdfPath: string;
}

export default function ThankYouLayout({
  guideType,
  guidePdfPath,
}: ThankYouLayoutProps) {
  const { lang, t } = useLang();
  const c = t.thankYou;
  const guide = guideType === "alici" ? t.aliciThanks : t.saticiThanks;

  // The first steps open WhatsApp with a pre-filled message; the last one
  // cross-links to the other guide, which stays inside the current locale.
  const steps = [
    ...guide.steps.map((step) => ({
      ...step,
      href: `${WA_URL}?text=${encodeURIComponent(step.wa)}`,
      external: true,
    })),
    {
      ...guide.crossStep,
      href: `/${lang}/rehber/${guideType === "alici" ? "satici" : "alici"}`,
      external: false,
    },
  ];

  return (
    <main>
      <Nav />

      {/* Hero / Success */}
      <section className={styles.hero}>
        <div className={styles.watermark} aria-hidden="true">
          <Image
            src="/logos/HUNTER_Brandmark_Gold.png"
            alt=""
            width={720}
            height={720}
          />
        </div>

        <div className={`container ${styles.heroInner}`}>
          <div className={styles.check}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M6 14l5 5 11-11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span className={styles.eyebrow}>
            <span className={styles.hairline} />
            {c.eyebrow}
          </span>

          <h1 className={styles.heading}>
            {c.title} <em>{c.titleEm}</em>
          </h1>

          <p className={styles.intro}>{guide.intro}</p>

          {/* Direct download button, works even if email hasn't arrived yet */}
          <a
            href={guidePdfPath}
            download
            className={styles.downloadBtn}
            data-guide={guideType}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1v10M4 7l4 4 4-4M2 14h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {c.download.replace("{guide}", guide.guideName)}
          </a>
        </div>
      </section>

      {/* Next Steps */}
      <section className={styles.nextSection}>
        <div className="container">
          <div className={styles.nextHead}>
            <span className={styles.eyebrowDark}>
              <span className={styles.hairlineDark} />
              {c.nextEyebrow}
            </span>
            <h2 className={styles.nextTitle}>
              {c.nextTitle} <em>{c.nextTitleEm}</em>
            </h2>
          </div>

          <div className={styles.nextGrid}>
            {steps.map((step, i) => {
              const arrow = (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path
                    d="M10 1l5 5-5 5M15 6H1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              );

              return (
                <article key={step.title} className={styles.stepCard}>
                  <span className={styles.stepNumber}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                  {step.external ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.stepCta}
                    >
                      {step.cta}
                      {arrow}
                    </a>
                  ) : (
                    <Link href={step.href} className={styles.stepCta}>
                      {step.cta}
                      {arrow}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sign-off */}
      <section className={styles.signoff}>
        <div className="container">
          <p className={styles.signoffQuote}>&ldquo;{c.quote}&rdquo;</p>
          <p className={styles.signoffName}>{c.signoffName}</p>
          <div className={styles.signoffContact}>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.signoffBtn}
            >
              {c.whatsappCta}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
