"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, MailCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import {
  advisoryAuthRedirectUrl,
  advisoryPublicPath,
  safeAdvisoryNext,
} from "@/lib/capital/advisory-domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { TurnstileField } from "@/components/TurnstileField";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand, ParvisCoBrand } from "./NorthBrand";

const COPY = {
  tr: {
    signIn: "Giriş yap",
    signUp: "Hesap oluştur",
    signInEyebrow: "Güvenli hesap erişimi",
    signUpEyebrow: "Güvenli kayıt",
    signInTitle: "Hesabınıza giriş yapın",
    signUpTitle: "Hesabınızı oluşturun",
    signInBody: "Portföyünüze ve yatırım belgelerinize erişin.",
    signUpBody: "Güvenli hesap erişiminizi oluşturmak için bilgilerinizi girin.",
    secured: "Bağlantınız şifrelenmiştir",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
    firstName: "Ad",
    lastName: "Soyad",
    email: "E-posta",
    password: "Şifre",
    submitSignIn: "Giriş yap",
    submitSignUp: "Hesap oluştur",
    switchToSignUp: "Yeni misiniz? Hesap oluşturun",
    switchToSignIn: "Zaten hesabınız var mı? Giriş yapın",
    forgotPassword: "Şifrenizi mi unuttunuz?",
    verification: "Doğrulama bağlantısı için e-postanızı kontrol edin, ardından giriş yapın.",
    resent: "Yeni bir doğrulama bağlantısı gönderildi.",
    resend: "Doğrulama e-postasını yeniden gönder",
    resendPrompt: "Doğrulama e-postasını almadınız mı?",
    resendCta: "Yeniden gönder",
    enterEmail: "Yeniden göndermek için önce e-posta adresinizi girin.",
    resendNeutral: "Hesabınızın doğrulanması gerekiyorsa yeni bir bağlantı gönderdik. Gelen kutunuzu ve spam klasörünü kontrol edin.",
    resendWait: (seconds: number) => `${seconds} saniye sonra yeniden gönderin`,
    passwordUpdated: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
    confirmationFailed: "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden deneyin.",
    signInFailed: "E-posta veya şifre hatalı ya da e-postanız henüz doğrulanmadı.",
    noAccount: "Bu e-posta ile bir hesap bulunamadı. Devam etmek için bir hesap oluşturun.",
    passwordIncorrect: "Şifre hatalı. Tekrar deneyin veya şifrenizi sıfırlayın.",
    emailUnverified: "E-postanız henüz doğrulanmadı. Doğrulama bağlantısını yeniden gönderebiliriz.",
    alreadyVerified: "Bu e-posta zaten doğrulanmış. Şifrenizle giriş yapabilirsiniz.",
    createAccountCta: "Hesap oluşturun",
    security: "Devam etmek için güvenlik doğrulamasını tamamlayın.",
    preview: "Yerel portal önizlemesini aç",
    notConfigured: "Supabase bilgileri henüz bağlanmadığı için yerel önizleme kullanılabilir.",
    error: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
    checkEmailEyebrow: "E-postanızı doğrulayın",
    checkEmailTitle: "E-postanızı kontrol edin",
    checkEmailBody: (email: string) =>
      `${email} adresine bir doğrulama bağlantısı gönderdik. Hesabınızı etkinleştirmek için bağlantıyı açın, ardından giriş yapın.`,
    checkEmailHint: "Bağlantıyı görmüyor musunuz? Spam klasörünü kontrol edin veya aşağıdan yeniden gönderin.",
    backToSignIn: "Giriş sayfasına dön",
  },
  en: {
    signIn: "Sign in",
    signUp: "Create account",
    signInEyebrow: "Secure account access",
    signUpEyebrow: "Secure registration",
    signInTitle: "Sign in to your account",
    signUpTitle: "Create your account",
    signInBody: "Access your portfolio and investment documents.",
    signUpBody: "Enter your details to set up secure account access.",
    secured: "Your connection is encrypted",
    showPassword: "Show password",
    hidePassword: "Hide password",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    submitSignIn: "Sign in",
    submitSignUp: "Create account",
    switchToSignUp: "New here? Create an account",
    switchToSignIn: "Already have an account? Sign in",
    forgotPassword: "Forgot password?",
    verification: "Check your email for a verification link, then sign in.",
    resent: "A new verification link was sent.",
    resend: "Resend verification email",
    resendPrompt: "Didn't get the confirmation email?",
    resendCta: "Resend it",
    enterEmail: "Enter your email address above first, then resend.",
    resendNeutral: "If your account still needs verifying, we've sent a new link. Check your inbox and spam folder.",
    resendWait: (seconds: number) => `Resend in ${seconds} seconds`,
    passwordUpdated: "Your password was updated. Sign in with your new password.",
    confirmationFailed: "That confirmation link is invalid or expired. Please try again.",
    signInFailed: "The email or password is incorrect, or your email isn't verified yet.",
    noAccount: "We couldn't find an account for that email. Create one to continue.",
    passwordIncorrect: "The password is incorrect. Try again or reset it.",
    emailUnverified: "Your email isn't verified yet. We can resend the verification link.",
    alreadyVerified: "This email is already verified. You can sign in with your password.",
    createAccountCta: "Create your account",
    security: "Complete the security check to continue.",
    preview: "Open local portal preview",
    notConfigured: "Supabase credentials are not connected yet, so the local preview remains available.",
    error: "The request could not be completed. Please try again.",
    checkEmailEyebrow: "Verify your email",
    checkEmailTitle: "Check your email",
    checkEmailBody: (email: string) =>
      `We sent a verification link to ${email}. Open it to activate your account, then sign in.`,
    checkEmailHint: "Don't see it? Check your spam folder, or resend the link below.",
    backToSignIn: "Back to sign in",
  },
} as const;

