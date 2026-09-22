"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./GuidesSection.module.css";

export default function GuidesSection() {
  const t = useT();
  const g = t.home.guides;

  const GUIDES = [
    {
      href: "/guides/alis-rehberi.pdf",
      label: g.card1Label,
      title: g.card1Title,
      description: g.card1Desc,
      icon: "M8 28L32 10l24 18v26H8V28z M26 54V38h12v16",
    },
    {
      href: "/guides/satis-rehberi.pdf",
      label: g.card2Label,
      title: g.card2Title,
      description: g.card2Desc,
      icon: "M10 22L32 10l22 12v32H10V22z M22 54V36h20v18",
    },
  ];

  return (
    <section className={styles.section} id="kaynaklar">
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            <span className={styles.hairline} />
            {g.eyebrow}
            <span className={`${styles.hairline} ${styles.hairlineRight}`} />
          </span>
          <h2 className={styles.title}>
            {g.title} <em>{g.titleEm}</em>
          </h2>
          <p className={styles.sub}>{g.sub}</p>
        </div>

        <div className={styles.grid}>
          {GUIDES.map((guide) => (
            <a
              key={guide.href}
              href={guide.href}
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.cardTop}>
                <svg
                  className={styles.icon}
                  width="40"
                  height="40"
                  viewBox="0 0 64 64"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d={guide.icon}
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className={styles.label}>{guide.label}</span>
              <h3 className={styles.cardTitle}>{guide.title}</h3>
              <p className={styles.cardDesc}>{guide.description}</p>
              <span className={styles.cta}>
                {g.cta}
                <svg width="14" height="10" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                  <path
                    d="M10 1l5 5-5 5M15 6H1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
