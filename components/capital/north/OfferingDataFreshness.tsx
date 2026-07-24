"use client";

/**
 * Data freshness: one row per investment showing how current its figures are,
 * when the manager's next update is due, and how complete the profile is.
 *
 * This exists because staleness was previously invisible. Lankin Apartment REIT
 * acquired a $72M property in May 2026 and the platform carried the old figures
 * for months — nothing recorded that an update was owed, so nothing was overdue.
 *
 * Every review starts at the manager's own fund page (the "Manager page" link):
 * compare their headline properties / units / AUM against ours, then record what
 * you found. Recording a review stamps the offering and advances the due date in
 * one call (api.record_offering_review), so the two can never disagree.
 */
import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ExternalLink, PencilLine, TriangleAlert } from "lucide-react";
import type { OfferingAdminRow } from "@/lib/capital/offering-admin-server";
import type { FreshnessStatus, ReviewOutcome } from "@/lib/capital/types";
import { scoreOfferingCompleteness } from "@/lib/capital/field-catalogue";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";

const COPY = {
  en: {
    title: "Data freshness",
    description:
      "How current each investment's figures are, and when the manager's next update is due. Start every review on the manager's own fund page.",
    backend: "Connect the Supabase backend to track data freshness.",
    none: "No investments yet.",
    investment: "Investment", period: "Figures as of", due: "Next update due", reviewed: "Last reviewed",
    complete: "Complete", cadence: "Cadence", owner: "Owner", never: "Never", notSet: "Not set",
    managerPage: "Manager page", edit: "Edit profile", record: "Record review",
    outcome: "What did you find?", updated: "Updated the figures", noChange: "Checked — nothing changed",
    awaiting: "Manager has not published yet", periodEnd: "Period end (YYYY-MM-DD)",
    periodLabel: "Period label (e.g. Q2 2026)", note: "Note", save: "Save review", cancel: "Cancel",
    error: "The review was not recorded.", saved: "Review recorded.",
    missing: "missing required",
    status: { current: "Current", "due-soon": "Due soon", overdue: "Overdue", unscheduled: "Unscheduled" },
  },
  tr: {
    title: "Veri güncelliği",
    description:
      "Her yatırımın verilerinin ne kadar güncel olduğu ve yöneticinin bir sonraki güncellemesinin ne zaman beklendiği. Her incelemeye yöneticinin kendi fon sayfasından başlayın.",
    backend: "Veri güncelliğini izlemek için Supabase altyapısını bağlayın.",
    none: "Henüz yatırım yok.",
    investment: "Yatırım", period: "Veri tarihi", due: "Sonraki güncelleme", reviewed: "Son inceleme",
    complete: "Tamamlanma", cadence: "Sıklık", owner: "Sorumlu", never: "Hiç", notSet: "Belirtilmemiş",
    managerPage: "Yönetici sayfası", edit: "Profili düzenle", record: "İnceleme kaydet",
    outcome: "Ne buldunuz?", updated: "Veriler güncellendi", noChange: "Kontrol edildi — değişiklik yok",
    awaiting: "Yönetici henüz yayımlamadı", periodEnd: "Dönem sonu (YYYY-AA-GG)",
    periodLabel: "Dönem etiketi (örn. 2026 2Ç)", note: "Not", save: "İncelemeyi kaydet", cancel: "Vazgeç",
    error: "İnceleme kaydedilemedi.", saved: "İnceleme kaydedildi.",
    missing: "zorunlu alan eksik",
    status: { current: "Güncel", "due-soon": "Yaklaşıyor", overdue: "Gecikmiş", unscheduled: "Planlanmamış" },
  },
} as const;

const STATUS_STYLE: Record<FreshnessStatus, string> = {
  current: "bg-[#e8f4ed] text-[#2f7d55]",
  "due-soon": "bg-[#fdf3e0] text-[#8a6d24]",
  overdue: "bg-[#fbecea] text-[#a24d43]",
  unscheduled: "bg-[#eef2f4] text-[#5f6e78]",
};

