"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Building2,
  Check,
  CircleDollarSign,
  Copy,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { firmRoles } from "@/lib/capital/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { PageHeader, Panel, SectionHeader, money, shortDate } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";

type FirmSection = "overview" | "members" | "products" | "commissions";

const COPY = {
  tr: {
    eyebrow: "Firma çalışma alanı",
    overview: "Firma özeti",
    members: "Üyelik yönetimi",
    products: "Onaylı ürün rafı",
    commissions: "Firma fon dağıtım komisyonları",
    privacy:
      "Bu çalışma alanı paylaşılan bir müşteri defteri değildir. Firma rolleri hiçbir temsilcinin müşterilerine, kişisel yatırımlarına, belgelerine, kademesine veya bireysel fon dağıtım komisyonuna erişim sağlamaz.",
    status: "Firma durumu",
    roster: "Temsilci kaydı",
    pending: "Bekleyen başvurular",
    shelf: "Ürün rafı",
    roles: "İzinleriniz",
    legal: "Yasal firma",
    authorized: "Yetkili kişi",
    compliance: "Uyum iletişimi",
    invite: "Temsilci davet et",
    copyInvite: "Başvuru bağlantısını kopyala",
    copied: "Bağlantı kopyalandı",
    name: "Kayıtlı ad",
    workEmail: "İş e-postası",
    licence: "Lisans özeti",
    verification: "HNC doğrulaması",
    membership: "Üyelik",
    requested: "Talep tarihi",
    action: "İşlem",
    approve: "Bağlantıyı onayla",
    reject: "Reddet",
    suspend: "Askıya al",
    empty: "Gösterilecek üyelik bulunmuyor.",
    offering: "Fon",
    shelfStatus: "Raf durumu",
    effective: "Başlangıç",
    documents: "Firma belgeleri",
    noProducts: "Firma için ürün ataması bulunmuyor.",
    beneficiary: "Lehtar",
    reference: "Redakte referans",
    period: "Kazanç dönemi",
    gross: "Brüt komisyon",
    allocation: "Komisyon payı",
    amount: "Firma komisyonu",
    payment: "Ödeme",
    noCommissions: "Görülebilir firma-lehtar fon dağıtım komisyonu bulunmuyor.",
    financeRequired: "Bu ekran için ayrı finance_admin izni gerekir.",
  },
  en: {
    eyebrow: "Firm workspace",
    overview: "Firm overview",
    members: "Membership administration",
    products: "Approved product shelf",
    commissions: "Firm fund distribution commissions",
    privacy:
      "This workspace is not a shared client book. Firm roles never grant access to a representative’s clients, personal investments, documents, tier, or individual fund distribution commissions.",
    status: "Firm status",
    roster: "Representative roster",
    pending: "Pending requests",
    shelf: "Product shelf",
    roles: "Your permissions",
    legal: "Legal firm",
    authorized: "Authorized contact",
    compliance: "Compliance contact",
    invite: "Invite a representative",
    copyInvite: "Copy application link",
    copied: "Link copied",
    name: "Registered name",
    workEmail: "Work email",
    licence: "Licence summary",
    verification: "HNC verification",
    membership: "Membership",
    requested: "Requested",
    action: "Action",
    approve: "Approve association",
    reject: "Reject",
    suspend: "Suspend",
    empty: "There are no memberships to display.",
    offering: "Offering",
    shelfStatus: "Shelf status",
    effective: "Effective",
    documents: "Firm documents",
    noProducts: "No products are assigned to the firm.",
    beneficiary: "Beneficiary",
    reference: "Redacted reference",
    period: "Earning period",
    gross: "Gross commission",
    allocation: "Commission allocation",
    amount: "Firm commission",
    payment: "Payment",
    noCommissions: "There are no visible firm-beneficiary fund distribution commissions.",
    financeRequired: "This screen requires the separate finance_admin permission.",
  },
} as const;

function statusBadge(status: string) {
  if (status === "active" || status === "verified" || status === "on_shelf" || status === "paid") {
    return "bg-[#e8f2ec] text-[#2d6849]";
  }
  if (status.includes("pending") || status === "approved") return "bg-[#f7efd9] text-[#7b5c19]";
  return "bg-[#edf0f2] text-[#596873]";
}

