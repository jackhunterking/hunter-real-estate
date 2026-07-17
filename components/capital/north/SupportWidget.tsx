"use client";

import { MessageCircle } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { buildHncWhatsAppUrl, HNC_CHAT_ENABLED } from "@/lib/capital/support";

export function SupportWidget({ context }: { context?: string }) {
  const { lang } = useLang();
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {HNC_CHAT_ENABLED ? (
        <div id="hnc-chat-widget-slot" data-context={context ?? "hunter-north-capital"} />
      ) : null}
      <a
        href={buildHncWhatsAppUrl(context)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-[#0a2d46] px-4 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(7,28,44,0.24)] transition hover:bg-[#123f5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8bf7a] focus-visible:ring-offset-2"
      >
        <MessageCircle className="size-4" />
        {lang === "tr" ? "WhatsApp" : "WhatsApp"}
      </a>
    </div>
  );
}
