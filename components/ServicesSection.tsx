"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./ServicesSection.module.css";

// Each firm's lockup is cropped to its ink and lettered in the RE/MAX cream,
// so one CSS height gives all three the same height.
const LOGOS = {
  buy: { src: "/logos/practices/remax-hallmark.png", width: 956, height: 148 },
  mortgage: { src: "/logos/practices/rma.svg", width: 1619, height: 174 },
  invest: { src: "/logos/practices/parvis.svg", width: 886, height: 195 },
};

export default function ServicesSection() {
  const t = useT();
  const s = t.home.services;

  // Informational cards: each practice is named by the firm that provides it.
  // Licence details live in the footer.
  const CARDS = [
    { ...s.buy, logo: LOGOS.buy },
    { ...s.mortgage, logo: LOGOS.mortgage },
    { ...s.invest, logo: LOGOS.invest },
  ];

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
              {/* The logo is the only place the firm is named, so it carries
                  the name as alt text. */}
              <Image
                src={card.logo.src}
                alt={card.tag}
                width={card.logo.width}
                height={card.logo.height}
                sizes="240px"
                className={styles.cardLogo}
              />
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
