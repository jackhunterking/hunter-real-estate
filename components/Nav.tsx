"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import styles from "./Nav.module.css";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";

/* Inline flag glyphs (kept small + simple so they read cleanly at 18×12px) */
function FlagTR() {
  return (
    <svg
      className={styles.flag}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="30" height="20" fill="#E30A17" />
      {/* Crescent, outer white circle with inner red circle cutout */}
      <circle cx="11" cy="10" r="4.5" fill="#fff" />
      <circle cx="12.3" cy="10" r="3.5" fill="#E30A17" />
      {/* 5-point star */}
      <polygon
        points="17.4,7.6 18.2,9.6 20.3,9.6 18.6,10.8 19.3,12.8 17.4,11.6 15.5,12.8 16.2,10.8 14.5,9.6 16.6,9.6"
        fill="#fff"
      />
    </svg>
  );
}

function FlagEN() {
  return (
    <svg
      className={styles.flag}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="30" height="20" fill="#012169" />
      {/* Diagonals (white base then red overlay) */}
      <path d="M0,0 L30,20" stroke="#fff" strokeWidth="3" />
      <path d="M30,0 L0,20" stroke="#fff" strokeWidth="3" />
      <path d="M0,0 L30,20" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M30,0 L0,20" stroke="#C8102E" strokeWidth="1.5" />
      {/* Cross (white base then red overlay) */}
      <path d="M15,0 V20" stroke="#fff" strokeWidth="5" />
      <path d="M0,10 H30" stroke="#fff" strokeWidth="5" />
      <path d="M15,0 V20" stroke="#C8102E" strokeWidth="3" />
      <path d="M0,10 H30" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}

function FlagFR() {
  return (
    <svg
      className={styles.flag}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="10" height="20" x="0" fill="#0055A4" />
      <rect width="10" height="20" x="10" fill="#fff" />
      <rect width="10" height="20" x="20" fill="#EF4135" />
    </svg>
  );
}

function FlagES() {
  return (
    <svg
      className={styles.flag}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="30" height="20" fill="#AA151B" />
      <rect width="30" height="10" y="5" fill="#F1BF00" />
    </svg>
  );
}

interface NavProps {
  /** Starts transparent over a dark hero and goes solid on scroll */
  overlayHero?: boolean;
}

export default function Nav({ overlayHero = false }: NavProps) {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const close = () => {
    setOpen(false);
    setServicesOpen(false);
  };

  const SERVICES = [
    { href: "/rehber/alici", label: t.nav.servicesMenu.buy },
    { href: "/rehber/satici", label: t.nav.servicesMenu.sell },
    { href: "/mortgage", label: t.nav.servicesMenu.mortgage },
    { href: INVESTMENT_BASE_PATH, label: t.nav.servicesMenu.invest },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = overlayHero && !scrolled;

  const classes = [
    styles.nav,
    transparent ? styles.transparent : styles.solid,
    open && styles.menuOpen,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label={t.nav.logoAria}>
          <Image
            src="/logos/HUNTER_Brandmark_Gold.png"
            alt={t.nav.logoAria}
            width={80}
            height={80}
            priority
          />
          <span className={styles.logoText}>
            Hunter Group<br className={styles.logoBr} /> Real Estate
          </span>
        </Link>

        <nav className={styles.links}>
          <Link href="/#hakkimizda" className={styles.link} onClick={close}>
            {t.nav.about}
          </Link>

          {/* Services umbrella, dropdown listing the three service lines */}
          <div
            className={`${styles.dropdown} ${servicesOpen ? styles.servicesOpen : ""}`}
          >
            <Link
              href="/#hizmetler"
              className={`${styles.link} ${styles.dropdownToggle}`}
              onClick={(e) => {
                // On the mobile menu, tap expands the submenu instead of navigating
                if (open) {
                  e.preventDefault();
                  setServicesOpen((v) => !v);
                } else {
                  close();
                }
              }}
              aria-expanded={open ? servicesOpen : undefined}
            >
              {t.nav.services}
              <svg
                className={styles.caret}
                width="9"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <div className={styles.dropdownPanel}>
              {SERVICES.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.dropdownItem}
                  onClick={close}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/#kaynaklar" className={styles.link} onClick={close}>
            {t.nav.resources}
          </Link>
          <Link href="/#iletisim" className={styles.link} onClick={close}>
            {t.nav.contact}
          </Link>

          <div className={styles.langToggle} role="group" aria-label="Language">
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "tr" ? styles.langActive : ""}`}
              onClick={() => setLang("tr")}
              aria-pressed={lang === "tr"}
            >
              <FlagTR />
              <span>{t.nav.langTR}</span>
            </button>
            <span className={styles.langSep} aria-hidden="true">|</span>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "en" ? styles.langActive : ""}`}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              <FlagEN />
              <span>{t.nav.langEN}</span>
            </button>
            <span className={styles.langSep} aria-hidden="true">|</span>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "fr" ? styles.langActive : ""}`}
              onClick={() => setLang("fr")}
              aria-pressed={lang === "fr"}
            >
              <FlagFR />
              <span>{t.nav.langFR}</span>
            </button>
            <span className={styles.langSep} aria-hidden="true">|</span>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "es" ? styles.langActive : ""}`}
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
            >
              <FlagES />
              <span>{t.nav.langES}</span>
            </button>
          </div>
        </nav>

        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setOpen(!open)}
          aria-label={open ? t.nav.menuClose : t.nav.menuOpen}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
