"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import { investmentBrandFor } from "@/lib/capital/investment-brand";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DealerDisclosure } from "./DealerDisclosure";
import { NORTH_BASE, NorthBrand } from "./NorthBrand";

const COPY = {
  tr: {
    signIn: "Giriş yap",
    signUp: "Hesap oluştur",
    signInTitle: "Hunter & Hunter Yatırım Danışmanlığı hesabınıza giriş yapın",
    signUpTitle: "Hunter & Hunter Yatırım Danışmanlığı hesabınızı oluşturun",
    signInBody: "Yatırımlarınızı ve onaylanmış çalışma alanlarınızı güvenli şekilde görüntüleyin.",
    signUpBody: "E-posta doğrulamasından sonra Yatırımcı veya Türkiye lisanslı profesyonel/firma yolunu seçin.",
    firstName: "Ad",
    lastName: "Soyad",
    email: "E-posta",
    password: "Şifre",
    submitSignIn: "Giriş yap",
    submitSignUp: "Hesap oluştur",
    switchToSignUp: "Yeni hesap oluştur",
    switchToSignIn: "Zaten hesabınız var mı?",
    verification: "E-posta doğrulama bağlantısı gönderildi. Doğruladıktan sonra giriş yapabilirsiniz.",
    preview: "Yerel portal önizlemesini aç",
    notConfigured: "Supabase bilgileri henüz bağlanmadığı için yerel önizleme kullanılabilir.",
    error: "İşlem tamamlanamadı.",
    benefits: ["Önce yatırımcı erişimi", "Ayrı lisanslı profesyonel onayı", "Gizlilik açısından ayrılmış müşteri kayıtları"],
  },
  en: {
    signIn: "Sign in",
    signUp: "Create account",
    signInTitle: "Sign in to Hunter & Hunter Investment Advisory",
    signUpTitle: "Create your Hunter & Hunter Investment Advisory account",
    signInBody: "Securely access your investments and approved workspaces.",
    signUpBody: "After verifying your email, choose the Investor or Türkiye-licensed professional/firm path.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    submitSignIn: "Sign in",
    submitSignUp: "Create account",
    switchToSignUp: "Create a new account",
    switchToSignIn: "Already have an account?",
    verification: "A verification link was sent. Confirm your email, then sign in.",
    preview: "Open local portal preview",
    notConfigured: "Supabase credentials are not connected yet, so the local preview remains available.",
    error: "The request could not be completed.",
    benefits: ["Investor-first access", "Separate licensed-professional approval", "Privacy-isolated client records"],
  },
} as const;

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { lang } = useLang();
  const c = investorTerminology(pick(COPY, lang));
  const brand = investmentBrandFor(lang);
  const configured = isSupabaseConfigured();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [continuationSearch, setContinuationSearch] = useState("");

  useEffect(() => {
    setContinuationSearch(window.location.search);
  }, []);

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
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setPending(true);

    try {
      if (mode === "sign-in") {
        const result = await client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        const query = new URLSearchParams(window.location.search);
        const continuation = new URLSearchParams();
        const offering = query.get("offering");
        const path = query.get("path");
        const next = query.get("next");
        if (next?.startsWith(`${NORTH_BASE}/`) && !next.startsWith(`${NORTH_BASE}/sign-in`)) {
          window.location.assign(next);
          return;
        }
        if (offering) continuation.set("offering", offering);
        if (path === "professional" || path === "investor") continuation.set("path", path);
        window.location.assign(continuation.size ? `${NORTH_BASE}/onboarding?${continuation.toString()}` : `${NORTH_BASE}/home`);
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
      if (next?.startsWith(`${NORTH_BASE}/`) && !next.startsWith(`${NORTH_BASE}/sign-in`)) onboardingQuery.set("next", next);
      const onboarding = `${NORTH_BASE}/onboarding${onboardingQuery.size ? `?${onboardingQuery.toString()}` : ""}`;
      const result = await client.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, locale: lang },
          emailRedirectTo: `${window.location.origin}${NORTH_BASE}/auth/confirm?next=${encodeURIComponent(onboarding)}`,
        },
      });
      if (result.error) throw result.error;
      setMessage(c.verification);
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : c.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#071c2c] px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <NorthBrand />
          <Link href={NORTH_BASE} className="hidden max-w-44 text-right text-xs font-semibold text-white/65 hover:text-white sm:block">
            {brand.descriptor}
          </Link>
        </div>
        <div className="grid overflow-hidden rounded-lg border border-white/15 bg-white shadow-2xl lg:grid-cols-[0.85fr_1.15fr]">
          <section className="bg-[#0a2539] p-7 text-white sm:p-10">
            <ShieldCheck className="size-8 text-[#d8bf7a]" />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-white/60">
              {mode === "sign-in" ? c.signIn : c.signUp}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold">
              {mode === "sign-in" ? c.signInTitle : c.signUpTitle}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62">
              {mode === "sign-in" ? c.signInBody : c.signUpBody}
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/70">
              {c.benefits.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#d8bf7a]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="p-7 text-[#17202b] sm:p-10">
            <form onSubmit={submit} className="space-y-5">
              {mode === "sign-up" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    {c.firstName}
                    <input name="firstName" required autoComplete="given-name" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
                  </label>
                  <label className="text-sm font-semibold">
                    {c.lastName}
                    <input name="lastName" required autoComplete="family-name" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
                  </label>
                </div>
              )}
              <label className="block text-sm font-semibold">
                {c.email}
                <input name="email" required type="email" autoComplete="email" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
              </label>
              <label className="block text-sm font-semibold">
                {c.password}
                <input name="password" required minLength={8} type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
              </label>
              {message && <p role="status" className="rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
              {error && <p role="alert" className="rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
              <button disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-60">
                {mode === "sign-in" ? c.submitSignIn : c.submitSignUp}
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="mt-7 border-t border-[#e4e8eb] pt-5">
              <Link href={`${NORTH_BASE}/${mode === "sign-in" ? "sign-up" : "sign-in"}${continuationSearch}`} className="text-sm font-semibold text-[#0a4b72] hover:underline">
                {mode === "sign-in" ? c.switchToSignUp : c.switchToSignIn}
              </Link>
              {!configured && (
                <div className="mt-5 rounded-md bg-[#f4f6f8] p-4">
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
