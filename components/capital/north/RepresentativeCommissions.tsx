"use client";

import { CircleDollarSign } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import type { OfferingBundle } from "@/lib/capital/types";
import { PageHeader, Panel, money } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";

const COPY = {
  tr: {
    eyebrow: "Bireysel partner",
    title: "Ödemeler",
    description:
      "Hunter & Hunter Investment Advisors tarafından hesabınıza tanımlanan onaylı ve tamamlanmış ödemeler gösterilir.",
    reference: "Referans",
    offering: "Yatırım ürünü",
    payment: "Ödeme",
    partnerPayment: "Partner ödemesi",
    status: "Durum",
    statuses: { draft: "Taslak", approved: "Onaylandı", paid: "Ödendi", void: "İptal edildi" },
    none: "Henüz görüntülenebilir bireysel ödeme kaydı yok.",
  },
  en: {
    eyebrow: "Individual partner",
    title: "Payments",
    description:
      "Approved and completed payments assigned to your account by Hunter & Hunter Investment Advisors are shown here.",
    reference: "Reference",
    offering: "Offering",
    payment: "Payment",
    partnerPayment: "Partner payment",
    status: "Status",
    statuses: { draft: "Draft", approved: "Approved", paid: "Paid", void: "Void" },
    none: "There are no visible individual payment entries yet.",
  },
} as const;

export function RepresentativeCommissions({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang } = useLang();
  const { currentUser, commissions } = usePortalAccess();
  const c = pick(COPY, lang);
  const entries = commissions.filter(
    (entry) =>
      entry.beneficiaryType === "representative" &&
      entry.beneficiaryUserId === currentUser.id &&
      (entry.status === "approved" || entry.status === "paid"),
  );

  return (
    <div>
      <PageHeader title={c.title} description={c.description} />
      <Panel className="overflow-hidden">
        {entries.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
                <tr>{[c.reference, c.offering, c.payment, c.partnerPayment, c.status].map((item) => <th key={item} className="border-b border-[#e2e6e9] px-5 py-3">{item}</th>)}</tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#edf0f2] last:border-0">
                    <td className="px-5 py-4 font-mono text-xs text-[#486474]">{entry.redactedReferralReference}</td>
                    <td className="px-5 py-4 font-semibold text-[#293d49]">{tx(offerings.find((item) => item.id === entry.offeringId)?.shortName, lang) || entry.offeringId}</td>
                    <td className="px-5 py-4 text-[#63717c]">{money(entry.grossDistributionCommissionAmount, lang, entry.currency)}</td>
                    <td className="px-5 py-4 font-semibold text-[#193143]">{money(entry.amount, lang, entry.currency)}</td>
                    <td className="px-5 py-4"><span className="rounded bg-[#e8f2ec] px-2 py-1 text-[10px] font-bold text-[#2d6849]">{c.statuses[entry.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <CircleDollarSign className="mx-auto size-7 text-[#82909a]" />
            <p className="mt-3 text-sm text-[#65717e]">{c.none}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
