"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./MortgageTeaser.module.css";

export default function MortgageTeaser() {
  const t = useT();
  const f = t.mortgage;

  return (
    <section className={styles.section} id="mortgage-teaser">
      <div className="container">
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.hairline} />
            {f.teaser.eyebrow}
            <span className={`${styles.hairline} ${styles.hairlineRight}`} />
          </span>

          <h2 className={styles.title}>
            {f.teaser.title} <em>{f.teaser.titleEm}</em>
          </h2>

          <p className={styles.sub}>{f.teaser.sub}</p>

          <div className={styles.services}>
            {f.teaser.services.map((service) => (
              <article key={service.title} className={styles.service}>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>

          <Link href="/mortgage" className={styles.cta}>
            {f.teaser.cta}
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
