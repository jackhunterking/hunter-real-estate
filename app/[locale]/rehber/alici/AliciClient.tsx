"use client";

import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./page.module.css";

const GUIDE_URL =
  "https://drive.google.com/file/d/19rJFJmGST33V_kc5H-H7Z0yA_CHXaWl8/view?usp=sharing";

export default function AliciClient() {
  const t = useT();
  const a = t.alici;

  return (
    <main>
      <Nav />
      <section className={styles.page}>
        <div className="container">
          <div className={styles.head}>
            <span className={styles.eyebrow}>
              <span className={styles.hairline} />
              {a.eyebrow}
            </span>
            <h1 className={styles.title}>
              {a.title} <em>{a.titleEm}</em>
            </h1>
            <p className={styles.sub}>{a.sub}</p>
          </div>

          <div className={styles.mockupWrap}>
            <Image
              src="/alis-rehberi-mockup.png"
              alt={a.alt}
              width={3000}
              height={1650}
              className={styles.mockup}
              priority
            />
          </div>

          <div className={styles.actions}>
            <a
              href={GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnPrimary}
            >
              {a.cta}
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                <path
                  d="M10 1l5 5-5 5M15 6H1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