export function FirmWorkspace({
  section,
  offerings = [],
}: {
  section: FirmSection;
  offerings?: OfferingBundle[];
}) {
  const { lang } = useLang();
  const {
    currentOrganization,
    currentMembership,
    context,
    dataset,
    memberDirectory,
    commissions,
    decideMembership,
  } = usePortalAccess();
  const c = COPY[lang];
  const [copied, setCopied] = useState(false);
  const roles = firmRoles(context);
  const firmCommissions = commissions.filter(
    (entry) =>
      entry.beneficiaryType === "organization" &&
      entry.beneficiaryOrganizationId === currentOrganization?.id,
  );
  const productAccess = useMemo(
    () =>
      dataset.offeringAccess.filter(
        (item) => item.organizationId === currentOrganization?.id,
      ),
    [currentOrganization?.id, dataset.offeringAccess],
  );

  const title = c[section];

  if (!currentOrganization || !currentMembership) {
    return <Panel className="p-10 text-center text-sm text-[#65717e]">{c.privacy}</Panel>;
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}/hunter-north-capital/sign-up`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={title} description={c.privacy} />
      <div className="mb-6 flex gap-3 rounded-md border border-[#d8dfc2] bg-[#f3f6ea] p-4 text-sm leading-6 text-[#53623a]">
        <LockKeyhole className="mt-0.5 size-5 shrink-0" />
        <p>{c.privacy}</p>
      </div>

      {section === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: c.status, value: currentOrganization.status, Icon: ShieldCheck },
              { label: c.roster, value: memberDirectory.filter((item) => item.status === "active").length, Icon: UsersRound },
              { label: c.pending, value: memberDirectory.filter((item) => item.status === "pending").length, Icon: BadgeCheck },
              { label: c.shelf, value: productAccess.filter((item) => item.status === "on_shelf").length, Icon: PackageCheck },
            ].map(({ label, value, Icon }) => (
              <Panel key={label} className="p-5">
                <Icon className="size-5 text-[#0a4b72]" />
                <p className="mt-4 text-xs font-semibold text-[#71808b]">{label}</p>
                <p className="mt-2 text-xl font-semibold text-[#193143]">{String(value)}</p>
              </Panel>
            ))}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel className="p-6">
              <Building2 className="size-6 text-[#0a4b72]" />
              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="text-xs font-semibold text-[#75818b]">{c.legal}</dt><dd className="mt-1 font-semibold text-[#243845]">{currentOrganization.legalName}</dd></div>
                <div><dt className="text-xs font-semibold text-[#75818b]">{c.authorized}</dt><dd className="mt-1 text-[#243845]">{currentOrganization.authorizedContact ?? "—"}</dd></div>
                <div><dt className="text-xs font-semibold text-[#75818b]">{c.compliance}</dt><dd className="mt-1 text-[#243845]">{currentOrganization.complianceContact ?? "—"}</dd></div>
              </dl>
            </Panel>
            <Panel className="p-6">
              <ShieldCheck className="size-6 text-[#0a4b72]" />
              <h2 className="mt-5 font-semibold text-[#243845]">{c.roles}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {roles.map((role) => <span key={role} className="rounded bg-[#edf2f5] px-2.5 py-1 text-xs font-semibold text-[#486474]">{role}</span>)}
              </div>
            </Panel>
          </div>
        </>
      )}

      {section === "members" && (
        <>
          <Panel className="mb-5 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-[#243845]">{c.invite}</p>
              <p className="mt-1 text-xs text-[#75818b]">{currentOrganization.legalName}</p>
            </div>
            <button type="button" onClick={copyInvite} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cfd8de] bg-white px-4 text-sm font-semibold text-[#0a4b72]">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? c.copied : c.copyInvite}
            </button>
          </Panel>
          <Panel className="overflow-hidden">
            {memberDirectory.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
                    <tr>{[c.name, c.workEmail, c.licence, c.verification, c.membership, c.requested, c.action].map((item) => <th key={item} className="border-b border-[#e2e6e9] px-4 py-3">{item}</th>)}</tr>
                  </thead>
                  <tbody>
                    {memberDirectory.map((member) => (
                      <tr key={member.id} className="border-b border-[#edf0f2] last:border-0 align-top">
                        <td className="px-4 py-4 font-semibold text-[#293d49]">{member.registeredName}</td>
                        <td className="px-4 py-4 text-[#63717c]">{member.workEmail}</td>
                        <td className="px-4 py-4 text-[#63717c]"><p>{member.licenceType ?? "—"}</p><p className="mt-1 font-mono text-xs">{member.maskedLicenceNumber ?? "—"}</p></td>
                        <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${statusBadge(member.verificationStatus)}`}>{member.verificationStatus}</span></td>
                        <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${statusBadge(member.status)}`}>{member.status}</span></td>
                        <td className="px-4 py-4 text-[#63717c]">{shortDate(member.requestedAt.slice(0, 10), lang)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {member.status === "pending" && (
                              <>
                                <button type="button" onClick={() => decideMembership(member.id, "approve")} className="inline-flex h-8 items-center gap-1 rounded bg-[#e8f2ec] px-2.5 text-xs font-semibold text-[#2d6849]"><Check className="size-3.5" />{c.approve}</button>
                                <button type="button" onClick={() => decideMembership(member.id, "reject")} className="inline-flex h-8 items-center gap-1 rounded bg-[#faeeec] px-2.5 text-xs font-semibold text-[#98463c]"><X className="size-3.5" />{c.reject}</button>
                              </>
                            )}
                            {member.status === "active" && member.id !== currentMembership.id && (
                              <button type="button" onClick={() => decideMembership(member.id, "suspend")} className="inline-flex h-8 items-center gap-1 rounded bg-[#f7efd9] px-2.5 text-xs font-semibold text-[#7b5c19]"><Ban className="size-3.5" />{c.suspend}</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="p-10 text-center text-sm text-[#65717e]">{c.empty}</div>}
          </Panel>
        </>
      )}

      {section === "products" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {productAccess.map((access) => {
            const offering = offerings.find((item) => item.id === access.offeringId);
            return (
              <Panel key={access.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#74808a]">{c.offering}</p>
                    <h2 className="mt-2 text-lg font-semibold text-[#193143]">{offering?.shortName[lang] ?? access.offeringId}</h2>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold ${statusBadge(access.status)}`}>{access.status}</span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#e5e9ec] pt-4 text-sm">
                  <div><dt className="text-xs font-semibold text-[#75818b]">{c.effective}</dt><dd className="mt-1 text-[#243845]">{access.effectiveAt ? shortDate(access.effectiveAt, lang) : "—"}</dd></div>
                  <div><dt className="text-xs font-semibold text-[#75818b]">{c.documents}</dt><dd className="mt-1 text-[#243845]">{offering?.documents.length ?? 0}</dd></div>
                </dl>
              </Panel>
            );
          })}
          {!productAccess.length && <Panel className="p-10 text-center text-sm text-[#65717e] lg:col-span-2">{c.noProducts}</Panel>}
        </div>
      )}

      {section === "commissions" && (
        <>
          {!roles.includes("finance_admin") ? (
            <Panel className="p-10 text-center text-sm text-[#65717e]">{c.financeRequired}</Panel>
          ) : (
            <>
              <SectionHeader title={c.commissions} meta={currentOrganization.legalName} />
              <Panel className="overflow-hidden">
                {firmCommissions.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1080px] text-left text-sm">
                      <thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
                        <tr>{[c.reference, c.offering, c.period, c.gross, c.allocation, c.amount, c.status, c.payment].map((item) => <th key={item} className="border-b border-[#e2e6e9] px-5 py-3">{item}</th>)}</tr>
                      </thead>
                      <tbody>
                        {firmCommissions.map((entry) => (
                          <tr key={entry.id} className="border-b border-[#edf0f2] last:border-0">
                            <td className="px-5 py-4 font-mono text-xs text-[#486474]">{entry.redactedReferralReference}</td>
                            <td className="px-5 py-4 font-semibold text-[#293d49]">{offerings.find((item) => item.id === entry.offeringId)?.shortName[lang] ?? entry.offeringId}</td>
                            <td className="px-5 py-4 text-[#63717c]">{entry.earningPeriod}</td>
                            <td className="px-5 py-4 text-[#63717c]">{money(entry.grossDistributionCommissionAmount, lang, entry.currency)}</td>
                            <td className="px-5 py-4 text-[#63717c]">{entry.partnerTier === "managingPartner" ? "Managing Partner" : entry.partnerTier[0].toUpperCase() + entry.partnerTier.slice(1)} · {entry.allocationPercentage}%</td>
                            <td className="px-5 py-4 font-semibold text-[#193143]">{money(entry.amount, lang, entry.currency)}</td>
                            <td className="px-5 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${statusBadge(entry.status)}`}>{entry.status}</span></td>
                            <td className="px-5 py-4 text-xs text-[#63717c]">{entry.paymentReference ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="p-10 text-center text-sm text-[#65717e]">{c.noCommissions}</div>}
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}
