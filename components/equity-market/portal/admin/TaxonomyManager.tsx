"use client";

/**
 * Taxonomies — the strategy, asset-class and region tags that drive investment
 * filtering, the discover cards and the map.
 *
 * These nine rows previously existed only as INSERTs inside a migration, so
 * adding a region or renaming a strategy meant writing SQL and deploying. The
 * usage count next to each tag is what makes retirement safe to offer: a key a
 * published investment still cites must keep resolving, so retiring one in use
 * is refused here and again in `api.retire_taxonomy`.
 */
import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { AdminTaxonomyRow } from "@/lib/equity-market/admin-server";
import type { LocalizedText } from "@/lib/equity-market/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { Panel } from "../PortalUI";

type Kind = "strategy" | "asset_class" | "region";
const KINDS: Kind[] = ["strategy", "asset_class", "region"];

const COPY = {
  en: {
    title: "Taxonomies",
    description: "The tags investments are classified by. Used across discover filters, investment cards and the portfolio map.",
    kinds: { strategy: "Strategy", asset_class: "Asset class", region: "Region" },
    key: "Key", labelEn: "Label (English)", labelTr: "Label (Turkish)", colour: "Colour", order: "Order",
    used: "used by", investments: "investment(s)", unused: "not used yet",
    add: "Add tag", save: "Save", retire: "Retire", inUse: "In use — cannot be retired",
    keyHint: "Lowercase letters, digits and hyphens. The key is permanent once investments use it.",
    error: "The change was not saved.", saved: "Saved.",
    none: "No tags of this kind yet.",
  },
  tr: {
    title: "Sınıflandırmalar",
    description: "Yatırımların sınıflandırıldığı etiketler. Keşfet filtrelerinde, yatırım kartlarında ve portföy haritasında kullanılır.",
    kinds: { strategy: "Strateji", asset_class: "Varlık sınıfı", region: "Bölge" },
    key: "Anahtar", labelEn: "Etiket (İngilizce)", labelTr: "Etiket (Türkçe)", colour: "Renk", order: "Sıra",
    used: "kullanan", investments: "yatırım", unused: "henüz kullanılmıyor",
    add: "Etiket ekle", save: "Kaydet", retire: "Kaldır", inUse: "Kullanımda — kaldırılamaz",
    keyHint: "Küçük harf, rakam ve tire. Yatırımlar kullandıktan sonra anahtar kalıcıdır.",
    error: "Değişiklik kaydedilemedi.", saved: "Kaydedildi.",
    none: "Bu türde henüz etiket yok.",
  },
} as const;

type Draft = { kind: Kind; key: string; label: LocalizedText; color: string; sortOrder: number };

export function TaxonomyManager({ taxonomies }: { taxonomies: AdminTaxonomyRow[] }) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const [state, setState] = useState<"idle" | "saving" | "error" | "saved">("idle");
  const [draft, setDraft] = useState<Draft | null>(null);

  const grouped = useMemo(
    () => KINDS.map((kind) => ({ kind, rows: taxonomies.filter((t) => t.kind === kind) })),
    [taxonomies],
  );

  async function send(body: unknown) {
    setState("saving");
    const response = await fetch("/api/portal-taxonomies", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!response.ok) { setState("error"); return; }
    setState("saved");
    window.location.reload();
  }

  return <section>
    <div className="mb-4">
      <h2 className="text-2xl font-semibold text-[#18384e]">{c.title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-[#657681]">{c.description}</p>
    </div>

    {state === "error" && <p role="alert" className="mb-3 rounded-md bg-[#fbecea] px-3 py-2 text-sm font-semibold text-[#a24d43]">{c.error}</p>}

    <div className="space-y-5">
      {grouped.map(({ kind, rows }) => (
        <Panel key={kind} className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#234154]">{c.kinds[kind]}</h3>
            <button type="button"
              onClick={() => setDraft({ kind, key: "", label: { en: "", tr: "" }, color: "", sortOrder: rows.length })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4b72]">
              <Plus className="size-3.5" />{c.add}
            </button>
          </div>

          <div className="divide-y divide-[#eef2f4]">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1c3546]">
                    {tx(row.label, lang) || row.key}
                    {row.color && <span className="ml-2 inline-block size-2.5 rounded-full align-middle" style={{ background: row.color }} />}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-[#87929a]">{row.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#6b7982]">
                    {row.usageCount > 0 ? `${c.used} ${row.usageCount} ${c.investments}` : c.unused}
                  </span>
                  <button type="button"
                    disabled={row.usageCount > 0 || state === "saving"}
                    title={row.usageCount > 0 ? c.inUse : undefined}
                    onClick={() => send({ action: "retire", kind: row.kind, key: row.key })}
                    className="grid size-9 place-items-center rounded-md border border-[#e1c8c4] text-[#a24d43] disabled:opacity-35">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            {!rows.length && !draft && <p className="py-6 text-center text-sm text-[#71808a]">{c.none}</p>}
          </div>

          {draft?.kind === kind && (
            <form className="mt-4 rounded-md border border-[#dfe5e8] bg-[#fafbfb] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                send({ action: "upsert", kind: draft.kind, key: draft.key, label: draft.label,
                  color: draft.color || undefined, sortOrder: draft.sortOrder });
              }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={c.key}>
                  <input required value={draft.key} pattern="[a-z0-9-]+"
                    onChange={(e) => setDraft({ ...draft, key: e.target.value })} className="tfield" />
                </Field>
                <Field label={c.order}>
                  <input type="number" value={draft.sortOrder}
                    onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} className="tfield" />
                </Field>
                <Field label={c.labelEn}>
                  <input required value={draft.label.en}
                    onChange={(e) => setDraft({ ...draft, label: { ...draft.label, en: e.target.value } })} className="tfield" />
                </Field>
                <Field label={c.labelTr}>
                  <input required value={draft.label.tr}
                    onChange={(e) => setDraft({ ...draft, label: { ...draft.label, tr: e.target.value } })} className="tfield" />
                </Field>
                <Field label={c.colour}>
                  <input value={draft.color} placeholder="#0a4b72"
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="tfield" />
                </Field>
              </div>
              <p className="mt-2 text-[11px] text-[#87929a]">{c.keyHint}</p>
              <div className="mt-3 flex gap-2">
                <button type="submit" disabled={state === "saving"}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-45">
                  <Save className="size-4" />{c.save}
                </button>
                <button type="button" onClick={() => setDraft(null)}
                  className="h-10 rounded-md border border-[#cbd6dc] bg-white px-4 text-sm font-semibold text-[#31566c]">×</button>
              </div>
            </form>
          )}
        </Panel>
      ))}
    </div>

    <style jsx>{`.tfield{height:2.75rem;width:100%;border-radius:.375rem;border:1px solid #cfd9df;background:white;padding:0 .75rem;font-size:.875rem;color:#263f4f;outline:none}.tfield:focus{border-color:#0a4b72;box-shadow:0 0 0 2px rgba(10,75,114,.12)}`}</style>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[#5d707b]"><span className="mb-1.5 block">{label}</span>{children}</label>;
}
