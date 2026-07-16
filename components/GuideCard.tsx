"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TurnstileField } from "./TurnstileField";
import styles from "./GuideCard.module.css";

type GuideType = "alici" | "satici";

interface GuideCardProps {
  guide: GuideType;
  number: string;
  label: string;
  title: React.ReactNode;
  description: string;
  /** Optional real image, when not provided, an on-brand placeholder is shown */
  imageSrc?: string;
}

type CardState = "default" | "open" | "loading" | "success" | "error";

export default function GuideCard({
  guide,
  number,
  label,
  title,
  description,
  imageSrc,
}: GuideCardProps) {
  const [state, setState] = useState<CardState>("default");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state === "open" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  // On success, briefly show confirmation, then navigate to thank-you page
  useEffect(() => {
    if (state === "success") {
      const t = setTimeout(() => {
        router.push(`/rehber/${guide}/tesekkur`);
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [state, guide, router]);

  const handleOpen = () => {
    setState("open");
  };

  const handleCancel = () => {
    setEmail("");
    setErrorMsg(null);
    setState("default");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Geçerli bir e-posta adresi girin");
      return;
    }

    setState("loading");

    try {
      const res = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          guide,
          source: "Instagram - ManyChat",
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.");
        setState("open");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      setState("open");
    }
  };

  const cardClass = [
    styles.card,
    state === "open" && styles.isOpen,
    state === "loading" && styles.isOpen,
    state === "success" && styles.isSuccess,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClass} data-guide={guide}>
      <div className={styles.image}>
        {imageSrc ? (
          <Image src={imageSrc} alt="" width={800} height={600} className={styles.imageImg} />
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderMark}>
              <Image
                src="/logos/HUNTER_Brandmark_Gold.png"
                alt=""
                width={96}
                height={96}
              />
            </div>
            <span className={styles.placeholderLabel}>
              ▢ {label} görseli
            </span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.num}>
          <span className={styles.numLarge}>{number}</span>
          <span className={styles.numLabel}>{label}</span>
        </div>

        <h3 className={styles.title}>{title}</h3>

        {state === "default" && (
          <>
            <p className={styles.description}>{description}</p>
            <button type="button" className={styles.cta} onClick={handleOpen}>
              Rehberi Al
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path
                  d="M10 1l5 5-5 5M15 6H1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

        {(state === "open" || state === "loading") && (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label htmlFor={`email-${guide}`}>E-posta Adresiniz</label>
            <input
              ref={inputRef}
              type="email"
              id={`email-${guide}`}
              name="email"
              placeholder="siz@ornek.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === "loading"}
              style={errorMsg ? { borderBottomColor: "#c0392b" } : undefined}
            />
            {errorMsg && <p className={styles.error}>{errorMsg}</p>}
            <TurnstileField onToken={setTurnstileToken} />
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancel}
                onClick={handleCancel}
                disabled={state === "loading"}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={
                  state === "loading" ||
                  (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)
                }
              >
                {state === "loading" ? "Gönderiliyor…" : "Gönder"}
              </button>
            </div>
          </form>
        )}

        {state === "success" && (
          <div className={styles.success}>
            <div className={styles.successCheck}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10l4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h4>Rehberiniz yolda.</h4>
            <p>Gelen kutunuzu kontrol edin.</p>
          </div>
        )}
      </div>
    </article>
  );
}
