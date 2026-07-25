"use client";

import { useState } from "react";
import type { OfferingBundle } from "@/lib/capital/types";
import type { InvestmentApplication } from "@/lib/capital/portal-access";
import { formatCurrencyCad } from "@/lib/capital/present";
import { unitPriceOf, impliedShares } from "@/lib/capital/shares";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { usePortalAccess } from "../PortalAccessProvider";
import { Panel, shortDate } from "../PortalUI";

type Status = InvestmentApplication["status"];

const STATUSES: Status[] = [
  "draft", "submitted", "compliance_review", "approved_for_subscription",
  "accepted", "funded", "declined", "withdrawn", "closed",
];

const COPY = {
  en: {
    title: "Requests & transaction status",
    lead: "Advance a request through its lifecycle. Setting it to Funded surfaces the position in the investor's portfolio.",
    empty: "This investor has no investment requests yet.",
    units: "units", perUnit: "per unit", committed: "committed", impliedTag: "implied",
    account: "Account", channel: "Contact", note: "Note", submitted: "Submitted", updated: "Updated",
    status: "Status", update: "Update", updating: "Updating…", failed: "Could not update. Try again.",
    individual: "Individual", entity: "Entity",
    labels: {
      draft: "Draft", submitted: "Submitted", compliance_review: "Compliance review",
      approved_for_subscription: "Approved for subscription", accepted: "Accepted", funded: "Funded",
      declined: "Declined", withdrawn: "Withdrawn", closed: "Closed",
    } as Record<Status, string>,
  },
  tr: {
    title: "Talepler ve işlem durumu",
    lead: "Bir talebi yaşam döngüsünde ilerletin. Fonlandı olarak ayarlamak pozisyonu yatırımcının portföyünde gösterir.",
    empty: "Bu yatırımcının henüz yatırım talebi yok.",
    units: "birim", perUnit: "birim başına", committed: "taahhüt", impliedTag: "örtük",
    account: "Hesap", channel: "İletişim", note: "Not", submitted: "Gönderildi", updated: "Güncellendi",
    status: "Durum", update: "Güncelle", updating: "Güncelleniyor…", failed: "Güncellenemedi. Tekrar deneyin.",
    individual: "Bireysel", entity: "Tüzel kişi",
    labels: {
      draft: "Taslak", submitted: "Gönderildi", compliance_review: "Uyum incelemesi",
      approved_for_subscription: "Abonelik için onaylandı", accepted: "Kabul edildi", funded: "Fonlandı",
      declined: "Reddedildi", withdrawn: "Geri çekildi", closed: "Kapandı",
    } as Record<Status, string>,
  },
} as const;

export function InvestorInvestments({
  userId,
  investments,
  offerings,
}: {
  userId: string;
  investments: InvestmentApplication[];
  offerings: OfferingBundle[];
}) {
  const { lang } = useLang();
  const c = pick(COPY, lang);
  const locale = lang === "tr" ? "tr-TR" : "en-CA";

  const mine = investments
    .filter((investment) => investment.userId === userId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  return (
    <section>
      <h3 className="text-lg font-semibold text-[#193143]">{c.title}</h3>
      <p className="mt-1 mb-3 max-w-2xl text-sm leading-6 text-[#697681]">{c.lead}</p>
      {mine.length === 0 ? (
        <Panel className="p-8 text-center text-sm text-[#697681]">{c.empty}</Panel>
      ) : (
        <div className="grid gap-3">
          {mine.map((application) => {
            const fund = offerings.find((offering) => offering.id === application.offeringId);
            const price = fund ? unitPriceOf(fund) : null;
            const shares = application.shareQuantity ?? (price ? impliedShares(application.amount, price) : null);
            const implied = application.shareQuantity == null;
            return (
              <Panel key={application.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#183144]">{fund ? tx(fund.shortName, lang) : application.offeringId}</p>
                    <p className="mt-1 text-sm tabular-nums text-[#3a4d5a]">
                      {shares != null && shares > 0 && (
                        <>
                          <span className="font-semibold">{Math.round(shares).toLocaleString(locale)}</span> {c.units}
                          {implied && <span className="ml-1 text-[11px] text-[#9aa8b1]">({c.impliedTag})</span>}
                          {price != null && <span className="text-[#7a8790]"> @ {formatCurrencyCad(price, lang)} {c.perUnit}</span>}
                          <span className="text-[#c2ccd2]"> · </span>
                        </>
                      )}
                      <span className="font-semibold text-[#123f5e]">{formatCurrencyCad(application.amount, lang)}</span> <span className="text-[#7a8790]">{c.committed}</span>
                    </p>
                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6b7982]">
                      {application.accountType && <div><dt className="inline font-semibold">{c.account}: </dt><dd className="inline">{application.accountType === "entity" ? c.entity : c.individual}</dd></div>}
                      {application.preferredContactChannel && <div><dt className="inline font-semibold">{c.channel}: </dt><dd className="inline">{application.preferredContactChannel}</dd></div>}
                      {application.submittedAt && <div><dt className="inline font-semibold">{c.submitted}: </dt><dd className="inline">{shortDate(application.submittedAt.slice(0, 10), lang)}</dd></div>}
                      <div><dt className="inline font-semibold">{c.updated}: </dt><dd className="inline">{shortDate(application.updatedAt.slice(0, 10), lang)}</dd></div>
                    </dl>
                    {application.note && <p className="mt-2 max-w-xl text-xs leading-5 text-[#5c6b76]"><span className="font-semibold">{c.note}: </span>{application.note}</p>}
                  </div>
                  <StatusControl application={application} c={c} />
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatusControl({ application, c }: { application: InvestmentApplication; c: (typeof COPY)["en"] }) {
  const { setInvestmentStatus } = usePortalAccess();
  const [next, setNext] = useState<Status>(application.status);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function apply() {
    if (next === application.status) return;
    setBusy(true);
    setFailed(false);
    try {
      await setInvestmentStatus(application.id, next);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="shrink-0">
      <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[#87929a]">{c.status}</label>
      <div className="mt-1 flex items-center gap-2">
        <select
          value={next}
          onChange={(event) => setNext(event.target.value as Status)}
          disabled={busy}
          className="h-9 rounded-md border border-[#ccd5db] bg-white px-2 text-sm"
        >
          {STATUSES.map((status) => <option key={status} value={status}>{c.labels[status]}</option>)}
        </select>
        <button
          type="button"
          onClick={apply}
          disabled={busy || next === application.status}
          className="h-9 rounded-md bg-[#0a2d46] px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? c.updating : c.update}
        </button>
      </div>
      {failed && <p role="alert" className="mt-1 text-xs font-semibold text-[#9a3d35]">{c.failed}</p>}
    </div>
  );
}
