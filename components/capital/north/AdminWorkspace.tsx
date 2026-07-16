"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Building2,
  Check,
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  FileUp,
  HandCoins,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import type {
  CommissionStatus,
  FirmMembershipRole,
  LicenseVerificationStatus,
  OrganizationStatus,
} from "@/lib/capital/portal-access";
import { SPL_PUBLIC_SEARCH_URL } from "@/lib/capital/portal-access";
import {
  calculateFundDistributionCommission,
  commissionAllocationForTier,
} from "@/lib/capital/commissions";
import type { OfferingBundle, PartnerTier } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { uploadPartnerCredential } from "@/lib/supabase/storage";
import { PageHeader, Panel, SectionHeader, shortDate } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";

type AdminSection =
  | "partner-applications"
  | "license-verifications"
  | "firms"
  | "firm-memberships"
  | "commissions"
  | "audit";

const COPY = {
  tr: {
    eyebrow: "Hunter North yönetimi",
    titles: {
      "partner-applications": "Partner başvuruları",
      "license-verifications": "SPL lisans doğrulamaları",
      firms: "Firma incelemeleri",
      "firm-memberships": "Firma üyelikleri",
      commissions: "Fon dağıtım komisyonu yönetimi",
      audit: "Değiştirilemez denetim kaydı",
    },
    descriptions: {
      "partner-applications": "Başvuruları ve iki bağımsız aktivasyon kapısını inceleyin.",
      "license-verifications": "Resmi SPL aramasını insan doğrulamasıyla tamamlayın ve sonucu eklemeli kayıt olarak saklayın.",
      firms: "Firma yasal bilgilerini ve yetkili temaslarını doğrulayın.",
      "firm-memberships": "Firma bağlantısı fallback onaylarını ve ayrı firma rollerini yönetin.",
      commissions: "Kademeye bağlı yüzde payıyla hesaplanan fon dağıtım komisyonlarını oluşturun ve yönetin.",
      audit: "Lisans, üyelik, firma ve fon dağıtım komisyonu kararlarının kronolojik geçmişi.",
    },
    protected: "Bu ekran Hunter North yönetici erişimi ve MFA ile korunmalıdır.",
    commission: {
      newTitle: "Yeni fon dağıtım komisyonu",
      newDescription:
        "Brüt fon dağıtım komisyonunu girin; partner payı kademe oranına göre otomatik hesaplanır.",
      beneficiaryType: "Lehtar türü",
      representative: "Temsilci",
      organization: "Firma",
      beneficiary: "Lehtar",
      introducingRepresentative: "Tanıştıran temsilci",
      reference: "Redakte referans",
      referralId: "Dahili yönlendirme numarası",
      offering: "Fon",
      gross: "Alınan brüt fon dağıtım komisyonu",
      currency: "Para birimi",
      period: "Kazanç dönemi",
      fundedAt: "Yatırımın fonlandığı tarih",
      receivedAt: "Komisyonun alındığı tarih",
      tier: "Fonlama tarihindeki kademe",
      allocation: "Komisyon payı",
      payout: "Hesaplanan partner komisyonu",
      description: "Açıklama",
      initialStatus: "İlk durum",
      create: "Komisyon kaydı oluştur",
      created: "Fon dağıtım komisyonu oluşturuldu.",
      ledger: "Fon dağıtım komisyonu defteri",
      ledgerMeta: "Taslak kayıtlar yalnızca Hunter North tarafından görülebilir.",
      noPartners: "Aktif partner hesabı bulunmuyor.",
      approve: "Onayla",
      paymentReference: "Ödeme referansı",
      markPaid: "Ödendi olarak işaretle",
      void: "İptal et",
    },
  },
  en: {
    eyebrow: "Hunter North administration",
    titles: {
      "partner-applications": "Partner applications",
      "license-verifications": "SPL licence verifications",
      firms: "Firm reviews",
      "firm-memberships": "Firm memberships",
      commissions: "Fund distribution commission administration",
      audit: "Immutable audit trail",
    },
    descriptions: {
      "partner-applications": "Review applications and the two independent activation gates.",
      "license-verifications": "Complete the official SPL search with human verification and store an append-only result.",
      firms: "Verify firm legal information and authorized contacts.",
      "firm-memberships": "Manage documented Hunter North fallback approvals and separate firm roles.",
      commissions: "Create and manage fund distribution commissions calculated from the partner-tier allocation.",
      audit: "Chronological history of licence, membership, firm, and fund distribution commission decisions.",
    },
    protected: "This screen must be protected by Hunter North administrator access and MFA.",
    commission: {
      newTitle: "New fund distribution commission",
      newDescription:
        "Enter the gross fund distribution commission received; the partner share is calculated automatically from the tier rate.",
      beneficiaryType: "Beneficiary type",
      representative: "Representative",
      organization: "Organization",
      beneficiary: "Beneficiary",
      introducingRepresentative: "Introducing representative",
      reference: "Redacted referral reference",
      referralId: "Internal referral ID",
      offering: "Offering",
      gross: "Gross fund distribution commission received",
      currency: "Currency",
      period: "Earning period",
      fundedAt: "Investment funding date",
      receivedAt: "Commission received date",
      tier: "Tier at funding",
      allocation: "Commission allocation",
      payout: "Calculated partner commission",
      description: "Description",
      initialStatus: "Initial status",
      create: "Create commission entry",
      created: "Fund distribution commission created.",
      ledger: "Fund distribution commission ledger",
      ledgerMeta: "Draft entries remain visible only to Hunter North.",
      noPartners: "There are no active partner accounts.",
      approve: "Approve",
      paymentReference: "Payment reference",
      markPaid: "Mark paid",
      void: "Void",
    },
  },
} as const;

