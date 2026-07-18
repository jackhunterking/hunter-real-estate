"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Plus, ShieldCheck } from "lucide-react";
import type { FundCommissionSchedule, LocalizedText } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Panel, shortDate } from "./PortalUI";

type OfferingOption = { id: string; name: LocalizedText };

const COPY = {
  en: {
    title: "Fund commission schedules",
    description: "Create an effective-dated fund rate, then publish it when it is ready for professional applicants.",
    fund: "Fund",
    bps: "Gross fund commission (BPS)",
    effective: "Effective from",
    note: "Internal note",
    notePlaceholder: "Optional internal context",
    save: "Save draft",
    saving: "Saving…",
    publish: "Publish",
    publishing: "Publishing…",
    noSchedules: "No schedules have been created.",
    loadError: "Schedules could not be loaded.",
    saveError: "The schedule could not be saved.",
    immutable: "Published schedules are immutable. Publish a new effective-dated draft to change a rate.",
    statuses: { draft: "Draft", published: "Published", superseded: "Superseded", withdrawn: "Withdrawn" },
  },
  tr: {
    title: "Fon komisyon programları",
    description: "Fona özel efektif BPS kaydını oluşturun ve profesyonel başvuru sahiplerine hazır olduğunda yayınlayın.",
    fund: "Fon",
    bps: "Brüt fon komisyonu (BPS)",
    effective: "Başlangıç tarihi",
    note: "İç not",
    notePlaceholder: "Opsiyonel iç açıklama",
    save: "Taslak kaydet",
    saving: "Kaydediliyor…",
    publish: "Yayınla",
    publishing: "Yayınlanıyor…",
    noSchedules: "Henüz bir program oluşturulmadı.",
    loadError: "Programlar yüklenemedi.",
    saveError: "Program kaydedilemedi.",
    immutable: "Yayınlanan programlar değiştirilemez. Oranı değiştirmek için yeni tarihli bir taslak yayınlayın.",
    statuses: { draft: "Taslak", published: "Yayında", superseded: "Yerine yenisi geldi", withdrawn: "Geri çekildi" },
  },
} as const;

