"use client";

import { useEffect, useState } from "react";
import { Clock3, MessageSquareText } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Panel } from "./PortalUI";

type Interest = {
  id: string;
  offering_id: string;
  message: string;
  preferred_channel: string;
  status: "new" | "contacted" | "qualified" | "closed";
  created_at: string;
};

const STATUS = {
  tr: { new: "Yeni", contacted: "İletişime geçildi", qualified: "Ön inceleme tamamlandı", closed: "Kapandı" },
  en: { new: "New", contacted: "Contacted", qualified: "Qualified", closed: "Closed" },
} as const;

export function InterestRequestsPanel({ offerings, enabled }: { offerings: OfferingBundle[]; enabled: boolean }) {
  const { lang } = useLang();
  const [items, setItems] = useState<Interest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch("/api/hnc-investment-interests", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { data: [] })
      .then((body) => { if (active) { setItems(body.data ?? []); setLoaded(true); } });
    return () => { active = false; };
  }, [enabled]);

  return (
    <Panel className="p-6 lg:col-span-2">
      <div className="flex items-center gap-3"><MessageSquareText className="size-6 text-[#0a4b72]" /><h2 className="font-semibold text-[#243845]">{lang === "tr" ? "Fon ilgi talepleri" : "Fund interest requests"}</h2></div>
      {!enabled && <p className="mt-4 text-sm text-[#65717e]">{lang === "tr" ? "Canlı hesap bağlandığında talepler burada görünür." : "Requests appear here when a live account is connected."}</p>}
      {enabled && !loaded && <p className="mt-4 text-sm text-[#65717e]">{lang === "tr" ? "Yükleniyor…" : "Loading…"}</p>}
      {loaded && !items.length && <p className="mt-4 text-sm text-[#65717e]">{lang === "tr" ? "Henüz bir fon ilgi talebiniz yok." : "You have not submitted a fund interest request yet."}</p>}
      {items.length > 0 && <div className="mt-5 divide-y divide-[#e4e8eb] border-y border-[#e4e8eb]">{items.map((item) => {
        const offering = offerings.find((candidate) => candidate.id === item.offering_id);
        return <div key={item.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-[#243845]">{offering?.shortName[lang] ?? item.offering_id}</p><p className="mt-1 text-xs text-[#75818b]">{item.preferred_channel}{item.message ? ` · ${item.message}` : ""}</p></div><span className="inline-flex items-center gap-1.5 self-start rounded bg-[#eef2f5] px-2.5 py-1.5 text-[10px] font-bold text-[#52616d]"><Clock3 className="size-3" />{STATUS[lang][item.status]}</span></div>;
      })}</div>}
    </Panel>
  );
}
