"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, MailCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import {
  advisoryAuthRedirectUrl,
  advisoryPublicPath,
} from "@/lib/capital/advisory-domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { TurnstileField } from "@/components/TurnstileField";
import { DisclosureBar } from "./DisclosureBar";
import { NorthBrand, NORTH_BASE, ParvisCoBrand } from "./NorthBrand";

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
    secured: "Bağlantınız şifrelenmiştir",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
    sent: "Bu e-postaya ait bir hesap varsa şifre sıfırlama bağlantısı gönderildi.",
    mismatch: "Şifreler eşleşmiyor.",
    invalidSession: "Bu sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyin.",
    notConfigured: "Supabase bağlantısı yapılandırılmamış.",
    security: "Devam etmek için güvenlik doğrulamasını tamamlayın.",
    wait: "Çok fazla istek gönderildi. Lütfen bir dakika sonra yeniden deneyin.",
    error: "İşlem tamamlanamadı.",
    sentEyebrow: "Gelen kutunuzu kontrol edin",
    sentTitle: "E-postanızı kontrol edin",
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
    secured: "Your connection is encrypted",
    showPassword: "Show password",
    hidePassword: "Hide password",
    sent: "If an account exists for that email, a password-reset link has been sent.",
    mismatch: "The passwords do not match.",
    invalidSession: "This reset link is invalid or expired. Request a new link.",
    notConfigured: "The Supabase connection is not configured.",
    security: "Complete the security verification to continue.",
    wait: "Too many requests were sent. Try again in one minute.",
    error: "The request could not be completed.",
    sentEyebrow: "Check your inbox",
    sentTitle: "Check your email",
  },
} as const;

export function PasswordRecoveryScreen({ mode }: { mode: "forgot" | "reset" }) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetSessionReady, setResetSessionReady] = useState(mode !== "reset");
  const [linkSent, setLinkSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
    const formElement = event.currentTarget;
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError(c.notConfigured);
      return;
    }

    const form = new FormData(formElement);
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
        setLinkSent(true);
        formElement.reset();
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
      else if (mode === "forgot") setLinkSent(true);
      else setError(c.error);
    } finally {
      setPending(false);
      if (mode === "forgot") {
        setCaptchaToken(undefined);
        setCaptchaResetSignal((value) => value + 1);
      }
    }
  }

  const inputClass =
    "mt-2 h-12 w-full rounded-md border border-[#cfd5da] bg-white px-3.5 font-normal text-[#18232d] outline-none transition placeholder:text-[#8b969f] hover:border-[#aeb8bf] focus:border-[#173b57] focus:ring-2 focus:ring-[#173b57]/12";
  const title = mode === "forgot" ? c.forgotTitle : c.resetTitle;
  const body = mode === "forgot" ? c.forgotBody : c.resetBody;

  return (
    <main lang={lang} className="min-h-screen bg-[#f3f5f6] text-[#18232d]">
      <header className="border-b border-[#dfe3e6] bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <NorthBrand dark showCoBrand={false} />
          <ParvisCoBrand dark className="shrink-0" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-10 sm:px-8 sm:py-14">
        <section className="w-full max-w-[460px] rounded-lg border border-[#d9dee2] bg-white px-6 py-8 shadow-[0_8px_24px_rgba(20,38,52,0.05)] sm:px-9 sm:py-9" aria-labelledby="password-recovery-title">
          {mode === "forgot" && linkSent ? (
            <div className="flex flex-col items-center text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#eef4f0] text-[#2f7150]">
                <MailCheck className="size-7" aria-hidden />
              </span>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-[#53636f]">{c.sentEyebrow}</p>
              <h1 id="password-recovery-title" className="mt-2.5 text-2xl font-semibold tracking-[-0.025em] text-[#102638] sm:text-[1.7rem]">{c.sentTitle}</h1>
              <p className="mt-3 text-sm leading-6 text-[#66747e]">{c.sent}</p>
              <div className="mt-7 w-full border-t border-[#e2e6e8] pt-6">
                <Link href={`${NORTH_BASE}/sign-in`} className="text-sm font-semibold text-[#173b57] hover:underline">
                  {c.back}
                </Link>
              </div>
            </div>
          ) : (
            <>
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#53636f]">{c.eyebrow}</p>
            <h1 id="password-recovery-title" className="mt-2.5 text-2xl font-semibold tracking-[-0.025em] text-[#102638] sm:text-[1.7rem]">
              {title}
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-[#66747e]">
              {body}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "forgot" ? (
              <label className="block text-sm font-medium text-[#283640]">
                {c.email}
                <input name="email" required type="email" autoComplete="email" placeholder="name@email.com" className={inputClass} />
              </label>
            ) : (
              <>
                <label className="block text-sm font-medium text-[#283640]">
                  {c.password}
                  <div className="relative">
                    <input
                      name="password"
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? c.hidePassword : c.showPassword}
                      className="absolute right-1.5 top-2.5 grid size-9 place-items-center rounded-md text-[#74818a] transition-colors hover:bg-[#f1f3f4] hover:text-[#173b57]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>
                <label className="block text-sm font-medium text-[#283640]">
                  {c.confirmPassword}
                  <div className="relative">
                    <input
                      name="confirmation"
                      required
                      minLength={8}
                      type={showConfirmation ? "text" : "password"}
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmation((value) => !value)}
                      aria-label={showConfirmation ? c.hidePassword : c.showPassword}
                      className="absolute right-1.5 top-2.5 grid size-9 place-items-center rounded-md text-[#74818a] transition-colors hover:bg-[#f1f3f4] hover:text-[#173b57]"
                    >
                      {showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>
              </>
            )}
            {mode === "forgot" && (
              <TurnstileField onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
            )}
            {message && <p role="status" className="rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
            {error && <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
            <button disabled={pending || !resetSessionReady || (mode === "forgot" && turnstileRequired && !captchaToken)} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#102f46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173f5c] disabled:cursor-not-allowed disabled:opacity-60">
              {mode === "forgot" ? c.send : c.update}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="mt-7 border-t border-[#e2e6e8] pt-6 text-center">
            <Link href={`${NORTH_BASE}/sign-in`} className="text-sm font-semibold text-[#173b57] hover:underline">
              {c.back}
            </Link>
          </div>
            </>
          )}
        </section>

        <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[#5f6d77]">
          <LockKeyhole className="size-3.5" aria-hidden />
          {c.secured}
        </p>
        <DisclosureBar align="center" coBrand={false} className="mt-6 max-w-[560px]" />
      </div>
    </main>
  );
}