export function FundCommissionScheduleManager({
  offerings,
  backendConfigured,
}: {
  offerings: OfferingOption[];
  backendConfigured: boolean;
}) {
  const { lang } = useLang();
  const c = COPY[lang];
  const [schedules, setSchedules] = useState<FundCommissionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState("");

  const loadSchedules = useCallback(async () => {
    if (!backendConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/hnc-fund-commission-schedules?scope=admin", { cache: "no-store" });
      const result = await response.json() as { data?: FundCommissionSchedule[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? c.loadError);
      setSchedules(result.data ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : c.loadError);
    } finally {
      setLoading(false);
    }
  }, [backendConfigured, c.loadError]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      offeringId: String(data.get("offeringId") ?? ""),
      grossCommissionBps: Number(data.get("grossCommissionBps")),
      effectiveFrom: String(data.get("effectiveFrom") ?? ""),
      internalNote: String(data.get("internalNote") ?? "").trim() || null,
    };
    setSaving(true);
    setError("");
    try {
      if (backendConfigured) {
        const response = await fetch("/api/hnc-fund-commission-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? c.saveError);
        await loadSchedules();
      } else {
        const now = new Date().toISOString();
        setSchedules((current) => [{
          id: `preview-schedule-${Date.now()}`,
          offeringId: input.offeringId,
          grossCommissionBps: input.grossCommissionBps,
          status: "draft",
          effectiveFrom: input.effectiveFrom,
          internalNote: input.internalNote ?? undefined,
          createdAt: now,
          updatedAt: now,
        }, ...current]);
      }
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : c.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function publish(scheduleId: string) {
    setPublishingId(scheduleId);
    setError("");
    try {
      if (backendConfigured) {
        const response = await fetch("/api/hnc-fund-commission-schedules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduleId }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? c.saveError);
        await loadSchedules();
      } else {
        const target = schedules.find((schedule) => schedule.id === scheduleId);
        if (!target) return;
        const now = new Date().toISOString();
        setSchedules((current) => current.map((schedule) => {
          if (schedule.id === target.id) {
            return { ...schedule, status: "published", publishedAt: now, updatedAt: now };
          }
          if (
            schedule.offeringId === target.offeringId
            && schedule.status === "published"
            && schedule.effectiveFrom === target.effectiveFrom
          ) {
            return { ...schedule, status: "superseded", supersededBy: target.id, updatedAt: now };
          }
          return schedule;
        }));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : c.saveError);
    } finally {
      setPublishingId("");
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#172a39]">{c.title}</h2>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-[#76818b]">{c.description}</p>
      </div>

      <Panel className="p-5 sm:p-6">
        <form onSubmit={saveDraft} className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_0.8fr_1.2fr_auto] lg:items-end">
          <label className="text-xs font-semibold text-[#52636e]">
            {c.fund}
            <select name="offeringId" required defaultValue="" className="mt-1.5 h-10 w-full rounded-md border border-[#d3dbe0] bg-white px-3 text-sm font-normal">
              <option value="" disabled>—</option>
              {offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.name[lang]}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#52636e]">
            {c.bps}
            <input name="grossCommissionBps" required type="number" min="0.01" max="10000" step="0.01" className="mt-1.5 h-10 w-full rounded-md border border-[#d3dbe0] px-3 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold text-[#52636e]">
            {c.effective}
            <input name="effectiveFrom" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1.5 h-10 w-full rounded-md border border-[#d3dbe0] px-3 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold text-[#52636e]">
            {c.note}
            <input name="internalNote" maxLength={1000} placeholder={c.notePlaceholder} className="mt-1.5 h-10 w-full rounded-md border border-[#d3dbe0] px-3 text-sm font-normal" />
          </label>
          <button disabled={saving || !offerings.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-50">
            <Plus className="size-4" />{saving ? c.saving : c.save}
          </button>
        </form>
        <p className="mt-4 flex items-center gap-2 text-xs text-[#71808a]"><ShieldCheck className="size-4" />{c.immutable}</p>
      </Panel>

      {error && <p role="alert" className="mt-4 rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}

      <Panel className="mt-4 overflow-hidden">
        <div className="divide-y divide-[#e8ecee]">
          {schedules.map((schedule) => {
            const offering = offerings.find((item) => item.id === schedule.offeringId);
            return (
              <div key={schedule.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center md:px-5">
                <div>
                  <p className="text-sm font-semibold text-[#1c3546]">{offering?.name[lang] ?? schedule.offeringId}</p>
                  <p className="mt-1 text-xs text-[#6b7982]">{schedule.internalNote ?? "—"}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-[#0a4b72]">{schedule.grossCommissionBps.toLocaleString(lang === "tr" ? "tr-TR" : "en-CA")} BPS</p>
                <p className="inline-flex items-center gap-1.5 text-xs text-[#65737d]"><CalendarClock className="size-4" />{shortDate(schedule.effectiveFrom, lang)}</p>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${schedule.status === "published" ? "bg-[#e8f2ec] text-[#2d6849]" : "bg-[#eef2f4] text-[#5f6e78]"}`}>
                    {c.statuses[schedule.status]}
                  </span>
                  {schedule.status === "draft" && (
                    <button type="button" onClick={() => publish(schedule.id)} disabled={publishingId === schedule.id} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#0a2d46] px-3 text-xs font-semibold text-white disabled:opacity-50">
                      <CheckCircle2 className="size-4" />{publishingId === schedule.id ? c.publishing : c.publish}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!loading && !schedules.length && <p className="p-8 text-center text-sm text-[#697680]">{c.noSchedules}</p>}
          {loading && <p className="p-8 text-center text-sm text-[#697680]">{c.saving}</p>}
        </div>
      </Panel>
    </div>
  );
}
