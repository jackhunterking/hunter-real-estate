"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { usePortalAccess } from "./PortalAccessProvider";
import { PageHeader, Panel, shortDate } from "./PortalUI";

type Status = "new" | "contacted" | "qualified" | "closed";
type Interest = {
  id: string;
  user_id: string;
  offering_id: string;
  message: string;
  preferred_channel: string;
  status: Status;
  reviewer_notes: string | null;
  created_at: string;
};

export function InterestRequestAdmin({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { dataset } = usePortalAccess();
  const [items, setItems] = useState<Interest[]>([]);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/hnc-investment-interests", { cache: "no-store" });
    if (!response.ok) { setError(lang === "tr" ? "Talepler yüklenemedi." : "Requests could not be loaded."); return; }
    const body = await response.json();
    setItems(body.data ?? []);
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function update(item: Interest, status: Status, reviewerNotes: string) {
    setPendingId(item.id);
    setError("");
    const response = await fetch("/api/hnc-investment-interests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interestId: item.id, status, reviewerNotes }),
    });
    setPendingId("");
    if (!response.ok) { setError(lang === "tr" ? "Durum güncellenemedi." : "Status could not be updated."); return; }
    await load();
  }

  return (
    <div>
      <PageHeader eyebrow={lang === "tr" ? "Operasyon" : "Operations"} title={lang === "tr" ? "Fon ilgi talepleri" : "Fund interest requests"} description={lang === "tr" ? "Kullanıcı tarafından başlatılan, izinli iletişim taleplerini yönetin. Durum değişiklikleri yalnızca MFA korumalı Hunter North yönetici erişiminden yapılır." : "Manage user-initiated, consented contact requests. Status changes are limited to MFA-protected Hunter North administrator access."} />
      {error && <p role="alert" className="mb-4 rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
      <div className="grid gap-4">
        {items.map((item) => {
          const user = dataset.users.find((candidate) => candidate.id === item.user_id);
          const offering = offerings.find((candidate) => candidate.id === item.offering_id);
          return <InterestAdminRow key={item.id} item={item} user={user?.displayName ?? item.user_id} offering={offering?.shortName[lang] ?? item.offering_id} pending={pendingId === item.id} lang={lang} onUpdate={update} />;
        })}
        {!items.length && <Panel className="p-12 text-center"><MessageSquareText className="mx-auto size-7 text-[#82909a]" /><p className="mt-3 text-sm text-[#65717e]">{lang === "tr" ? "Henüz ilgi talebi yok." : "There are no interest requests yet."}</p></Panel>}
      </div>
    </div>
  );
}

function InterestAdminRow({ item, user, offering, pending, lang, onUpdate }: { item: Interest; user: string; offering: string; pending: boolean; lang: "tr" | "en"; onUpdate: (item: Interest, status: Status, notes: string) => Promise<void> }) {
  const [status, setStatus] = useState<Status>(item.status);
  const [notes, setNotes] = useState(item.reviewer_notes ?? "");
  return <Panel className="p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#75818b]">{offering}</p><h2 className="mt-2 font-semibold text-[#243845]">{user}</h2><p className="mt-2 text-xs text-[#75818b]">{item.preferred_channel} · {shortDate(item.created_at.slice(0, 10), lang)}</p>{item.message && <p className="mt-4 max-w-2xl text-sm leading-6 text-[#596873]">{item.message}</p>}</div><div className="grid min-w-0 gap-2 sm:grid-cols-[180px_minmax(220px,1fr)_auto] lg:w-[620px]"><select value={status} onChange={(event) => setStatus(event.target.value as Status)} className="h-10 rounded-md border border-[#d6dde2] bg-white px-3 text-sm"><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="closed">Closed</option></select><input value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} placeholder={lang === "tr" ? "İç inceleme notu" : "Internal reviewer note"} className="h-10 rounded-md border border-[#d6dde2] px-3 text-sm" /><button disabled={pending || (status === item.status && notes === (item.reviewer_notes ?? ""))} onClick={() => onUpdate(item, status, notes)} className="h-10 rounded-md bg-[#0a2d46] px-4 text-xs font-semibold text-white disabled:opacity-50">{pending ? "…" : (lang === "tr" ? "Kaydet" : "Save")}</button></div></div></Panel>;
}
