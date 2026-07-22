"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
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
import { MembershipPanel } from "./landing/primitives";

const COPY = {
  tr: {
    signIn: "Giriş yap",
    signUp: "Hesap oluştur",
    signInEyebrow: "Üye erişimi",
    signUpEyebrow: "Özel gayrimenkul · Erişimle",
    signInTitle: "Tekrar hoş geldiniz",
    signUpTitle: "Erişiminizi alın",
    signInBody: "Yatırımlarınıza ve portföyünüze erişin.",
    signUpBody: "Seçili Kanada özel gayrimenkulüne erişin — gerçek binalar, gerçek rakamlar ve size yol gösterecek kişisel bir danışman.",
    secured: "Şifreli bağlantı · E-posta doğrulamalı",
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
    resendWait: (seconds: number) => `${seconds} saniye sonra yeniden gönderin`,
    passwordUpdated: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
    confirmationFailed: "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden deneyin.",
    signInFailed: "E-posta veya şifre hatalı ya da e-postanız henüz doğrulanmadı.",
    security: "Devam etmek için güvenlik doğrulamasını tamamlayın.",
    preview: "Yerel portal önizlemesini aç",
    notConfigured: "Supabase bilgileri henüz bağlanmadığı için yerel önizleme kullanılabilir.",
    error: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
    benefits: ["Seçili Kanada özel gayrimenkulü", "Yanınızda kişisel bir danışman", "Şifreli, e-posta doğrulamalı giriş"],
    mockLabel: "Portföyünüzün içi",
  },
  en: {
    signIn: "Sign in",
    signUp: "Create account",
    signInEyebrow: "Member access",
    signUpEyebrow: "Private real estate · By access",
    signInTitle: "Welcome back",
    signUpTitle: "Get your access",
    signInBody: "Access your investments and portfolio.",
    signUpBody: "Get access to curated Canadian private real estate — the tangible buildings, the real numbers, and a personal advisor to guide you.",
    secured: "Encrypted connection · Email verified",
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
    resendWait: (seconds: number) => `Resend in ${seconds} seconds`,
    passwordUpdated: "Your password was updated. Sign in with your new password.",
    confirmationFailed: "That confirmation link is invalid or expired. Please try again.",
    signInFailed: "The email or password is incorrect, or your email isn't verified yet.",
    security: "Complete the security check to continue.",
    preview: "Open local portal preview",
    notConfigured: "Supabase credentials are not connected yet, so the local preview remains available.",
    error: "The request could not be completed. Please try again.",
    benefits: ["Curated Canadian private real estate", "A personal advisor in your corner", "Encrypted, email-verified sign-in"],
    mockLabel: "Inside your portfolio",
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
  const [showPassword, setShowPassword] = useState(false);
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
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
      setMessage(c.verification);
      setPendingConfirmation({ email, redirectTo: emailRedirectTo });
      setResendAvailableAt(Date.now() + 60_000);
      formElement.reset();
    } catch (caught) {
      if (mode === "sign-in" && isEmailConfirmationError(caught)) {
        setPendingConfirmation({
          email,
          redirectTo: advisoryAuthRedirectUrl(window.location, "/onboarding"),
        });
      }
      setError(mappedError(caught));
    } finally {
      setPending(false);
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
    "mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal text-[#17202b] outline-none transition-colors placeholder:text-[#9aa5ad] focus:border-[#0a4b72] focus:ring-2 focus:ring-[#0a4b72]/15";

  return (
    <main lang="en" className="relative min-h-screen overflow-hidden bg-[#071c2c] px-5 py-8 text-white sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 8%, rgba(197,163,77,0.22), transparent 42%), radial-gradient(circle at 5% 92%, rgba(47,113,148,0.28), transparent 40%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
          <NorthBrand showCoBrand={false} />
          <ParvisCoBrand className="shrink-0" />
        </div>
        <div className="grid overflow-hidden rounded-2xl border border-white/12 bg-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)] lg:grid-cols-[0.85fr_1.15fr]">
          <section className="relative bg-[#0a2539] p-7 text-white sm:p-10">
            <MembershipPanel
              eyebrow={mode === "sign-in" ? c.signInEyebrow : c.signUpEyebrow}
              title={mode === "sign-in" ? c.signInTitle : c.signUpTitle}
              body={mode === "sign-in" ? c.signInBody : c.signUpBody}
              benefits={[...c.benefits]}
              secured={c.secured}
              mockLabel={c.mockLabel}
            />
          </section>

          <section className="p-7 text-[#17202b] sm:p-10">
            <form onSubmit={submit} className="space-y-5">
              {mode === "sign-up" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    {c.firstName}
                    <input name="firstName" required autoComplete="given-name" className={inputClass} />
                  </label>
                  <label className="text-sm font-semibold">
                    {c.lastName}
                    <input name="lastName" required autoComplete="family-name" className={inputClass} />
                  </label>
                </div>
              )}
              <label className="block text-sm font-semibold">
                {c.email}
                <input name="email" required type="email" autoComplete="email" placeholder="name@email.com" className={inputClass} />
              </label>
              <label className="block text-sm font-semibold">
                {c.password}
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
                    className="absolute right-1 top-2 grid size-9 place-items-center rounded-md text-[#7a8790] hover:text-[#0a4b72]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>
              {mode === "sign-in" && (
                <div className="-mt-2 text-right">
                  <Link href={`${NORTH_BASE}/forgot-password`} className="text-xs font-semibold text-[#0a4b72] hover:underline">
                    {c.forgotPassword}
                  </Link>
                </div>
              )}
              <TurnstileField onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
              {message && <p role="status" className="rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
              {error && <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
              <button disabled={pending || (turnstileRequired && !captchaToken)} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e] disabled:opacity-60">
                {mode === "sign-in" ? c.submitSignIn : c.submitSignUp}
                <ArrowRight className="size-4" />
              </button>
              {pendingConfirmation && (
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={resending || resendSeconds > 0 || (turnstileRequired && !captchaToken)}
                  className="w-full text-center text-xs font-semibold text-[#0a4b72] hover:underline disabled:cursor-not-allowed disabled:text-[#87949c] disabled:no-underline"
                >
                  {resendSeconds > 0 ? c.resendWait(resendSeconds) : c.resend}
                </button>
              )}
            </form>

            <div className="mt-7 border-t border-[#e4e8eb] pt-5">
              <Link href={`${NORTH_BASE}/${mode === "sign-in" ? "sign-up" : "sign-in"}${continuationSearch}`} className="text-sm font-semibold text-[#0a4b72] hover:underline">
                {mode === "sign-in" ? c.switchToSignUp : c.switchToSignIn}
              </Link>
              {!configured && (
                <div className="mt-5 rounded-md border border-[#e4e8eb] bg-[#f4f6f8] p-4">
                  <p className="text-xs leading-5 text-[#6b7680]">{c.notConfigured}</p>
                  <Link href={`${NORTH_BASE}/home`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72]">
                    {c.preview}<ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
              <DealerDisclosure level="short" className="mt-6 border-t border-[#e4e8eb] pt-5" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
