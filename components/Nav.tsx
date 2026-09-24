"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageProvider";
import { PORTAL_URL } from "@/lib/portal-link";
import LanguageMenu from "./LanguageMenu";
import styles from "./Nav.module.css";

interface NavProps {
  /** Starts transparent over a dark hero and goes solid on scroll */
  overlayHero?: boolean;
}

export default function Nav({ overlayHero = false }: NavProps) {
  const t = useT();
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
    { href: PORTAL_URL, label: t.nav.servicesMenu.invest },
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

          <div className={styles.langToggle}>
            <LanguageMenu />
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