/** Overdue first, then due-soon — the work that needs doing sorts to the top. */
const STATUS_ORDER: Record<FreshnessStatus, number> = { overdue: 0, "due-soon": 1, unscheduled: 2, current: 3 };

export function OfferingDataFreshness({
  offerings,
  backendConfigured,
  onEdit,
}: {
  offerings: OfferingAdminRow[];
  backendConfigured: boolean;
  onEdit?: (offeringId: string) => void;
}) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const [openId, setOpenId] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "error" | "saved">("idle");

  const rows = useMemo(
    () =>
      [...offerings]
        .map((row) => ({ row, score: scoreOfferingCompleteness(row.bundle) }))
        .sort((a, b) => STATUS_ORDER[a.row.freshnessStatus] - STATUS_ORDER[b.row.freshnessStatus]),
    [offerings],
  );

  if (!backendConfigured) {
    return <section className="rounded-lg border border-[#d9e1e5] bg-white p-8">
      <CalendarClock className="size-8 text-[#7b919e]" />
      <h2 className="mt-4 text-xl font-semibold text-[#18384e]">{c.title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#657681]">{c.backend}</p>
    </section>;
  }

  return <section>
    <div className="mb-5">
      <h2 className="text-2xl font-semibold text-[#18384e]">{c.title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-[#657681]">{c.description}</p>
    </div>

    {!rows.length ? (
      <p className="rounded-lg border border-[#d9e1e5] bg-white p-8 text-sm text-[#71808a]">{c.none}</p>
    ) : (
      <div className="space-y-3">
        {rows.map(({ row, score }) => (
          <article key={row.id} className="rounded-lg border border-[#d9e1e5] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-[#234154]">{tx(row.bundle?.name, lang) || row.slug}</h3>
                <p className="mt-0.5 text-xs text-[#87929a]">{row.slug} · {row.status}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] ${STATUS_STYLE[row.freshnessStatus]}`}>
                {row.freshnessStatus === "overdue" ? <TriangleAlert className="size-3.5" /> : row.freshnessStatus === "current" ? <CheckCircle2 className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                {c.status[row.freshnessStatus]}
              </span>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
              <Cell label={c.period} value={row.dataPeriodLabel ?? row.dataAsOf ?? c.notSet} />
              <Cell label={c.due} value={row.nextReviewDueAt ?? c.notSet} />
              <Cell label={c.reviewed} value={row.lastReviewedAt?.slice(0, 10) ?? c.never} />
              <Cell label={c.cadence} value={row.updateCadence} />
              <Cell
                label={c.complete}
                value={`${score.percent}%`}
                hint={score.missingRequired.length ? `${score.missingRequired.length} ${c.missing}` : undefined}
              />
            </dl>

            {score.missingRequired.length > 0 && (
              <p className="mt-3 rounded-md bg-[#fdf3e0] px-3 py-2 text-xs leading-5 text-[#8a6d24]">
                {score.missingRequired.map((field) => tx(field.label, lang)).join(" · ")}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8edef] pt-4">
              {row.managerPublicUrl && (
                <a
                  href={row.managerPublicUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd6dc] bg-white px-3 text-xs font-semibold text-[#31566c]"
                >
                  <ExternalLink className="size-3.5" />{c.managerPage}
                </a>
              )}
              {onEdit && (
                <button type="button" onClick={() => onEdit(row.id)} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd6dc] bg-white px-3 text-xs font-semibold text-[#31566c]">
                  <PencilLine className="size-3.5" />{c.edit}
                </button>
              )}
              <button type="button" onClick={() => { setOpenId(openId === row.id ? null : row.id); setState("idle"); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0a2d46] px-3 text-xs font-semibold text-white">
                <CalendarClock className="size-3.5" />{c.record}
              </button>
            </div>

            {openId === row.id && (
              <ReviewForm
                copy={c}
                defaultPeriodLabel={row.dataPeriodLabel ?? ""}
                state={state}
                onCancel={() => setOpenId(null)}
                onSubmit={async (payload) => {
                  setState("saving");
                  const response = await fetch("/api/hnc-offering-reviews", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ offeringId: row.id, ...payload }),
                  });
                  if (!response.ok) { setState("error"); return; }
                  setState("saved");
                  setOpenId(null);
                  // The row's freshness comes from a server component, so a
                  // refresh is what makes the new due date visible.
                  window.location.reload();
                }}
              />
            )}
          </article>
        ))}
      </div>
    )}
  </section>;
}

function Cell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div>
    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#87929a]">{label}</dt>
    <dd className="mt-1 text-sm font-semibold text-[#2c4352]">{value}</dd>
    {hint && <dd className="text-[11px] text-[#8a6d24]">{hint}</dd>}
  </div>;
}

function ReviewForm({
  copy,
  defaultPeriodLabel,
  state,
  onCancel,
  onSubmit,
}: {
  copy: (typeof COPY)["en"];
  defaultPeriodLabel: string;
  state: "idle" | "saving" | "error" | "saved";
  onCancel: () => void;
  onSubmit: (payload: { outcome: ReviewOutcome; dataAsOf?: string; periodLabel?: string; note?: string }) => void;
}) {
  const [outcome, setOutcome] = useState<ReviewOutcome>("updated");
  const [dataAsOf, setDataAsOf] = useState("");
  const [periodLabel, setPeriodLabel] = useState(defaultPeriodLabel);
  const [note, setNote] = useState("");
  const needsPeriod = outcome === "updated";

  return <form
    className="mt-4 rounded-md border border-[#dfe5e8] bg-[#fafbfb] p-4"
    onSubmit={(event) => { event.preventDefault(); onSubmit({ outcome, dataAsOf, periodLabel, note }); }}
  >
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-[#5d707b]">{copy.outcome}</legend>
      <div className="flex flex-wrap gap-2">
        {([["updated", copy.updated], ["no-change", copy.noChange], ["awaiting-source", copy.awaiting]] as const).map(([key, label]) => (
          <label key={key} className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${outcome === key ? "border-[#8aaabd] bg-[#eef4f7] text-[#234154]" : "border-[#cbd6dc] bg-white text-[#5e6d77]"}`}>
            <input type="radio" name="outcome" value={key} checked={outcome === key} onChange={() => setOutcome(key)} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>

    {needsPeriod && (
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#5d707b]">
          <span className="mb-1.5 block">{copy.periodEnd}</span>
          <input required value={dataAsOf} onChange={(e) => setDataAsOf(e.target.value)} placeholder="2026-06-30" className="h-11 w-full rounded-md border border-[#cfd9df] bg-white px-3 text-sm text-[#263f4f]" />
        </label>
        <label className="block text-xs font-semibold text-[#5d707b]">
          <span className="mb-1.5 block">{copy.periodLabel}</span>
          <input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} className="h-11 w-full rounded-md border border-[#cfd9df] bg-white px-3 text-sm text-[#263f4f]" />
        </label>
      </div>
    )}

    <label className="mt-3 block text-xs font-semibold text-[#5d707b]">
      <span className="mb-1.5 block">{copy.note}</span>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-md border border-[#cfd9df] bg-white px-3 py-2 text-sm text-[#263f4f]" />
    </label>

    {state === "error" && <p role="alert" className="mt-3 text-sm font-semibold text-[#a24d43]">{copy.error}</p>}

    <div className="mt-4 flex gap-2">
      <button type="submit" disabled={state === "saving"} className="inline-flex h-10 items-center rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-45">{copy.save}</button>
      <button type="button" onClick={onCancel} className="inline-flex h-10 items-center rounded-md border border-[#cbd6dc] bg-white px-4 text-sm font-semibold text-[#31566c]">{copy.cancel}</button>
    </div>
  </form>;
}
