"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import {
  advisoryAuthRedirectUrl,
  advisoryPublicPath,
} from "@/lib/capital/advisory-domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { TurnstileField } from "@/components/TurnstileField";
import { NorthBrand, NORTH_BASE } from "./NorthBrand";

const COPY = {
  tr: {
    eyebrow: "Hesap güvenliği",
    forgotTitle: "Şifrenizi sıfırlayın",
    forgotBody: "Hesabınıza ait e-posta adresini girin. Güvenli bir şifre sıfırlama bağlantısı göndereceğiz.",
    resetTitle: "Yeni bir şifre seçin",
    resetBody: "Hesabınız için en az 8 karakterden oluşan yeni bir şifre belirleyin.",
    email: "E-posta",
    password: "Yeni şifre",
    confirmPassword: "Yeni şifreyi doğrulayın",
    send: "Sıfırlama bağlantısı gönder",
    update: "Şifreyi güncelle",
    back: "Giriş sayfasına dön",
    sent: "Bu e-postaya ait bir hesap varsa şifre sıfırlama bağlantısı gönderildi.",
    mismatch: "Şifreler eşleşmiyor.",
    invalidSession: "Bu sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyin.",
    notConfigured: "Supabase bağlantısı yapılandırılmamış.",
    security: "Devam etmek için güvenlik doğrulamasını tamamlayın.",
    wait: "Çok fazla istek gönderildi. Lütfen bir dakika sonra yeniden deneyin.",
    error: "İşlem tamamlanamadı.",
  },
  en: {
    eyebrow: "Account security",
    forgotTitle: "Reset your password",
    forgotBody: "Enter the email address for your account and we will send a secure password-reset link.",
    resetTitle: "Choose a new password",
    resetBody: "Set a new password of at least 8 characters for your account.",
    email: "Email",
    password: "New password",
    confirmPassword: "Confirm new password",
    send: "Send reset link",
    update: "Update password",
    back: "Back to sign in",
    sent: "If an account exists for that email, a password-reset link has been sent.",
    mismatch: "The passwords do not match.",
    invalidSession: "This reset link is invalid or expired. Request a new link.",
    notConfigured: "The Supabase connection is not configured.",
    security: "Complete the security verification to continue.",
    wait: "Too many requests were sent. Try again in one minute.",
    error: "The request could not be completed.",
  },
} as const;

export function PasswordRecoveryScreen({ mode }: { mode: "forgot" | "reset" }) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetSessionReady, setResetSessionReady] = useState(mode !== "reset");
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (mode !== "reset") return;
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError(c.notConfigured);
      return;
    }
    void client.auth.getClaims().then(({ data, error: claimsError }) => {
      if (claimsError || !data?.claims?.sub) {
        setError(c.invalidSession);
        return;
      }
      setResetSessionReady(true);
    });
  }, [c.invalidSession, c.notConfigured, mode]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError(c.notConfigured);
      return;
    }

    const form = new FormData(event.currentTarget);
    if (mode === "forgot" && turnstileRequired && !captchaToken) {
      setError(c.security);
      return;
    }
    setPending(true);
    try {
      if (mode === "forgot") {
        const email = String(form.get("email") ?? "").trim();
        const redirectTo = advisoryAuthRedirectUrl(window.location, "/reset-password");
        const result = await client.auth.resetPasswordForEmail(email, {
          redirectTo,
          captchaToken,
        });
        if (result.error) throw result.error;
        setMessage(c.sent);
        event.currentTarget.reset();
        return;
      }

      const password = String(form.get("password") ?? "");
      const confirmation = String(form.get("confirmation") ?? "");
      if (password !== confirmation) throw new Error(c.mismatch);
      const result = await client.auth.updateUser({ password });
      if (result.error) throw result.error;
      await client.auth.signOut({ scope: "local" });
      window.location.assign(
        advisoryPublicPath(window.location.hostname, "/sign-in?message=password-updated"),
      );
    } catch (caught) {
      const code = typeof caught === "object" && caught && "code" in caught
        ? String(caught.code)
        : "";
      if (code.includes("captcha")) setError(c.security);
      else if (code.includes("rate_limit")) setError(c.wait);
      else setError(mode === "forgot" ? c.sent : c.error);
    } finally {
      setPending(false);
      if (mode === "forgot") {
        setCaptchaToken(undefined);
        setCaptchaResetSignal((value) => value + 1);
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#071c2c] px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-10">
          <NorthBrand />
        </div>
        <div className="grid overflow-hidden rounded-lg border border-white/15 bg-white shadow-2xl md:grid-cols-[0.8fr_1.2fr]">
          <section className="bg-[#0a2539] p-7 text-white sm:p-10">
            <ShieldCheck className="size-8 text-[#d8bf7a]" />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-white/60">{c.eyebrow}</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold">
              {mode === "forgot" ? c.forgotTitle : c.resetTitle}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62">
              {mode === "forgot" ? c.forgotBody : c.resetBody}
            </p>
          </section>
          <section className="p-7 text-[#17202b] sm:p-10">
            <KeyRound className="mb-6 size-7 text-[#9a772d]" />
            <form onSubmit={submit} className="space-y-5">
              {mode === "forgot" ? (
                <label className="block text-sm font-semibold">
                  {c.email}
                  <input name="email" required type="email" autoComplete="email" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
                </label>
              ) : (
                <>
                  <label className="block text-sm font-semibold">
                    {c.password}
                    <input name="password" required minLength={8} type="password" autoComplete="new-password" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
                  </label>
                  <label className="block text-sm font-semibold">
                    {c.confirmPassword}
                    <input name="confirmation" required minLength={8} type="password" autoComplete="new-password" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
                  </label>
                </>
              )}
              {mode === "forgot" && (
                <TurnstileField onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
              )}
              {message && <p role="status" className="rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
              {error && <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
              <button disabled={pending || !resetSessionReady || (mode === "forgot" && turnstileRequired && !captchaToken)} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-60">
                {mode === "forgot" ? c.send : c.update}
                <ArrowRight className="size-4" />
              </button>
            </form>
            <div className="mt-7 border-t border-[#e4e8eb] pt-5">
              <Link href={`${NORTH_BASE}/sign-in`} className="text-sm font-semibold text-[#0a4b72] hover:underline">
                {c.back}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
