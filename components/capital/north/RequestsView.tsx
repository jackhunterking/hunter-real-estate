"use client";

import { Check, Clock3 } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { requestOutcome } from "@/lib/capital/investment-requests";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { usePortalAccess } from "./PortalAccessProvider";
import { InvestmentRequestButton } from "./InvestmentRequestButton";
import { PageHeader, Panel, money, shortDate } from "./PortalUI";

const COPY = {
  en: {
    eyebrow: "Investor journey",
    title: "Transactions",
    description: "Track each request through review to its final funded or closed outcome.",
    review: "In review",
    funded: "Funded",
    closed: "Closed",
    amount: "Indicative amount",
    request: "Request",
    status: "Status",
    date: "Date",
    legacy: "Legacy interest",
    none: "No investment requests yet.",
  },
  tr: {
    eyebrow: "Yatırımcı yolculuğu",
    title: "İşlemlerim",
    description: "Her talebi incelemeden nihai fonlandı veya kapandı sonucuna kadar takip edin.",
    review: "İncelemede",
    funded: "Fonlandı",
    closed: "Kapandı",
    amount: "Gösterge tutarı",
    request: "Talep",
    status: "Durum",
    date: "Tarih",
    legacy: "Eski ilgi kaydı",
    none: "Henüz yatırım talebi yok.",
  },
} as const;

type Copy = (typeof COPY)[keyof typeof COPY];

function RequestStatus({ outcome, copy }: { outcome: "funded" | "closed" | null; copy: Copy }) {
  const variant = outcome ?? "review";
  const Icon = variant === "review" ? Clock3 : Check;
  const label = variant === "funded" ? copy.funded : variant === "closed" ? copy.closed : copy.review;
  const colors = {
    funded: "border-[#cfe5d8] bg-[#e6f2eb] text-[#2f6f4f] [&>span]:bg-[#2f6f4f] [&>span]:text-white",
    closed: "border-[#dfe3e6] bg-[#f1f2f3] text-[#626d75] [&>span]:bg-[#77838b] [&>span]:text-white",
    review: "border-[#eadcae] bg-[#f8f1dc] text-[#755718] [&>span]:bg-[#ead79b] [&>span]:text-[#70510f]",
  }[variant];

  return (
    <span role="status" className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${colors}`}>
      <span className="grid size-5 place-items-center rounded-full">
        <Icon className="size-3" aria-hidden="true" />
      </span>
      {label}
    </span>
  );
}

export function RequestsView({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, dataset } = usePortalAccess();
  const c = pick(COPY, lang);
  const requests = dataset.investments
    .filter((request) => request.userId === currentUser.id)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  return (
    <div>
      <PageHeader title={c.title} description={c.description} action={<InvestmentRequestButton offerings={offerings} />} />

      {requests.length ? (
        <section aria-label={c.title}>
          <div className="mb-2 hidden grid-cols-[minmax(0,1.6fr)_minmax(150px,0.75fr)_minmax(150px,0.75fr)_minmax(120px,0.55fr)] gap-4 px-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#75828b] lg:grid">
            <span>{c.request}</span>
            <span>{c.amount}</span>
            <span>{c.status}</span>
            <span className="text-right">{c.date}</span>
          </div>

          <div className="grid gap-3">
            {requests.map((request) => {
              const fund = offerings.find((offering) => offering.id === request.offeringId);
              const outcome = requestOutcome(request.status);

              return (
                <article
                  key={request.id}
                  className="grid grid-cols-2 items-center gap-x-4 gap-y-5 rounded-md border border-[#dbe2e6] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(10,28,43,0.05)] transition-shadow hover:shadow-[0_3px_10px_rgba(10,28,43,0.07)] sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(150px,0.75fr)_minmax(150px,0.75fr)_minmax(120px,0.55fr)] lg:gap-4 lg:py-5"
                >
                  <div className="col-span-2 flex min-w-0 items-start justify-between gap-3 lg:col-span-1 lg:col-start-1 lg:row-start-1">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold leading-6 text-[#183144]">{tx(fund?.shortName, lang) ?? request.offeringId}</h2>
                      {request.legacySource && <span className="mt-1.5 inline-flex rounded border border-[#dfe4e7] bg-[#f2f5f6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.07em] text-[#65747e]">{c.legacy}</span>}
                    </div>
                  </div>

                  <dl className="min-w-0 lg:col-start-2 lg:row-start-1">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#82909a] lg:sr-only">{c.amount}</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums text-[#284152] lg:mt-0">{request.amount > 0 ? money(request.amount, lang) : "—"}</dd>
                  </dl>

                  <div className="justify-self-end text-right lg:col-start-4 lg:row-start-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#82909a] lg:sr-only">{c.date}</p>
                    <time dateTime={request.updatedAt} className="mt-1 block whitespace-nowrap text-xs text-[#627480] lg:mt-0">
                      {shortDate(request.updatedAt.slice(0, 10), lang)}
                    </time>
                  </div>

                  <div className="col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-1">
                    <RequestStatus outcome={outcome} copy={c} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <Panel className="p-12 text-center text-sm text-[#65737e]">{c.none}</Panel>
      )}
    </div>
  );
}
