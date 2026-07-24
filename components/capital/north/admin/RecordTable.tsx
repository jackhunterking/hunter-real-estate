"use client";

/**
 * The generic read-only section: a searchable list of records with a detail
 * drawer. Used by Investment interests, Firm memberships, Email delivery and
 * Legal documents — four sections that differ only in their rows, so they share
 * one component rather than four near-identical ones.
 *
 * Rows arrive already flattened by lib/capital/admin-server.ts, which is what
 * lets this stay presentational.
 */
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { AdminRecordRow } from "@/lib/capital/admin-server";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { Panel, shortDate } from "../PortalUI";

const COPY = {
  en: { search: "Search", none: "Nothing here yet.", close: "Close", details: "Details" },
  tr: { search: "Ara", none: "Burada henüz kayıt yok.", close: "Kapat", details: "Ayrıntılar" },
} as const;

export function RecordTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: AdminRecordRow[];
}) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminRecordRow | null>(null);

  const visible = useMemo(() => {
    const needle = query.toLocaleLowerCase();
    return rows.filter((row) =>
      `${row.title} ${row.subtitle} ${row.status}`.toLocaleLowerCase().includes(needle),
    );
  }, [rows, query]);

  return <section>
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-[#18384e]">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#657681]">{description}</p>
      </div>
      {rows.length > 0 && (
        <label className="relative block min-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81909a]" />
          <span className="sr-only">{c.search}</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search}
            className="h-10 w-full rounded-md border border-[#d5dde2] bg-white pl-9 pr-3 text-sm" />
        </label>
      )}
    </div>

    <Panel className="overflow-hidden">
      <div className="divide-y divide-[#e8ecee]">
        {visible.map((row) => (
          <button key={row.id} type="button" onClick={() => setSelected(row)}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left hover:bg-[#f7f9fa]">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#1c3546]">{row.title}</span>
              <span className="mt-1 block truncate text-xs text-[#6b7982]">{row.subtitle}</span>
            </span>
            <span className="text-right">
              <span className="block rounded bg-[#eef2f4] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5f6e78]">{row.status}</span>
              {row.date && <span className="mt-1.5 block text-[10px] text-[#87929a]">{shortDate(row.date.slice(0, 10), lang)}</span>}
            </span>
          </button>
        ))}
        {!visible.length && <div className="p-12 text-center text-sm text-[#697680]">{c.none}</div>}
      </div>
    </Panel>

    {selected && (
      <div className="fixed inset-0 z-[80]">
        <button type="button" aria-label={c.close} className="absolute inset-0 bg-[#061521]/50" onClick={() => setSelected(null)} />
        <aside role="dialog" aria-modal="true" aria-labelledby="record-drawer-title"
          className="absolute inset-y-0 right-0 w-[min(94vw,520px)] overflow-y-auto bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b878f]">{c.details}</p>
              <h3 id="record-drawer-title" className="mt-2 text-xl font-semibold text-[#183246]">{selected.title}</h3>
              <span className="mt-2 inline-flex rounded bg-[#eef2f4] px-2 py-1 text-xs font-bold text-[#5c6b75]">{selected.status}</span>
            </div>
            <button type="button" aria-label={c.close} onClick={() => setSelected(null)}
              className="grid size-9 place-items-center rounded-full hover:bg-[#eef2f4]"><X className="size-5" /></button>
          </div>
          <dl className="mt-7 divide-y divide-[#e8ecee]">
            {Object.entries(selected.details)
              .filter(([, value]) => value !== undefined && value !== null && value !== "")
              .map(([key, value]) => (
                <div key={key} className="py-3">
                  <dt className="text-xs font-semibold text-[#75818a]">{key}</dt>
                  <dd className="mt-1 break-words text-sm leading-6 text-[#2c4352]">{String(value)}</dd>
                </div>
              ))}
          </dl>
        </aside>
      </div>
    )}
  </section>;
}
