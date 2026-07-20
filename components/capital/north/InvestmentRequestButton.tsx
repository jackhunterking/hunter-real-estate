"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { DealerDisclosure } from "./DealerDisclosure";
import { usePortalAccess } from "./PortalAccessProvider";

const COPY = {
  en: {
    open: "Start investment request", title: "Start an investment request",
    intro: "Tell Hunter & Hunter Investment Advisory which Canadian opportunity interests you and how you prefer to be contacted. Eligibility questions come later only if required.",
    fund: "Fund", amount: "Indicative amount (CAD)", account: "Investing as", individual: "Individual", entity: "Entity",
    contact: "Preferred contact method", email: "Email", phone: "Phone", whatsapp: "WhatsApp", note: "Optional note",
    noteHint: "Anything you would like Hunter & Hunter Investment Advisory to know", consent: "I consent to Hunter & Hunter Investment Advisory contacting me about this request.",
    cancel: "Close", submit: "Submit request", sending: "Submitting…",
    success: "Your request was submitted. Hunter & Hunter Investment Advisory will follow up using your preferred contact method.",
    error: "The request could not be submitted. Please review the form and try again.",
  },
  tr: {
    open: "Yatırım talebi başlat", title: "Yatırım talebi başlatın",
    intro: "Hunter & Hunter Yatırım Danışmanlığı’na hangi Kanada fırsatıyla ilgilendiğinizi ve sizinle nasıl iletişim kurulmasını istediğinizi bildirin. Uygunluk soruları yalnızca gerektiğinde daha sonra gelir.",
    fund: "Fon", amount: "Gösterge tutarı (CAD)", account: "Yatırımcı türü", individual: "Bireysel", entity: "Tüzel kişi",
    contact: "Tercih edilen iletişim yöntemi", email: "E-posta", phone: "Telefon", whatsapp: "WhatsApp", note: "İsteğe bağlı not",
    noteHint: "Hunter & Hunter Yatırım Danışmanlığı’nın bilmesini istediğiniz herhangi bir bilgi", consent: "Hunter & Hunter Yatırım Danışmanlığı’nın bu taleple ilgili benimle iletişime geçmesine izin veriyorum.",
    cancel: "Kapat", submit: "Talebi gönder", sending: "Gönderiliyor…",
    success: "Talebiniz gönderildi. Hunter & Hunter Yatırım Danışmanlığı tercih ettiğiniz iletişim yöntemiyle sizinle bağlantı kuracak.",
    error: "Talep gönderilemedi. Formu kontrol edip tekrar deneyin.",
  },
} as const;

