"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./ServicesSection.module.css";

export default function ServicesSection() {
  const t = useT();
  const s = t.home.services;

  // Informational cards: each practice is named by the firm that provides it.
  // Licence details live in the footer.
  const CARDS = [s.buy, s.mortgage, s.invest];

  return (
    <section className={styles.services} id="hizmetler">
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            <span className={styles.hairline} />
            {s.eyebrow}
            <span className={`${styles.hairline} ${styles.hairlineRight}`} />
          </span>
          <h2 className={styles.title}>
            {s.title} <em>{s.titleEm}</em>
          </h2>
          <p className={styles.sub}>{s.sub}</p>
        </div>

        <div className={styles.grid}>
          {CARDS.map((card) => (
            <article key={card.tag} className={styles.card}>
              {/* Firm names are English: keep Turkish casing from turning
                  "Associates" into "ASSOCİATES" under text-transform. */}
              <span className={styles.cardTag} lang="en">{card.tag}</span>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
