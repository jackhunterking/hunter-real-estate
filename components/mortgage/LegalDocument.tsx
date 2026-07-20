"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MortgageDisclosure from "@/components/mortgage/MortgageDisclosure";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import {
  LEGAL_DOCS,
  LEGAL_LAST_MODIFIED,
  type LegalKey,
} from "@/lib/mortgage/legal";
import styles from "./LegalDocument.module.css";

export default function LegalDocument({ docKey }: { docKey: LegalKey }) {
  const { lang } = useLang();
  const doc = pick(LEGAL_DOCS, lang)[docKey];

  return (
    <main>
      <Nav overlayHero />

      <section className={styles.hero}>
        <div className="container">
          <span className={styles.eyebrow}>{doc.eyebrow}</span>
          <h1 className={styles.title}>{doc.title}</h1>
          <p className={styles.modified}>
            {doc.lastModifiedLabel}: {LEGAL_LAST_MODIFIED}
          </p>
        </div>
      </section>

      <article className={styles.body}>
        <div className="container">
          <div className={styles.inner}>
            {doc.sections.map((section) => (
              <section key={section.heading} className={styles.section}>
                <h2 className={styles.heading}>{section.heading}</h2>
                {section.blocks.map((block, i) => {
                  if (block.kind === "p") {
                    return (
                      <p key={i} className={styles.para}>
                        {block.text}
                      </p>
                    );
                  }
                  if (block.kind === "ul") {
                    return (
                      <ul key={i} className={styles.list}>
                        {block.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <div key={i} className={styles.contact}>
                      <strong className={styles.contactName}>{block.name}</strong>
                      {block.lines.map((line, j) => (
                        <span key={j} className={styles.contactLine}>
                          {line}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </section>
            ))}

            <div className={styles.seeAlso}>
              <span className={styles.seeAlsoLabel}>{doc.seeAlsoLabel}:</span>
              {doc.seeAlso.map((link, i) => (
                <span key={link.href}>
                  {i > 0 ? <span className={styles.sep}>·</span> : null}
                  <Link href={link.href} className={styles.seeAlsoLink}>
                    {link.label}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>

      <MortgageDisclosure />
      <Footer />
    </main>
  );
}
