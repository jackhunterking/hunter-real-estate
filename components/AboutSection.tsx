"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./AboutSection.module.css";

interface PersonProps {
  name: string;
  title: string;
  photoSrc?: string;
  placeholderLabel: string;
}

function PersonCard({
  name,
  title,
  photoSrc,
  placeholderLabel,
}: PersonProps) {
  return (
    <article className={styles.person}>
      <div className={styles.photo}>
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={name}
            fill
            sizes="(min-width: 768px) 280px, 104px"
          />
        ) : (
          <div className={styles.photoPlaceholder}>
            <div className={styles.placeholderMark}>
              <Image
                src="/logos/HUNTER_Brandmark_Gold.png"
                alt=""
                width={80}
                height={80}
              />
            </div>
            <span className={styles.placeholderLabel}>
              ▢ {name} {placeholderLabel}
            </span>
          </div>
        )}
      </div>
      <div className={styles.personBody}>
        <h3 className={styles.personName}>{name}</h3>
        <p className={styles.personTitle}>{title}</p>
      </div>
    </article>
  );
}

export default function AboutSection() {
  const t = useT();
  const a = t.about;

  return (
    <section className={styles.about} id="hakkimizda">
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            <span className={styles.hairline} />
            {a.eyebrow}
          </span>
          <h2 className={styles.title}>
            {a.title} <em>{a.titleEm}</em>
          </h2>
          <p className={styles.subtitle}>{a.sub}</p>
        </div>

        <div className={styles.grid}>
          <PersonCard
            name={a.jackName}
            title={a.jackTitle}
            photoSrc="/team/jack.jpg"
            placeholderLabel={a.photoPlaceholder}
          />
          <PersonCard
            name={a.taraName}
            title={a.taraTitle}
            photoSrc="/team/tara.jpg"
            placeholderLabel={a.photoPlaceholder}
          />
          <PersonCard
            name={a.selinName}
            title={a.selinTitle}
            photoSrc="/team/selin.jpg"
            placeholderLabel={a.photoPlaceholder}
          />
        </div>
      </div>
    </section>
  );
}