function isEmailConfirmationError(caught: unknown) {
  if (!caught || typeof caught !== "object") return false;
  const error = caught as { code?: unknown; message?: unknown };
  const code = typeof error.code === "string" ? error.code.toLowerCase() : "";
  const message = typeof error.message === "string" ? error.message.toLowerCase() : "";

  return code === "email_not_confirmed" || message.includes("email not confirmed");
}

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { lang } = useLang();
  const c = investorTerminology(pick(COPY, lang));
  const configured = isSupabaseConfigured();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [continuationSearch, setContinuationSearch] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    email: string;
    redirectTo: string;
  }>();
  const [resending, setResending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [devConfirming, setDevConfirming] = useState(false);
  const devConfirmEnabled = process.env.NODE_ENV !== "production";
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [accountMissing, setAccountMissing] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    setContinuationSearch(window.location.search);
    const query = new URLSearchParams(window.location.search);
    if (query.get("message") === "password-updated") setMessage(c.passwordUpdated);
    if (query.get("error") === "confirmation-failed") setError(c.confirmationFailed);
  }, [c.confirmationFailed, c.passwordUpdated]);

  useEffect(() => {
    if (!resendAvailableAt) {
      setResendSeconds(0);
      return;
    }
    const update = () => {
      setResendSeconds(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1_000)));
    };
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  function resetCaptcha() {
    setCaptchaToken(undefined);
    setCaptchaResetSignal((value) => value + 1);
  }

  function mappedError(caught: unknown) {
    const code = typeof caught === "object" && caught && "code" in caught
      ? String(caught.code)
      : "";
    if (code.includes("captcha")) return c.security;
    return mode === "sign-in" ? c.signInFailed : c.error;
  }

  // Supabase returns the same "invalid_credentials" error for a wrong password
  // and a non-existent account. Ask the server which case it is so we can guide
  // the person to create an account instead of guessing at their password.
  async function lookupAccountStatus(email: string): Promise<"none" | "unverified" | "active" | "unknown"> {
    try {
      const response = await fetch("/api/auth/account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) return "unknown";
      const data = (await response.json()) as { status?: string };
      if (data.status === "none" || data.status === "unverified" || data.status === "active") {
        return data.status;
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setAccountMissing(false);
    setPendingConfirmation(undefined);
    // Capture the form element synchronously: React nulls `event.currentTarget`
    // after the handler returns, so it is unavailable past the first `await`.
    const formElement = event.currentTarget;
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError(c.notConfigured);
      return;
    }
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (turnstileRequired && !captchaToken) {
      setError(c.security);
      return;
    }
    setPending(true);

    try {
      if (mode === "sign-in") {
        const result = await client.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken },
        });
        if (result.error) throw result.error;
        const query = new URLSearchParams(window.location.search);
        const continuation = new URLSearchParams();
        const offering = query.get("offering");
        const path = query.get("path");
        const next = query.get("next");
        if (next) {
          window.location.assign(safeAdvisoryNext(window.location.hostname, next));
          return;
        }
        if (offering) continuation.set("offering", offering);
        if (path === "professional" || path === "investor") continuation.set("path", path);
        const destination = continuation.size
          ? `/onboarding?${continuation.toString()}`
          : "/home";
        window.location.assign(advisoryPublicPath(window.location.hostname, destination));
        return;
      }

      const firstName = String(form.get("firstName") ?? "").trim();
      const lastName = String(form.get("lastName") ?? "").trim();
      const query = new URLSearchParams(window.location.search);
      const onboardingQuery = new URLSearchParams();
      const offering = query.get("offering");
      const path = query.get("path");
      const next = query.get("next");
      if (offering) onboardingQuery.set("offering", offering);
      if (path === "professional" || path === "investor") onboardingQuery.set("path", path);
      if (next) onboardingQuery.set("next", safeAdvisoryNext(window.location.hostname, next));
      const onboardingSuffix = `/onboarding${onboardingQuery.size ? `?${onboardingQuery.toString()}` : ""}`;
      const emailRedirectTo = advisoryAuthRedirectUrl(window.location, onboardingSuffix);
      const result = await client.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, locale: lang },
          emailRedirectTo,
          captchaToken,
        },
      });
      if (result.error) throw result.error;
      setPendingConfirmation({ email, redirectTo: emailRedirectTo });
      setAwaitingConfirmation(true);
      setResendAvailableAt(Date.now() + 60_000);
      formElement.reset();
    } catch (caught) {
      if (mode !== "sign-in") {
        setError(mappedError(caught));
        return;
      }
      const redirectTo = advisoryAuthRedirectUrl(window.location, "/onboarding");
      // Account exists but isn't verified — offer to resend the link.
      if (isEmailConfirmationError(caught)) {
        setPendingConfirmation({ email, redirectTo });
        setError(c.emailUnverified);
        return;
      }
      const code = typeof caught === "object" && caught && "code" in caught ? String(caught.code) : "";
      if (code.includes("captcha")) {
        setError(c.security);
        return;
      }
      // Otherwise it's "invalid_credentials": distinguish no-account from a
      // wrong password so we can point new people to sign-up.
      const status = await lookupAccountStatus(email);
      if (status === "none") {
        setAccountMissing(true);
        setError(c.noAccount);
      } else if (status === "unverified") {
        setPendingConfirmation({ email, redirectTo });
        setError(c.emailUnverified);
      } else if (status === "active") {
        setError(c.passwordIncorrect);
      } else {
        setError(mappedError(caught));
      }
    } finally {
      setPending(false);
      resetCaptcha();
    }
  }

  async function devConfirm() {
    if (!pendingConfirmation || devConfirming) return;
    setMessage("");
    setError("");
    setDevConfirming(true);
    try {
      const response = await fetch("/api/dev/confirm-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingConfirmation.email }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "confirm_failed");
      }
      setMessage("Account confirmed (dev). You can sign in now.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "confirm_failed");
    } finally {
      setDevConfirming(false);
    }
  }

  // Always-available path from the sign-in screen: someone who never received
  // the confirmation email (or can't get past "email isn't verified") can
  // request a fresh link using the email they typed. Responses stay neutral so
  // we never reveal whether an account exists for that address.
  async function requestConfirmationForTyped() {
    setMessage("");
    setError("");
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      setError(c.enterEmail);
      return;
    }
    if (turnstileRequired && !captchaToken) {
      setError(c.security);
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError(c.notConfigured);
      return;
    }
    const redirectTo = advisoryAuthRedirectUrl(window.location, "/onboarding");
    setResending(true);
    try {
      // Don't send people to "check your email" if there's nothing to confirm.
      // When we can determine the account state, act on it precisely.
      const status = await lookupAccountStatus(email);
      if (status === "none") {
        setAccountMissing(true);
        setError(c.noAccount);
        return;
      }
      if (status === "active") {
        setError(c.alreadyVerified);
        return;
      }
      const result = await client.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo, captchaToken },
      });
      const code = result.error && "code" in result.error ? String(result.error.code) : "";
      if (code.includes("captcha")) {
        setError(c.security);
        return;
      }
      // status was "unverified" or "unknown" (e.g. lookup unavailable): show the
      // neutral "check your email" screen.
      setPendingConfirmation({ email, redirectTo });
      setAwaitingConfirmation(true);
      setResendAvailableAt(Date.now() + 60_000);
    } catch {
      setPendingConfirmation({ email, redirectTo });
      setAwaitingConfirmation(true);
      setResendAvailableAt(Date.now() + 60_000);
    } finally {
      setResending(false);
      resetCaptcha();
    }
  }

  async function resendConfirmation() {
    if (!pendingConfirmation || resendSeconds > 0 || resending) return;
    setMessage("");
    setError("");
    if (turnstileRequired && !captchaToken) {
      setError(c.security);
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError(c.notConfigured);
      return;
    }
    setResending(true);
    try {
      const result = await client.auth.resend({
        type: "signup",
        email: pendingConfirmation.email,
        options: {
          emailRedirectTo: pendingConfirmation.redirectTo,
          captchaToken,
        },
      });
      if (result.error) throw result.error;
      setMessage(c.resent);
      setResendAvailableAt(Date.now() + 60_000);
    } catch (caught) {
      setError(mappedError(caught));
    } finally {
      setResending(false);
      resetCaptcha();
    }
  }

  const inputClass =
    "mt-2 h-12 w-full rounded-md border border-[#cfd5da] bg-white px-3.5 font-normal text-[#18232d] outline-none transition placeholder:text-[#8b969f] hover:border-[#aeb8bf] focus:border-[#173b57] focus:ring-2 focus:ring-[#173b57]/12";

  return (
    <main lang={lang} className="min-h-screen bg-[#f3f5f6] text-[#18232d]">
      <header className="border-b border-[#dfe3e6] bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <NorthBrand dark showCoBrand={false} />
          <ParvisCoBrand dark className="shrink-0" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-10 sm:px-8 sm:py-14">
        <section className="w-full max-w-[460px] rounded-lg border border-[#d9dee2] bg-white px-6 py-8 shadow-[0_8px_24px_rgba(20,38,52,0.05)] sm:px-9 sm:py-9" aria-labelledby="auth-title">
          {awaitingConfirmation ? (
            <div className="flex flex-col items-center text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#eef4f0] text-[#2f7150]">
                <MailCheck className="size-7" aria-hidden />
              </span>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-[#53636f]">
                {c.checkEmailEyebrow}
              </p>
              <h1 id="auth-title" className="mt-2.5 text-2xl font-semibold tracking-[-0.025em] text-[#102638] sm:text-[1.7rem]">
                {c.checkEmailTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#66747e]">
                {c.checkEmailBody(pendingConfirmation?.email ?? "")}
              </p>
              <p className="mt-4 text-xs leading-5 text-[#8b969f]">{c.checkEmailHint}</p>
              {turnstileRequired && (
                <div className="mt-6 w-full">
                  <TurnstileField onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
                </div>
              )}
              {message && <p role="status" className="mt-6 w-full rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
              {error && <p role="alert" className="mt-6 w-full rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={resending || resendSeconds > 0 || (turnstileRequired && !captchaToken)}
                className="mt-7 flex h-12 w-full items-center justify-center rounded-md border border-[#c9d2d8] bg-white px-4 text-sm font-semibold text-[#173b57] transition-colors hover:border-[#173b57] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#c9d2d8]"
              >
                {resendSeconds > 0 ? c.resendWait(resendSeconds) : c.resend}
              </button>
              {devConfirmEnabled && (
                <button
                  type="button"
                  onClick={devConfirm}
                  disabled={devConfirming}
                  className="mt-3 w-full rounded-md border border-dashed border-[#c9d2d8] px-4 py-2.5 text-xs font-semibold text-[#6b7680] transition-colors hover:border-[#173b57] hover:text-[#173b57] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {devConfirming ? "Confirming…" : "Confirm now (dev only)"}
                </button>
              )}
              <div className="mt-7 w-full border-t border-[#e2e6e8] pt-6">
                <Link href={`${NORTH_BASE}/sign-in`} className="text-sm font-semibold text-[#173b57] hover:underline">
                  {c.backToSignIn}
                </Link>
              </div>
            </div>
          ) : (
            <>
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#53636f]">
              {mode === "sign-in" ? c.signInEyebrow : c.signUpEyebrow}
            </p>
            <h1 id="auth-title" className="mt-2.5 text-2xl font-semibold tracking-[-0.025em] text-[#102638] sm:text-[1.7rem]">
              {mode === "sign-in" ? c.signInTitle : c.signUpTitle}
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-[#66747e]">
              {mode === "sign-in" ? c.signInBody : c.signUpBody}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "sign-up" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-[#283640]">
                  {c.firstName}
                  <input name="firstName" required autoComplete="given-name" className={inputClass} />
                </label>
                <label className="text-sm font-medium text-[#283640]">
                  {c.lastName}
                  <input name="lastName" required autoComplete="family-name" className={inputClass} />
                </label>
              </div>
            )}
            <label className="block text-sm font-medium text-[#283640]">
              {c.email}
              <input name="email" required type="email" autoComplete="email" placeholder="name@email.com" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-[#283640]">
              <span className="flex items-center justify-between gap-4">
                <span>{c.password}</span>
                {mode === "sign-in" && (
                  <Link href={`${NORTH_BASE}/forgot-password`} className="text-xs font-semibold text-[#173b57] hover:underline">
                    {c.forgotPassword}
                  </Link>
                )}
              </span>
              <div className="relative">
                <input
                  name="password"
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
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
            <TurnstileField onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
            {message && <p role="status" className="rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
            {error && <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
            <button disabled={pending || (turnstileRequired && !captchaToken)} className="flex h-12 w-full items-center justify-center rounded-md bg-[#102f46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173f5c] disabled:cursor-not-allowed disabled:opacity-60">
              {mode === "sign-in" ? c.submitSignIn : c.submitSignUp}
            </button>
            {pendingConfirmation && (
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={resending || resendSeconds > 0 || (turnstileRequired && !captchaToken)}
                className="w-full text-center text-xs font-semibold text-[#173b57] hover:underline disabled:cursor-not-allowed disabled:text-[#87949c] disabled:no-underline"
              >
                {resendSeconds > 0 ? c.resendWait(resendSeconds) : c.resend}
              </button>
            )}
            {accountMissing && (
              <Link
                href={`${NORTH_BASE}/sign-up${continuationSearch}`}
                className="flex h-12 w-full items-center justify-center rounded-md border border-[#173b57] bg-white px-4 text-sm font-semibold text-[#173b57] transition-colors hover:bg-[#f2f6f9]"
              >
                {c.createAccountCta}
              </Link>
            )}
            {mode === "sign-in" && !pendingConfirmation && !accountMissing && (
              <p className="text-center text-xs leading-5 text-[#66747e]">
                {c.resendPrompt}{" "}
                <button
                  type="button"
                  onClick={requestConfirmationForTyped}
                  disabled={resending || resendSeconds > 0}
                  className="font-semibold text-[#173b57] hover:underline disabled:cursor-not-allowed disabled:text-[#87949c] disabled:no-underline"
                >
                  {resendSeconds > 0 ? c.resendWait(resendSeconds) : c.resendCta}
                </button>
              </p>
            )}
          </form>

          <div className="mt-7 border-t border-[#e2e6e8] pt-6 text-center">
            <Link href={`${NORTH_BASE}/${mode === "sign-in" ? "sign-up" : "sign-in"}${continuationSearch}`} className="text-sm font-semibold text-[#173b57] hover:underline">
              {mode === "sign-in" ? c.switchToSignUp : c.switchToSignIn}
            </Link>
            {!configured && (
              <div className="mt-5 text-xs leading-5 text-[#6b7680]">
                <p>{c.notConfigured}</p>
                <Link href={`${NORTH_BASE}/home`} className="mt-2 inline-block font-semibold text-[#173b57] hover:underline">
                  {c.preview}
                </Link>
              </div>
            )}
          </div>
            </>
          )}
        </section>

        <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[#5f6d77]">
          <LockKeyhole className="size-3.5" aria-hidden />
          {c.secured}
        </p>
        <DealerDisclosure level="short" className="mt-6 max-w-[560px] text-center" />
      </div>
    </main>
  );
}