export function InvestmentRequestButton({ offerings, initialOfferingId, className = "", light = false }: { offerings: OfferingBundle[]; initialOfferingId?: string; className?: string; light?: boolean }) {
  const { lang } = useLang();
  const { backendConfigured, currentUser } = usePortalAccess();
  const c = COPY[lang];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const reset = () => setResult("idle");
    dialog.addEventListener("close", reset);
    return () => dialog.removeEventListener("close", reset);
  }, []);

  async function submit(formData: FormData) {
    setResult("sending");
    const payload = {
      offeringId: String(formData.get("offeringId") ?? ""), amount: Number(formData.get("amount")),
      accountType: String(formData.get("accountType") ?? ""), preferredContactMethod: String(formData.get("preferredContactMethod") ?? ""),
      contactConsent: formData.get("contactConsent") === "on", note: String(formData.get("note") ?? ""),
    };
    if (!backendConfigured) {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      setResult("success");
      return;
    }
    const response = await fetch("/api/hnc-investment-requests", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setResult(response.ok ? "success" : "error");
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold ${light ? "bg-white text-[#0a2d46] hover:bg-[#edf3f6]" : "bg-[#0a2d46] text-white hover:bg-[#123f5e]"} ${className}`}>{c.open}</button>
      <dialog ref={dialogRef} aria-labelledby="investment-request-title" className="m-auto w-[min(94vw,620px)] rounded-xl border-0 bg-white p-0 text-[#1d3342] shadow-2xl backdrop:bg-[#061521]/65">
        <div className="flex items-start justify-between gap-4 border-b border-[#e4e8eb] px-5 py-4 sm:px-6">
          <div><h2 id="investment-request-title" className="text-xl font-semibold">{c.title}</h2><p className="mt-1 max-w-lg text-sm leading-6 text-[#687681]">{c.intro}</p></div>
          <button type="button" aria-label={c.cancel} onClick={() => dialogRef.current?.close()} className="grid size-9 shrink-0 place-items-center rounded-full text-[#63717c] hover:bg-[#eef2f4]"><X className="size-5" /></button>
        </div>
        {result === "success" ? (
          <div className="p-8 text-center"><CheckCircle2 className="mx-auto size-10 text-[#2f7654]" /><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#4e626f]">{c.success}</p><button type="button" onClick={() => dialogRef.current?.close()} className="mt-6 h-10 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white">{c.cancel}</button></div>
        ) : (
          <form action={submit} className="space-y-5 p-5 sm:p-6">
            <div><label htmlFor="request-offering" className="text-xs font-semibold text-[#51636f]">{c.fund}</label><select id="request-offering" name="offeringId" defaultValue={initialOfferingId ?? offerings[0]?.id} required className="mt-1.5 h-11 w-full rounded-md border border-[#ccd5db] bg-white px-3 text-sm">{offerings.filter((offering) => offering.status === "available").map((offering) => <option key={offering.id} value={offering.id}>{offering.shortName[lang]}</option>)}</select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="request-amount" className="text-xs font-semibold text-[#51636f]">{c.amount}</label><input id="request-amount" name="amount" type="number" min="1" step="1" required className="mt-1.5 h-11 w-full rounded-md border border-[#ccd5db] px-3 text-sm" /></div>
              <div><label htmlFor="request-account" className="text-xs font-semibold text-[#51636f]">{c.account}</label><select id="request-account" name="accountType" defaultValue={currentUser.investorAccountType ?? "individual"} required className="mt-1.5 h-11 w-full rounded-md border border-[#ccd5db] bg-white px-3 text-sm"><option value="individual">{c.individual}</option><option value="entity">{c.entity}</option></select></div>
            </div>
            <fieldset><legend className="text-xs font-semibold text-[#51636f]">{c.contact}</legend><div className="mt-2 grid grid-cols-3 gap-2">{[["email", c.email], ["phone", c.phone], ["whatsapp", c.whatsapp]].map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 rounded-md border border-[#d5dde2] p-3 text-sm"><input type="radio" name="preferredContactMethod" value={value} defaultChecked={value === "email"} required />{label}</label>)}</div></fieldset>
            <div><label htmlFor="request-note" className="text-xs font-semibold text-[#51636f]">{c.note}</label><textarea id="request-note" name="note" rows={3} maxLength={2000} placeholder={c.noteHint} className="mt-1.5 w-full rounded-md border border-[#ccd5db] p-3 text-sm" /></div>
            <DealerDisclosure level="transactional" className="rounded-md border border-[#dfe5e8] bg-[#f8fafb] p-4" />
            <label className="flex items-start gap-3 rounded-md bg-[#f4f7f8] p-4 text-sm leading-5 text-[#435764]"><input type="checkbox" name="contactConsent" required className="mt-0.5" />{c.consent}</label>
            {result === "error" && <p role="alert" className="text-sm font-semibold text-[#9a3d35]">{c.error}</p>}
            <div className="flex justify-end gap-3 border-t border-[#e7ebee] pt-5"><button type="button" onClick={() => dialogRef.current?.close()} className="h-10 rounded-md border border-[#ccd5db] px-4 text-sm font-semibold text-[#435764]">{c.cancel}</button><button type="submit" disabled={result === "sending"} className="h-10 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-60">{result === "sending" ? c.sending : c.submit}</button></div>
          </form>
        )}
      </dialog>
    </>
  );
}
