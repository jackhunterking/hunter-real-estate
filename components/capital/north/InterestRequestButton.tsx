"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function InterestRequestButton({ offeringId }: { offeringId: string }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const liveOffering = UUID.test(offeringId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await fetch("/api/hnc-investment-interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offeringId,
        message: form.get("message"),
        preferredChannel: form.get("preferredChannel"),
        contactConsent: form.get("consent") === "on",
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(lang === "tr" ? "Talep kaydedilemedi." : "The request could not be saved.");
      return;
    }
    setComplete(true);
  }

  if (complete) {
    return <p role="status" className="inline-flex items-center gap-2 rounded-md bg-[#eaf4ee] px-4 py-3 text-sm font-semibold text-[#316247]"><CheckCircle2 className="size-4" />{lang === "tr" ? "İlginiz kaydedildi" : "Your interest was recorded"}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={!liveOffering}
        title={!liveOffering ? (lang === "tr" ? "Canlı fon aktarımından sonra etkinleşir" : "Enabled after the live offering import") : undefined}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {lang === "tr" ? "İlgileniyorum" : "I’m interested"}<Send className="size-4" />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 max-w-xl space-y-4 rounded-md border border-[#d6dde2] bg-[#f7f8f8] p-4">
      <label className="block text-xs font-semibold text-[#40515d]">
        {lang === "tr" ? "Tercih edilen iletişim" : "Preferred contact channel"}
        <select name="preferredChannel" className="mt-2 h-10 w-full rounded-md border border-[#cdd4d8] bg-white px-3 font-normal">
          <option value="email">Email</option>
          <option value="phone">{lang === "tr" ? "Telefon" : "Phone"}</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </label>
      <label className="block text-xs font-semibold text-[#40515d]">
        {lang === "tr" ? "Mesaj (isteğe bağlı)" : "Message (optional)"}
        <textarea name="message" maxLength={2000} rows={3} className="mt-2 w-full rounded-md border border-[#cdd4d8] bg-white p-3 font-normal" />
      </label>
      <label className="flex items-start gap-2 text-xs leading-5 text-[#596873]"><input name="consent" type="checkbox" required className="mt-1" />{lang === "tr" ? "Hunter North'un bu fonla ilgili benimle iletişim kurmasına izin veriyorum." : "I consent to Hunter North contacting me about this fund."}</label>
      {error && <p role="alert" className="text-xs text-[#98463c]">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="h-10 rounded-md bg-[#0a2d46] px-4 text-xs font-semibold text-white disabled:opacity-60">{pending ? (lang === "tr" ? "Gönderiliyor…" : "Sending…") : (lang === "tr" ? "Talebi gönder" : "Send request")}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-md border border-[#cdd4d8] px-4 text-xs font-semibold text-[#52616d]">{lang === "tr" ? "İptal" : "Cancel"}</button>
      </div>
    </form>
  );
}
