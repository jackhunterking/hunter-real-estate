"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, X } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { usePortalAccess } from "./PortalAccessProvider";
import { InvestorSelfCheckFlow } from "./InvestorSelfCheck";

const COPY = {
  en: {
    open: "Re-check",
    title: "Investor self-check",
    intro: "Answer a few short questions to update your Canadian investor category. This is a preliminary indicator; eligibility is confirmed by our team.",
    close: "Close",
    save: "Save my type",
    saving: "Saving…",
    error: "Your type could not be saved. Please try again.",
  },
  tr: {
    open: "Yeniden kontrol et",
    title: "Yatırımcı öz kontrolü",
    intro: "Kanada yatırımcı kategorinizi güncellemek için birkaç kısa soruyu yanıtlayın. Bu bir ön göstergedir; uygunluk ekibimizce teyit edilir.",
    close: "Kapat",
    save: "Türümü kaydet",
    saving: "Kaydediliyor…",
    error: "Türünüz kaydedilemedi. Lütfen tekrar deneyin.",
  },
} as const;

export function InvestorSelfCheckButton({ className = "" }: { className?: string }) {
  const { lang } = useLang();
  const router = useRouter();
  const { backendConfigured, currentUser } = usePortalAccess();
  const c = pick(COPY, lang);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function save(investorAccountType: "individual" | "entity", qualificationCategory: string) {
    setStatus("saving");
    if (!backendConfigured) {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      dialogRef.current?.close();
      setStatus("idle");
      return;
    }
    const response = await fetch("/api/investor-self-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investorAccountType, qualificationCategory }),
    });
    if (!response.ok) {
      setStatus("error");
      return;
    }
    dialogRef.current?.close();
    setStatus("idle");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus("idle");
          dialogRef.current?.showModal();
        }}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#ccd5db] bg-white px-3 text-xs font-semibold text-[#31546a] transition-colors hover:bg-[#eef2f4] ${className}`}
      >
        <RefreshCw className="size-3.5" />
        {c.open}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="self-check-title"
        className="m-auto w-[min(94vw,560px)] rounded-xl border-0 bg-white p-0 text-[#1d3342] shadow-2xl backdrop:bg-[#061521]/65"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e4e8eb] px-5 py-4 sm:px-6">
          <div>
            <h2 id="self-check-title" className="text-xl font-semibold">{c.title}</h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-[#687681]">{c.intro}</p>
          </div>
          <button
            type="button"
            aria-label={c.close}
            onClick={() => dialogRef.current?.close()}
            className="grid size-9 shrink-0 place-items-center rounded-full text-[#63717c] hover:bg-[#eef2f4]"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <InvestorSelfCheckFlow
            lang={lang}
            initialAccountType={currentUser.investorAccountType ?? null}
            resultFooter={(ctx) => (
              <div className="mt-6 space-y-3 border-t border-[#e2e6e8] pt-6">
                {status === "error" && (
                  <p role="alert" className="text-sm font-semibold text-[#9a3d35]">{c.error}</p>
                )}
                <button
                  type="button"
                  disabled={status === "saving"}
                  onClick={() => save(ctx.accountType, ctx.category)}
                  className="flex h-11 w-full items-center justify-center rounded-md bg-[#102f46] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173f5c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "saving" ? c.saving : c.save}
                </button>
              </div>
            )}
          />
        </div>
      </dialog>
    </>
  );
}
