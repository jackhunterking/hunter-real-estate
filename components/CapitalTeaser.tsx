"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./CapitalTeaser.module.css";

/* Small JV diagram (matches the Hunter & Hunter Investment Advisory experience) */
function JVMark() {
  return (
    <svg width="48" height="32" viewBox="0 0 84 56" fill="none" aria-hidden="true">
      <line x1="14" y1="28" x2="42" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="14" y1="28" x2="42" y2="42" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="42" y1="14" x2="70" y2="28" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="42" y1="42" x2="70" y2="28" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="42" y1="14" x2="42" y2="42" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <circle cx="14" cy="28" r="6" stroke="currentColor" strokeWidth="1.4" fill="#05070d" />
      <circle cx="42" cy="14" r="6" stroke="currentColor" strokeWidth="1.4" fill="#05070d" />
      <circle cx="42" cy="42" r="6" stroke="currentColor" strokeWidth="1.4" fill="#05070d" />
      <circle cx="70" cy="28" r="6" stroke="currentColor" strokeWidth="1.4" fill="#05070d" />
    </svg>
  );
}

function SoloMark() {
  return (
    <svg width="40" height="32" viewBox="0 0 84 56" fill="none" aria-hidden="true">
      <circle cx="42" cy="28" r="22" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.4" />
      <circle cx="42" cy="28" r="14" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
      <circle cx="42" cy="28" r="8" stroke="currentColor" strokeWidth="1.4" fill="#05070d" />
    </svg>
  );
}

export default function CapitalTeaser() {
  const t = useT();
  const c = t.capitalTeaser;

  return (
    <section className={styles.section} id="hunter-advisory-teaser">
      <div className={styles.media}>
        <Image
          src="/hunter-x-bg.png"
          alt=""
          fill
          sizes="100vw"
          className={styles.photo}
        />
      </div>
      <div className={styles.overlay} aria-hidden="true" />

      <div className="container">
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.hairline} />
            {c.eyebrow}
            <span className={`${styles.hairline} ${styles.hairlineRight}`} />
          </span>

          <h2 className={styles.title}>
            {c.title} <em>{c.titleEm}</em>
          </h2>

          <p className={styles.sub}>{c.sub}</p>

          <div className={styles.paths}>
            <div className={styles.path}>
              <div className={styles.pathMark}><JVMark /></div>
              <div className={styles.pathBody}>
                <span className={styles.pathNum}>01</span>
                <span className={styles.pathLabel}>{c.path1Label}</span>
                <span className={styles.pathMin}>{c.path1Min}</span>
              </div>
            </div>

            <div className={styles.pathDivider} aria-hidden="true" />

            <div className={styles.path}>
              <div className={styles.pathMark}><SoloMark /></div>
              <div className={styles.pathBody}>
                <span className={styles.pathNum}>02</span>
                <span className={styles.pathLabel}>{c.path2Label}</span>
                <span className={styles.pathMin}>{c.path2Min}</span>
              </div>
            </div>
          </div>

          <Link href="/investing" className={styles.cta}>
            {c.cta}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
              <path
                d="M10 1l5 5-5 5M15 6H1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
