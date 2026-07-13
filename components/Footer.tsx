"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageProvider";
import styles from "./Footer.module.css";

const WA_URL = "https://wa.me/16473913311";

export default function Footer() {
  const t = useT();
  const f = t.footer;
  const n = t.nav;

  const NAV = [
    { href: "/", label: n.home },
    { href: "/#hakkimizda", label: n.about },
    { href: "/#hizmetler", label: n.services },
    { href: "/mortgage", label: n.mortgage },
    { href: "/rehber/ogren", label: t.ogren.label },
    { href: "/hunter-group-capital", label: n.capital },
    { href: "/#kaynaklar", label: n.resources },
    { href: "/#iletisim", label: n.contact },
  ];

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          {/* Brand column */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo} aria-label={f.logoAria}>
              <Image
                src="/logos/HUNTER_Brandmark_Gold.png"
                alt={f.logoAria}
                width={80}
                height={80}
              />
              <span className={styles.logoText}>
                Hunter Group<br />Real Estate
              </span>
            </Link>
            <p className={styles.promise}>{f.promise}</p>
          </div>

          {/* Site nav column */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>{f.navHeading}</h4>
            <ul className={styles.navList}>
              {NAV.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.navLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>{f.contactHeading}</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>{f.address}</li>
              <li>
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactLink}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {f.waLabel}
                </a>
              </li>
            </ul>
          </div>

          {/* Social column */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>{f.socialHeading}</h4>
            <div className={styles.socials}>
              <a
                href="https://www.instagram.com/jack.ve.tara.remax/"
                aria-label={f.instagramAria}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/jack.ve.tara.remax"
                aria-label={f.facebookAria}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div>&copy; {new Date().getFullYear()} {f.copy}</div>
          <div>jackhunter.com</div>
        </div>
      </div>
    </footer>
  );
}
