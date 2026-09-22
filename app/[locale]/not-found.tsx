"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useLang } from "@/lib/i18n/LanguageProvider";
import styles from "./not-found.module.css";

const WA_URL = "https://wa.me/16473913311";

export default function NotFound() {
  const { lang, t } = useLang();
  const n = t.notFound;

  return (
    <main>
      <Nav />
      <section className={styles.page}>
        <div className="container">
          <div className={styles.head}>
            <span className={styles.eyebrow}>
              <span className={styles.hairline} />
              {n.eyebrow}
            </span>
            <h1 className={styles.title}>
              {n.title} <em>{n.titleEm}</em>
            </h1>
            <p className={styles.sub}>{n.sub}</p>
            <div className={styles.actions}>
              <Link href={`/${lang}`} className={styles.btnPrimary}>
                {n.home}
              </Link>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnWhatsapp}
              >
                {n.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
