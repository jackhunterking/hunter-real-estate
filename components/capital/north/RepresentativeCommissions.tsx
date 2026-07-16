"use client";

import { CircleDollarSign, LockKeyhole } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getOfferings } from "@/lib/capital/repository";
import { PageHeader, Panel, money, shortDate } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";

const COPY = {
  tr: {
    eyebrow: "Bireysel partner",
    title: "Fon dağıtım komisyonlarım",
    description:
      "Hunter North tarafından alınan brüt fon dağıtım komisyonundan kademenize göre ayrılan onaylı ve ödenmiş paylar gösterilir.",
    privacy:
      "Bu tutarlar firma üyelik yöneticileri ve firma finans yöneticileri tarafından görülemez.",
    reference: "Referans",
    offering: "Fon",
    period: "Dönem",
    gross: "Brüt komisyon",
    allocation: "Komisyon payı",
    amount: "Partner komisyonu",
    status: "Durum",
    payment: "Ödeme",
    none: "Henüz görülebilir bireysel komisyon kaydı yok.",
  },
  en: {
    eyebrow: "Individual partner",
    title: "My fund distribution commissions",
    description:
      "Approved and paid allocations from the gross fund distribution commission received by Hunter North are shown according to your tier.",
    privacy:
      "These amounts are not visible to firm membership administrators or firm finance administrators.",
    reference: "Reference",
    offering: "Offering",
    period: "Period",
    gross: "Gross commission",
    allocation: "Commission allocation",
    amount: "Partner commission",
    status: "Status",
    payment: "Payment",
    none: "There are no visible individual commission entries yet.",
  },
} as const;

export function RepresentativeCommissions() {
  const { lang } = useLang();
  const { currentUser, commissions } = usePortalAccess();
  const c = COPY[lang];
  const offerings = getOfferings();
  const entries = commissions.filter(
    (entry) =>
      entry.beneficiaryType === "representative" &&
      entry.beneficiaryUserId === currentUser.id &&
      (entry.status === "approved" || entry.status === "paid"),
  );

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />
      <div className="mb-6 flex gap-3 rounded-md border border-[#cbdde8] bg-[#edf5f9] p-4 text-sm leading-6 text-[#365b70]">
        <LockKeyhole className="mt-0.5 size-5 shrink-0" />
        <p>{c.privacy}</p>
      </div>
      <Panel className="overflow-hidden">
        {entries.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
                <tr>{[c.reference, c.offering, c.period, c.gross, c.allocation, c.amount, c.status, c.payment].map((item) => <th key={item} className="border-b border-[#e2e6e9] px-5 py-3">{item}</th>)}</tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#edf0f2] last:border-0">
                    <td className="px-5 py-4 font-mono text-xs text-[#486474]">{entry.redactedReferralReference}</td>
                    <td className="px-5 py-4 font-semibold text-[#293d49]">{offerings.find((item) => item.id === entry.offeringId)?.shortName[lang] ?? entry.offeringId}</td>
                    <td className="px-5 py-4 text-[#63717c]">{entry.earningPeriod}</td>
                    <td className="px-5 py-4 text-[#63717c]">{money(entry.grossDistributionCommissionAmount, lang, entry.currency)}</td>
                    <td className="px-5 py-4 text-[#63717c]">{entry.partnerTier === "managingPartner" ? "Managing Partner" : entry.partnerTier[0].toUpperCase() + entry.partnerTier.slice(1)} · {entry.allocationPercentage}%</td>
                    <td className="px-5 py-4 font-semibold text-[#193143]">{money(entry.amount, lang, entry.currency)}</td>
                    <td className="px-5 py-4"><span className="rounded bg-[#e8f2ec] px-2 py-1 text-[10px] font-bold text-[#2d6849]">{entry.status}</span></td>
                    <td className="px-5 py-4 text-xs text-[#63717c]">
                      {entry.paidAt ? `${shortDate(entry.paidAt.slice(0, 10), lang)} · ${entry.paymentReference ?? "—"}` : "—"}
                    </td>
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
