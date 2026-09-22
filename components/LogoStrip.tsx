"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./LogoStrip.module.css";

interface LogoConfig {
  name: string;
  src: string;
  width: number;
  height: number;
  /** Wide wordmarks sit lower than the square award badges. */
  wide?: boolean;
}

// Sits under the team, so every logo is dark artwork on a transparent
// background for the light section.
const LOGOS: LogoConfig[] = [
  { name: "RE/MAX Hallmark", src: "/logos/remax-logo-dark.png", width: 417, height: 112, wide: true },
  { name: "Platinum Club Team", src: "/logos/awards/platinum-club-team.png", width: 250, height: 160 },
  { name: "Executive Club Team", src: "/logos/awards/executive-club-team.png", width: 244, height: 160 },
  { name: "100% Club Team", src: "/logos/awards/100-club-team.png", width: 256, height: 160 },
];

export default function LogoStrip() {
  const t = useT();

  return (
    <section className={styles.strip}>
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.eyebrow}>{t.logoStrip.eyebrow}</div>
          <ul className={styles.row}>
            {LOGOS.map((logo) => (
              <li key={logo.name} className={styles.slot}>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={logo.width}
                  height={logo.height}
                  sizes="160px"
                  className={logo.wide ? `${styles.logo} ${styles.logoWide}` : styles.logo}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