const PARTNER_TIER_LABELS: Record<PartnerTier, string> = {
  associate: "Associate",
  principal: "Principal",
  managingPartner: "Managing Partner",
};

function badge(status: string) {
  if (["active", "verified", "approved", "paid", "on_shelf"].includes(status)) {
    return "bg-[#e8f2ec] text-[#2d6849]";
  }
  if (status.includes("pending") || status === "submitted" || status === "under_review" || status === "draft") {
    return "bg-[#f7efd9] text-[#7b5c19]";
  }
  if (["rejected", "revoked", "expired", "suspended", "void", "mismatch", "not_found"].includes(status)) {
    return "bg-[#faeeec] text-[#98463c]";
  }
  return "bg-[#edf0f2] text-[#596873]";
}

function currency(value: number, currencyCode: string, lang: "tr" | "en") {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

export function AdminWorkspace({
  section,
  offerings = [],
}: {
  section: AdminSection;
  offerings?: OfferingBundle[];
}) {
  const { lang } = useLang();
  const {
    dataset,
    currentUser,
    backendConfigured,
    decideMembership,
    decideOrganization,
    assignMembershipRoles,
    recordLicenseVerification,
    createCommission,
    markCommissionPaid,
    updateCommissionStatus,
  } = usePortalAccess();
  const c = COPY[lang];
  const [selectedApplicationId, setSelectedApplicationId] = useState(
    dataset.partnerApplications[0]?.id ?? "",
  );
  const [beneficiaryType, setBeneficiaryType] = useState<"representative" | "organization">("representative");
  const [selectedCommissionRepresentativeId, setSelectedCommissionRepresentativeId] = useState(
    dataset.partnerAccounts.find((account) => account.status === "active")?.userId ?? "",
  );
  const [grossCommissionInput, setGrossCommissionInput] = useState("");
  const [commissionCurrency, setCommissionCurrency] = useState("CAD");
  const [paymentReferences, setPaymentReferences] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const applications = useMemo(
    () =>
      [...dataset.partnerApplications].sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      ),
    [dataset.partnerApplications],
  );
  const selectedApplication =
    applications.find((item) => item.id === selectedApplicationId) ?? applications[0];
  const activePartnerAccounts = dataset.partnerAccounts.filter(
    (account) => account.status === "active",
  );
  const selectedCommissionAccount = activePartnerAccounts.find(
    (account) => account.userId === selectedCommissionRepresentativeId,
  );
  const selectedCommissionUser = dataset.users.find(
    (user) => user.id === selectedCommissionRepresentativeId,
  );
  const selectedCommissionOrganization = dataset.organizations.find(
    (organization) => organization.id === selectedCommissionAccount?.organizationId,
  );
  const grossCommissionAmount = Number(grossCommissionInput);
  const commissionPreview =
    selectedCommissionAccount &&
    Number.isFinite(grossCommissionAmount) &&
    grossCommissionAmount > 0
      ? calculateFundDistributionCommission(
          grossCommissionAmount,
          selectedCommissionAccount.tier,
        )
      : undefined;

  function organizationName(id: string) {
    return dataset.organizations.find((item) => item.id === id)?.legalName ?? id;
  }

  function userName(id?: string) {
    return dataset.users.find((item) => item.id === id)?.displayName ?? id ?? "—";
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage(lang === "tr" ? "Kopyalandı." : "Copied.");
  }

  async function submitVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedApplication) return;
    const formElement = event.currentTarget;
    setError("");
    const form = new FormData(formElement);
    const evidence = form.get("evidence");
    try {
      const evidencePath =
        evidence instanceof File && evidence.name
          ? backendConfigured
            ? await uploadPartnerCredential(currentUser.id, evidence)
            : evidence.name
          : undefined;
      await recordLicenseVerification(selectedApplication.id, {
        result: String(form.get("result")) as LicenseVerificationStatus,
        returnedLicenceTypes: String(form.get("returnedLicenceTypes") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        returnedStatus: String(form.get("returnedStatus") ?? "").trim(),
        renewalInformation: String(form.get("renewalInformation") ?? "").trim(),
        employmentInformation: String(form.get("employmentInformation") ?? "").trim(),
        reviewerNotes: String(form.get("reviewerNotes") ?? "").trim(),
        evidenceFilename: evidencePath,
      });
      setMessage(lang === "tr" ? "Doğrulama olayı kaydedildi." : "Verification event recorded.");
      formElement.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification could not be recorded.");
    }
  }

  async function submitFallback(event: React.FormEvent<HTMLFormElement>, membershipId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    const evidence = form.get("evidence");
    const filename = evidence instanceof File ? evidence.name : "";
    if (!reason || !filename) {
      setError(lang === "tr" ? "Fallback için gerekçe ve kanıt zorunludur." : "Fallback approval requires a reason and evidence.");
      return;
    }
    try {
      const evidencePath =
        evidence instanceof File && evidence.name
          ? backendConfigured
            ? await uploadPartnerCredential(currentUser.id, evidence)
            : evidence.name
          : undefined;
      await decideMembership(membershipId, "approve", reason, evidencePath);
      setMessage(lang === "tr" ? "HNC fallback onayı kaydedildi." : "HNC fallback approval recorded.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Fallback approval could not be recorded.");
    }
  }

  async function submitFirmDecision(event: React.FormEvent<HTMLFormElement>, organizationId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = String(form.get("status")) as OrganizationStatus;
    const reason = String(form.get("reason") ?? "").trim();
    try {
      await decideOrganization(organizationId, status, reason);
      setMessage(lang === "tr" ? "Firma kararı kaydedildi." : "Firm decision recorded.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Firm decision could not be recorded.");
    }
  }

  async function toggleRole(
    membershipId: string,
    currentRoles: FirmMembershipRole[],
    role: "membership_admin" | "finance_admin",
  ) {
    const next = currentRoles.includes(role)
      ? currentRoles.filter((item) => item !== role)
      : [...currentRoles, role];
    try {
      await assignMembershipRoles(
        membershipId,
        next,
        `Hunter North ${currentRoles.includes(role) ? "removed" : "assigned"} ${role}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Role assignment could not be saved.");
    }
  }

  async function submitCommission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    const form = new FormData(formElement);
    const beneficiaryId = String(form.get("beneficiaryId") ?? "");
    const status = String(form.get("status")) as CommissionStatus;
    try {
      await createCommission({
        beneficiaryType,
        beneficiaryUserId: beneficiaryType === "representative" ? beneficiaryId : undefined,
        beneficiaryOrganizationId: beneficiaryType === "organization" ? beneficiaryId : undefined,
        introducingRepresentativeId: selectedCommissionRepresentativeId,
        referralId: String(form.get("referralId") ?? "") || undefined,
        redactedReferralReference: String(form.get("redactedReferralReference") ?? "").trim(),
        offeringId: String(form.get("offeringId") ?? ""),
        grossDistributionCommissionAmount: grossCommissionAmount,
        currency: String(form.get("currency") ?? "CAD"),
        earningPeriod: String(form.get("earningPeriod") ?? "").trim(),
        fundedAt: String(form.get("fundedAt") ?? ""),
        distributionCommissionReceivedAt: String(
          form.get("distributionCommissionReceivedAt") ?? "",
        ),
        description: String(form.get("description") ?? "").trim(),
        status,
      });
      setMessage(c.commission.created);
      formElement.reset();
      setGrossCommissionInput("");
      setCommissionCurrency("CAD");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Commission could not be created.");
    }
  }

  const header = (
    <>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.titles[section]}
        description={c.descriptions[section]}
      />
      <div className="mb-6 flex gap-3 rounded-md border border-[#e6d9b9] bg-[#fbf6e9] p-4 text-sm leading-6 text-[#735c20]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <p>{c.protected}</p>
      </div>
      {message && <p role="status" className="mb-4 rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
    </>
  );

  return (
    <div>
      {header}

      {section === "partner-applications" && (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]">
                <tr>{["Applicant", "Firm", "Licence", "Firm gate", "SPL gate", "Application", "Updated"].map((item) => <th key={item} className="border-b border-[#e2e6e9] px-4 py-3">{item}</th>)}</tr>
              </thead>
              <tbody>
                {applications.map((application) => {
                  const affiliation = dataset.affiliations.find(
                    (item) =>
                      item.userId === application.userId &&
                      item.organizationId === application.organizationId &&
                      item.primary,
                  );
                  const verification = [...dataset.licenseVerifications]
                    .filter((item) => item.applicationId === application.id)
                    .sort((a, b) => Date.parse(b.verifiedAt) - Date.parse(a.verifiedAt))[0];
                  return (
                    <tr key={application.id} className="border-b border-[#edf0f2] last:border-0">
                      <td className="px-4 py-4"><p className="font-semibold text-[#293d49]">{userName(application.userId)}</p><p className="mt-1 text-xs text-[#75818b]">{application.firmWorkEmail}</p></td>
                      <td className="px-4 py-4 text-[#63717c]">{organizationName(application.organizationId)}</td>
                      <td className="px-4 py-4 text-[#63717c]">{application.licenceType}</td>
                      <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(affiliation?.status ?? "pending")}`}>{affiliation?.status ?? "pending"}</span></td>
                      <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(verification?.result ?? "pending")}`}>{verification?.result ?? "pending"}</span></td>
                      <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(application.status)}`}>{application.status}</span></td>
                      <td className="px-4 py-4 text-[#63717c]">{shortDate(application.updatedAt.slice(0, 10), lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {section === "license-verifications" && (
        <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
          <Panel className="p-5">
            <label className="text-sm font-semibold text-[#243845]">
              {lang === "tr" ? "İncelenecek başvuru" : "Application to review"}
              <select value={selectedApplication?.id ?? ""} onChange={(event) => setSelectedApplicationId(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
                {applications.map((item) => <option key={item.id} value={item.id}>{userName(item.userId)} · {organizationName(item.organizationId)}</option>)}
              </select>
            </label>
            {selectedApplication && (
              <dl className="mt-6 space-y-4 text-sm">
                <div><dt className="text-xs font-semibold text-[#75818b]">Registered name</dt><dd className="mt-1 font-semibold text-[#243845]">{selectedApplication.registeredFirstNames} {selectedApplication.registryLastName}</dd></div>
                <div>
                  <dt className="text-xs font-semibold text-[#75818b]">Licence-document number</dt>
                  <dd className="mt-1 flex items-center justify-between gap-3 font-mono text-[#243845]" data-ph-mask>
                    {selectedApplication.licenceDocumentNumber}
                    <button type="button" onClick={() => copy(selectedApplication.licenceDocumentNumber)} aria-label="Copy licence number" className="grid size-8 place-items-center rounded border border-[#d6dde2]"><Clipboard className="size-3.5" /></button>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#75818b]">Sicil Soyad</dt>
                  <dd className="mt-1 flex items-center justify-between gap-3 font-semibold text-[#243845]" data-ph-mask>
                    {selectedApplication.registryLastName}
                    <button type="button" onClick={() => copy(selectedApplication.registryLastName)} aria-label="Copy registry surname" className="grid size-8 place-items-center rounded border border-[#d6dde2]"><Clipboard className="size-3.5" /></button>
                  </dd>
                </div>
                <div><dt className="text-xs font-semibold text-[#75818b]">Claimed licence type</dt><dd className="mt-1 text-[#243845]">{selectedApplication.licenceType}</dd></div>
                <div><dt className="text-xs font-semibold text-[#75818b]">Claimed firm</dt><dd className="mt-1 text-[#243845]">{organizationName(selectedApplication.organizationId)}</dd></div>
              </dl>
            )}
            <a href={SPL_PUBLIC_SEARCH_URL} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">
              Open official SPL search<ExternalLink className="size-4" />
            </a>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="size-5 text-[#0a4b72]" />
              <h2 className="font-semibold text-[#193143]">Verification result</h2>
            </div>
            <form onSubmit={submitVerification} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Result
                <select name="result" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
                  {(["verified", "mismatch", "not_found", "suspended", "expired", "revoked", "manual_review"] as LicenseVerificationStatus[]).map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Official status returned
                <input name="returnedStatus" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Licence type(s) returned, comma separated
                <input name="returnedLicenceTypes" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">Renewal / suspension information
                <input name="renewalInformation" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">Employment information returned
                <input name="employmentInformation" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Reviewer notes
                <textarea name="reviewerNotes" required rows={4} className="mt-2 w-full rounded-md border border-[#d6dde2] p-3 font-normal" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Private screenshot or PDF evidence
                <span className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-dashed border-[#c6d0d7] px-3 font-normal text-[#65717e]"><FileUp className="size-4" /><input name="evidence" type="file" accept=".pdf,.png,.jpg,.jpeg" className="w-full text-xs" /></span>
              </label>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white sm:col-span-2 sm:justify-self-start">
                <Check className="size-4" />Record append-only verification event
              </button>
            </form>
          </Panel>
        </div>
      )}

      {section === "firms" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {dataset.organizations.map((organization) => (
            <Panel key={organization.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#75818b]">{organization.firmType}</p>
                  <h2 className="mt-2 text-lg font-semibold text-[#193143]">{organization.legalName}</h2>
                  <p className="mt-1 text-xs text-[#75818b]">{organization.businessDomain ?? "—"}</p>
                </div>
                <span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(organization.status)}`}>{organization.status}</span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs font-semibold text-[#75818b]">SPK</dt><dd className="mt-1 text-[#243845]">{organization.spkRegistration ?? "—"}</dd></div>
                <div><dt className="text-xs font-semibold text-[#75818b]">Authorized contact</dt><dd className="mt-1 text-[#243845]">{organization.authorizedContact ?? "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs font-semibold text-[#75818b]">Address</dt><dd className="mt-1 text-[#243845]">{organization.registeredAddress ?? "—"}</dd></div>
              </dl>
              <form onSubmit={(event) => submitFirmDecision(event, organization.id)} className="mt-5 grid gap-3 border-t border-[#e5e9ec] pt-4 sm:grid-cols-[150px_1fr_auto]">
                <select name="status" defaultValue={organization.status} className="h-10 rounded-md border border-[#d6dde2] bg-white px-2 text-sm">
                  {(["pending", "active", "suspended", "terminated"] as OrganizationStatus[]).map((item) => <option key={item}>{item}</option>)}
                </select>
                <input name="reason" required placeholder="Review reason and evidence reference" className="h-10 rounded-md border border-[#d6dde2] px-3 text-sm" />
                <button className="h-10 rounded-md bg-[#0a2d46] px-3 text-sm font-semibold text-white">Save</button>
              </form>
            </Panel>
          ))}
        </div>
      )}

      {section === "firm-memberships" && (
        <div className="space-y-5">
          {dataset.memberships.map((membership) => (
            <Panel key={membership.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[0.7fr_0.8fr_1.5fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <UsersRound className="size-5 text-[#0a4b72]" />
                    <div><p className="font-semibold text-[#243845]">{membership.registeredName}</p><p className="mt-1 text-xs text-[#75818b]">{organizationName(membership.organizationId)}</p></div>
                  </div>
                  <p className="mt-4 text-xs text-[#63717c]">{membership.workEmail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(membership.status)}`}>{membership.status}</span>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(membership.verificationStatus)}`}>{membership.verificationStatus}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#75818b]">Separate firm permissions</p>
                  <div className="mt-3 space-y-2">
                    {(["membership_admin", "finance_admin"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(membership.id, membership.roles, role)}
                        className={`flex h-9 w-full items-center justify-between rounded border px-3 text-xs font-semibold ${membership.roles.includes(role) ? "border-[#bdd9c8] bg-[#edf7f1] text-[#326449]" : "border-[#d6dde2] text-[#596873]"}`}
                      >
                        {role}{membership.roles.includes(role) ? <Check className="size-3.5" /> : <UserCog className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {membership.status === "pending" ? (
                    <form onSubmit={(event) => submitFallback(event, membership.id)} className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold sm:col-span-2">Hunter North fallback reason
                        <textarea name="reason" required rows={3} className="mt-2 w-full rounded-md border border-[#d6dde2] p-3 font-normal" />
                      </label>
                      <label className="text-xs font-semibold">Supporting evidence
                        <input name="evidence" required type="file" className="mt-2 block w-full rounded-md border border-dashed border-[#c6d0d7] p-2 text-xs font-normal" />
                      </label>
                      <button className="mt-auto h-10 rounded-md bg-[#0a2d46] px-3 text-xs font-semibold text-white">Approve HNC fallback</button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {membership.status === "active" && <button type="button" onClick={() => decideMembership(membership.id, "suspend")} className="inline-flex h-9 items-center gap-2 rounded bg-[#f7efd9] px-3 text-xs font-semibold text-[#7b5c19]"><Ban className="size-3.5" />Suspend</button>}
                      <button type="button" onClick={() => decideMembership(membership.id, "reject")} className="inline-flex h-9 items-center gap-2 rounded bg-[#faeeec] px-3 text-xs font-semibold text-[#98463c]"><X className="size-3.5" />End association</button>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {section === "commissions" && (
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <div className="flex items-center gap-3"><HandCoins className="size-5 text-[#0a4b72]" /><div><h2 className="font-semibold text-[#193143]">{c.commission.newTitle}</h2><p className="mt-1 text-xs leading-5 text-[#6c7881]">{c.commission.newDescription}</p></div></div>
            {activePartnerAccounts.length ? (
            <form onSubmit={submitCommission} className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-semibold">{c.commission.introducingRepresentative}
                <select name="introducingRepresentativeId" value={selectedCommissionRepresentativeId} onChange={(event) => setSelectedCommissionRepresentativeId(event.target.value)} required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
                  {activePartnerAccounts.map((account) => <option key={account.id} value={account.userId}>{userName(account.userId)}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{c.commission.beneficiaryType}
                <select value={beneficiaryType} onChange={(event) => setBeneficiaryType(event.target.value as "representative" | "organization")} className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
                  <option value="representative">{c.commission.representative}</option>
                  <option value="organization">{c.commission.organization}</option>
                </select>
              </label>
              <label className="text-sm font-semibold">{c.commission.beneficiary}
                <select name="beneficiaryId" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
                  {beneficiaryType === "representative" && selectedCommissionUser && <option value={selectedCommissionUser.id}>{selectedCommissionUser.displayName}</option>}
                  {beneficiaryType === "organization" && selectedCommissionOrganization && <option value={selectedCommissionOrganization.id}>{selectedCommissionOrganization.legalName}</option>}
                </select>
              </label>
              <label className="text-sm font-semibold">{c.commission.reference}
                <input name="redactedReferralReference" required placeholder="HNC-REF-0000" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">{c.commission.referralId}
                <input name="referralId" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">{c.commission.offering}
                <select name="offeringId" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
                  {offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.shortName[lang]}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{c.commission.gross}
                <input name="grossDistributionCommissionAmount" value={grossCommissionInput} onChange={(event) => setGrossCommissionInput(event.target.value)} type="number" min="0.01" step="0.01" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">{c.commission.currency}
                <select name="currency" value={commissionCurrency} onChange={(event) => setCommissionCurrency(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal"><option>CAD</option><option>USD</option><option>TRY</option></select>
              </label>
              <label className="text-sm font-semibold">{c.commission.period}
                <input name="earningPeriod" required placeholder="Q3 2026" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">{c.commission.fundedAt}
                <input name="fundedAt" type="date" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">{c.commission.receivedAt}
                <input name="distributionCommissionReceivedAt" type="date" max={new Date().toISOString().slice(0, 10)} required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <div className="rounded-md border border-[#cbdde8] bg-[#edf5f9] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#557282]">{c.commission.tier}</p>
                <p className="mt-1 font-semibold text-[#193143]">{selectedCommissionAccount ? PARTNER_TIER_LABELS[selectedCommissionAccount.tier] : "—"}</p>
              </div>
              <div className="rounded-md border border-[#d8dfc2] bg-[#f3f6ea] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#647247]">{c.commission.allocation}</p>
                <p className="mt-1 font-semibold text-[#40522d]">{selectedCommissionAccount ? `${commissionAllocationForTier(selectedCommissionAccount.tier)}%` : "—"}</p>
              </div>
              <div className="rounded-md border border-[#dbcfa8] bg-[#fbf7e9] p-3 md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#756429]">{c.commission.payout}</p>
                <p className="mt-1 text-lg font-semibold text-[#594918]">{commissionPreview ? currency(commissionPreview.amount, commissionCurrency, lang) : "—"}</p>
                {commissionPreview && <p className="mt-1 text-[10px] text-[#806f3a]">{currency(commissionPreview.grossDistributionCommissionAmount, commissionCurrency, lang)} × {commissionPreview.allocationPercentage}%</p>}
              </div>
              <label className="text-sm font-semibold md:col-span-2">{c.commission.description}
                <input name="description" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold">{c.commission.initialStatus}
                <select name="status" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal"><option value="draft">draft</option><option value="approved">approved</option></select>
              </label>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white md:col-span-3 md:justify-self-start"><Check className="size-4" />{c.commission.create}</button>
            </form>
            ) : <p className="mt-5 rounded-md bg-[#f4f6f7] p-4 text-sm text-[#65717e]">{c.commission.noPartners}</p>}
          </Panel>

          <SectionHeader title={c.commission.ledger} meta={c.commission.ledgerMeta} />
          <div className="space-y-3">
            {dataset.commissions.map((entry) => (
              <Panel key={entry.id} className="p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.2fr] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-[10px] font-bold ${badge(entry.status)}`}>{entry.status}</span>
                      <span className="font-mono text-xs text-[#63717c]">{entry.redactedReferralReference}</span>
                    </div>
                    <p className="mt-2 font-semibold text-[#243845]">{entry.beneficiaryType === "representative" ? userName(entry.beneficiaryUserId) : organizationName(entry.beneficiaryOrganizationId ?? "")}</p>
                    <p className="mt-1 text-xs text-[#75818b]">{entry.earningPeriod} · {entry.offeringId}</p>
                    <p className="mt-1 text-xs text-[#75818b]">{currency(entry.grossDistributionCommissionAmount, entry.currency, lang)} × {entry.allocationPercentage}% · {PARTNER_TIER_LABELS[entry.partnerTier]}</p>
                  </div>
                  <p className="text-lg font-semibold text-[#193143]">{currency(entry.amount, entry.currency, lang)}</p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {entry.status === "draft" && <button type="button" onClick={() => updateCommissionStatus(entry.id, "approved")} className="h-9 rounded bg-[#e8f2ec] px-3 text-xs font-semibold text-[#2d6849]">{c.commission.approve}</button>}
                    {entry.status === "approved" && (
                      <>
                        <input value={paymentReferences[entry.id] ?? ""} onChange={(event) => setPaymentReferences((current) => ({ ...current, [entry.id]: event.target.value }))} placeholder={c.commission.paymentReference} className="h-9 rounded-md border border-[#d6dde2] px-3 text-xs" />
                        <button type="button" onClick={() => markCommissionPaid(entry.id, paymentReferences[entry.id] ?? "")} className="h-9 rounded bg-[#0a2d46] px-3 text-xs font-semibold text-white">{c.commission.markPaid}</button>
                      </>
                    )}
                    {entry.status !== "void" && <button type="button" onClick={() => updateCommissionStatus(entry.id, "void")} className="h-9 rounded bg-[#faeeec] px-3 text-xs font-semibold text-[#98463c]">{c.commission.void}</button>}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {section === "audit" && (
        <Panel className="overflow-hidden">
          <div className="divide-y divide-[#edf0f2]">
            {[...dataset.auditEvents].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).map((event) => (
              <div key={event.id} className="grid gap-3 p-5 sm:grid-cols-[170px_1fr_auto] sm:items-start">
                <div className="flex items-center gap-2 text-xs text-[#75818b]"><ScrollText className="size-4" />{shortDate(event.occurredAt.slice(0, 10), lang)}</div>
                <div><p className="font-semibold text-[#243845]">{event.action}</p><p className="mt-1 text-sm leading-6 text-[#63717c]">{event.summary}</p><p className="mt-2 font-mono text-[10px] text-[#8a949c]">{event.entityType} · {event.entityId}</p></div>
                <p className="text-xs text-[#75818b]">{userName(event.actorUserId)}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
