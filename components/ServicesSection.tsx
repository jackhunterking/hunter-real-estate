"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageProvider";
import { RMA } from "@/lib/mortgage/identity";
import styles from "./ServicesSection.module.css";

export default function ServicesSection() {
  const t = useT();
  const s = t.home.services;

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
          <Link href="/rehber/alici" className={styles.card}>
            <span className={styles.cardTag}>{s.buy.tag}</span>
            <h3 className={styles.cardTitle}>{s.buy.title}</h3>
            <p className={styles.cardDesc}>{s.buy.desc}</p>
            <span className={styles.cardCta}>{s.buy.homeLabel} →</span>
          </Link>

          <Link href="/mortgage" className={styles.card}>
            <span className={styles.cardTag}>{s.mortgage.tag}</span>
            <h3 className={styles.cardTitle}>{s.mortgage.title}</h3>
            <p className={styles.cardDesc}>{s.mortgage.desc}</p>
            <p className={styles.cardDisclosure}>{RMA.licenceLine}</p>
            <span className={styles.cardCta}>{s.mortgage.cta} →</span>
          </Link>

          <Link href="/hunter-advisory" className={styles.card}>
            <span className={styles.cardTag}>{s.invest.tag}</span>
            <h3 className={styles.cardTitle}>{s.invest.title}</h3>
            <p className={styles.cardDesc}>{s.invest.desc}</p>
            <span className={styles.cardCta}>{s.invest.cta} →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
