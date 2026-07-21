"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import {
  SPL_PUBLIC_SEARCH_URL,
  canUseWorkspace,
  maskLicenceNumber,
  professionalProfileState,
} from "@/lib/capital/portal-access";
import { PageHeader, Panel, shortDate } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";
import { NORTH_BASE } from "./NorthBrand";

const COPY = {
  tr: {
    title: "Profesyonel erişim",
    modalTitle: "Profesyonel partner başvurusu",
    description:
      "SPL lisansına sahip ve SPK yetkili bir firmayla ilişkili profesyoneller Hunter & Hunter Investment Advisors erişimine başvurabilir.",
    modalDescription:
      "SPL sicilinizdeki bilgileri ve mevcut firma bağlantınızı girin. Hunter & Hunter Investment Advisors bilgileri resmi kaynaklardan doğrular.",
    status: "Başvuru durumu",
    firmGate: "Firma bağlantısı",
    licenceGate: "SPL doğrulaması",
    accountGate: "Partner hesabı",
    verified: "SPL üzerinden doğrulandı",
    notLive: "Bu tarih canlı senkronizasyon anlamına gelmez.",
    registeredNames: "SPL sicilindeki ad ve orta adlar",
    registrySurname: "Sicil soyadı",
    licenceNumber: "SPL lisans belge numarası",
    licenceType: "Lisans türü",
    firm: "Firma adı",
    firmHelp: "Firmanın yasal veya en yaygın kullanılan adını yazın.",
    firmWorkEmail: "Firma iş e-postası",
    titleLabel: "Mevcut mesleki unvan",
    consentLookup: "Hunter & Hunter Investment Advisors’ın resmi SPL araması yapmasına ve sonucu kaydetmesine izin veriyorum.",
    consentAccuracy: "Verdiğim bilgilerin güncel ve doğru olduğunu beyan ederim.",
    submit: "Partner başvurusunu gönder",
    submitting: "Başvuru gönderiliyor",
    submitted: "Başvurunuz firma ve SPL incelemesine gönderildi.",
    official: "Resmi SPL sorgulamasını aç",
    active: "Aktif",
    pending: "Beklemede",
    eligible: "Profesyonel erişime başvur",
    revise: "Başvuruyu güncelle",
    cancel: "Vazgeç",
    openProfessional: "Profesyonel portalı aç",
    submittedDetails: "Profesyonel bilgiler",
    verifiedStatus: "Doğrulandı",
    registeredProfessional: "Kayıtlı profesyonel",
    maskedLicence: "Maskelenmiş lisans numarası",
    firmStatus: "Firma durumu",
    verificationDate: "Son SPL doğrulaması",
    since: "Başlangıç",
    applicationStatus: {
      draft: "Taslak",
      submitted: "Gönderildi",
      under_review: "İnceleniyor",
      changes_requested: "Değişiklik gerekli",
      approved: "Onaylandı",
      rejected: "Reddedildi",
    },
    stateLabels: {
      not_applied: "Henüz başvuru yapılmadı",
      in_review: "İnceleme devam ediyor",
      action_required: "İşlem gerekiyor",
      approved_pending_activation: "Aktivasyon bekleniyor",
      active: "Profesyonel erişim aktif",
      inactive: "Erişim devre dışı",
    },
    stateCopy: {
      not_applied: "Lisans ve firma bilgileriniz Hunter & Hunter Investment Advisors tarafından incelenir.",
      in_review: "Başvurunuz inceleniyor; inceleme sırasında ikinci başvuru gönderilemez.",
      action_required: "Başvurunuzun güncellenmesi gerekiyor.",
      approved_pending_activation: "Başvurunuz onaylandı; kalan erişim adımları tamamlanıyor.",
      active: "Profesyonel erişiminiz aktif.",
      inactive: "Profesyonel erişiminizin yeniden etkinleştirilmesi için Hunter & Hunter Investment Advisors incelemesi gerekiyor.",
    },
  },
  en: {
    title: "Professional access",
    modalTitle: "Professional partner application",
    description:
      "Professionals with an SPL licence and an association with an SPK-authorized firm can apply for Hunter & Hunter Investment Advisors access.",
    modalDescription:
      "Enter the information shown in your SPL registry and your current firm association. Hunter & Hunter Investment Advisors verifies the details through official sources.",
    status: "Application status",
    firmGate: "Firm association",
    licenceGate: "SPL verification",
    accountGate: "Partner account",
    verified: "Verified through SPL",
    notLive: "This date does not imply continuous live synchronization.",
    registeredNames: "First and middle names as registered with SPL",
    registrySurname: "Registry surname",
    licenceNumber: "SPL licence-document number",
    licenceType: "Licence type",
    firm: "Firm name",
    firmHelp: "Enter the firm's legal or most commonly used name.",
    firmWorkEmail: "Firm work email",
    titleLabel: "Current professional title",
    consentLookup: "I authorize Hunter & Hunter Investment Advisors to perform and record an official public SPL lookup.",
    consentAccuracy: "I declare that the information submitted is current and accurate.",
    submit: "Submit partner application",
    submitting: "Submitting application",
    submitted: "Your application was sent for firm and SPL review.",
    official: "Open official SPL lookup",
    active: "Active",
    pending: "Pending",
    eligible: "Apply for professional access",
    revise: "Revise application",
    cancel: "Cancel",
    openProfessional: "Open Professional Portal",
    submittedDetails: "Professional information",
    verifiedStatus: "Verified",
    registeredProfessional: "Registered professional",
    maskedLicence: "Masked licence number",
    firmStatus: "Firm status",
    verificationDate: "Latest SPL verification",
    since: "Since",
    applicationStatus: {
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under review",
      changes_requested: "Changes required",
      approved: "Approved",
      rejected: "Rejected",
    },
    stateLabels: {
      not_applied: "No application yet",
      in_review: "Review in progress",
      action_required: "Action required",
      approved_pending_activation: "Awaiting activation",
      active: "Professional access active",
      inactive: "Access inactive",
    },
    stateCopy: {
      not_applied: "Hunter & Hunter Investment Advisors reviews your licence and firm information.",
      in_review: "Your application is under review; a duplicate cannot be submitted.",
      action_required: "Your application needs updated information.",
      approved_pending_activation: "Approved; the remaining access steps are being completed.",
      active: "Your Professional access is active.",
      inactive: "Hunter & Hunter Investment Advisors review is required to restore your Professional access.",
    },
  },
} as const;

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border border-[#d4dde2] bg-white px-3 font-normal text-[#213746] outline-none transition-colors placeholder:text-[#9aa4ab] focus:border-[#0a4b72]";

export function PartnerApplicationView({
  embedded = false,
  formOpen: controlledFormOpen,
  onFormOpenChange,
}: {
  embedded?: boolean;
  formOpen?: boolean;
  onFormOpenChange?: (open: boolean) => void;
} = {}) {
  const { lang } = useLang();
  const {
    currentUser,
    currentApplication,
    currentVerification,
    currentMembership,
    currentOrganization,
    context,
    activationIssues,
    dataset,
    submitPartnerApplication,
  } = usePortalAccess();
  const c = investorTerminology(pick(COPY, lang));
  const state = professionalProfileState(context);
  const canSubmit =
    canUseWorkspace(context, "investor") &&
    (state === "not_applied" || state === "action_required");
  const [uncontrolledFormOpen, setUncontrolledFormOpen] = useState(false);
  const formOpen = controlledFormOpen ?? uncontrolledFormOpen;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function changeFormOpen(open: boolean) {
    if (submitting && !open) return;
    setUncontrolledFormOpen(open);
    onFormOpenChange?.(open);
    if (!open && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("apply")) {
        url.searchParams.delete("apply");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
    }
  }

  useEffect(() => {
    if (!canSubmit) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("apply") === "1") changeFormOpen(true);
    // The legacy application query is inspected once when eligibility becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit]);

  const affiliation = currentApplication
    ? dataset.affiliations.find(
        (item) =>
          item.userId === currentUser.id &&
          item.organizationId === currentApplication.organizationId &&
          item.primary,
      )
    : undefined;
  const partnerAccount = dataset.partnerAccounts.find((item) => item.userId === currentUser.id);
  const applicationOrganization = currentApplication
    ? dataset.organizations.find((item) => item.id === currentApplication.organizationId)
    : currentOrganization;
  const firmApproved =
    affiliation?.status === "approved_by_firm" ||
    affiliation?.status === "approved_by_hnc_fallback";
  const licenceVerified = currentVerification?.result === "verified";
  const accountActive = partnerAccount?.status === "active" && activationIssues.length === 0;
  const maskedLicence =
    currentMembership?.maskedLicenceNumber ??
    (currentApplication ? maskLicenceNumber(currentApplication.licenceDocumentNumber) : undefined);
  const professionalFields = currentApplication
    ? [
        {
          label: c.registeredProfessional,
          value: `${currentApplication.registeredFirstNames} ${currentApplication.registryLastName}`.trim(),
          badge: undefined,
          valueClass: "",
        },
        {
          label: c.firm,
          value: applicationOrganization?.legalName ?? "—",
          badge: undefined,
          valueClass: "",
        },
        {
          label: c.titleLabel,
          value: currentApplication.professionalTitle,
          badge: undefined,
          valueClass: "",
        },
        {
          label: c.firmWorkEmail,
          value: currentApplication.firmWorkEmail,
          badge: undefined,
          valueClass: "break-all",
        },
        {
          label: c.licenceType,
          value: currentApplication.licenceType,
          badge: licenceVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#326449]">
              <CheckCircle2 className="size-3" />{c.verifiedStatus}
            </span>
          ) : undefined,
          valueClass: "",
        },
        {
          label: c.maskedLicence,
          value: maskedLicence ?? "—",
          badge: undefined,
          valueClass: "tabular-nums",
        },
        {
          label: c.verificationDate,
          value: currentVerification ? shortDate(currentVerification.verifiedAt.slice(0, 10), lang) : "—",
          badge: undefined,
          valueClass: "",
        },
        {
          label: c.since,
          value: partnerAccount?.relationshipSince ? shortDate(partnerAccount.relationshipSince, lang) : "—",
          badge: undefined,
          valueClass: "",
        },
        {
          label: c.firmStatus,
          value: applicationOrganization?.status === "active"
            ? c.active
            : applicationOrganization?.status === "pending"
              ? c.pending
              : applicationOrganization?.status ?? "—",
          badge: undefined,
          valueClass: "",
        },
      ]
    : [];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setError("");
    setSubmitting(true);
    const form = new FormData(formElement);

    try {
      await submitPartnerApplication({
        registeredFirstNames: String(form.get("registeredFirstNames") ?? ""),
        registryLastName: String(form.get("registryLastName") ?? ""),
        licenceDocumentNumber: String(form.get("licenceDocumentNumber") ?? ""),
        licenceType: String(form.get("licenceType") ?? ""),
        professionalTitle: String(form.get("professionalTitle") ?? ""),
        firmName: String(form.get("firmName") ?? ""),
        firmWorkEmail: String(form.get("firmWorkEmail") ?? ""),
        lookupConsent: form.get("lookupConsent") === "on",
        accuracyConsent: form.get("accuracyConsent") === "on",
      });
      setMessage(c.submitted);
      formElement.reset();
      setSubmitting(false);
      changeFormOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Application could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="professional-access" className="scroll-mt-6" aria-labelledby="professional-access-heading">
      {!embedded && (
        <PageHeader title={c.title} description={c.description} />
      )}

      {message && (
        <p role="status" className="mb-4 rounded-lg border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">
          {message}
        </p>
      )}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#eaf0f3] text-[#16445f]">
              <BriefcaseBusiness className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 id="professional-access-heading" className="text-base font-semibold text-[#1b3343]">
                  {c.stateLabels[state]}
                </h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${state === "active" ? "bg-[#e8f2ec] text-[#326449]" : state === "inactive" || state === "action_required" ? "bg-[#fbefed] text-[#87483f]" : state === "not_applied" ? "bg-[#eef2f4] text-[#5d6d78]" : "bg-[#f7efd9] text-[#735c20]"}`}>
                  <span className="size-1.5 rounded-full bg-current opacity-70" />
                  {state === "active" ? c.active : state === "not_applied" ? c.pending : c.applicationStatus[currentApplication?.status ?? "draft"]}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65737d]">
                {state === "not_applied" ? c.description : c.stateCopy[state]}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {canSubmit && (
              <button
                type="button"
                onClick={() => changeFormOpen(true)}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e] sm:w-auto"
              >
                {state === "action_required" ? c.revise : c.eligible}
                <ArrowRight className="size-4" />
              </button>
            )}
            {state === "active" && (
              <Link
                href={`${NORTH_BASE}/professional`}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0a2d46] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#123f5e] sm:w-auto"
              >
                {c.openProfessional}<ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>

        {state === "not_applied" && (
          <div className="flex gap-3 border-t border-[#e7ebee] bg-[#f8fafb] px-5 py-4 text-sm leading-6 text-[#536773] sm:px-6">
            <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-[#315c73]" />
            <p>{c.stateCopy.not_applied}</p>
          </div>
        )}

        {currentApplication && state !== "active" && (
          <div className="border-t border-[#e7ebee] px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs text-[#74808a]">{c.status}</p>
                <p className="mt-1 text-sm font-semibold text-[#193143]">{c.applicationStatus[currentApplication.status]}</p>
              </div>
              {licenceVerified && currentVerification && (
                <div className="text-sm text-[#326449] sm:text-right">
                  <p className="font-semibold">{c.verified} {shortDate(currentVerification.verifiedAt.slice(0, 10), lang)}</p>
                  <p className="mt-1 text-xs text-[#71808b]">{c.notLive}</p>
                </div>
              )}
            </div>
            <div className="mt-4 grid overflow-hidden rounded-md border border-[#e0e5e8] sm:grid-cols-3">
              {[
                [c.firmGate, firmApproved],
                [c.licenceGate, licenceVerified],
                [c.accountGate, accountActive],
              ].map(([label, active], index) => (
                <div key={String(label)} className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-[#e0e5e8] sm:border-l sm:border-t-0" : ""}`}>
                  {active ? <CheckCircle2 className="size-[18px] shrink-0 text-[#4f8063]" /> : <Clock3 className="size-[18px] shrink-0 text-[#9a7928]" />}
                  <div>
                    <p className="text-xs font-semibold text-[#394f5d]">{label as string}</p>
                    <p className="mt-0.5 text-[11px] text-[#73808a]">{active ? c.active : c.pending}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentApplication && (
          <div className="border-t border-[#e7ebee] bg-[#f8fafb] px-5 py-5 sm:px-6">
            <p className="text-sm font-semibold text-[#243b4a]">{c.submittedDetails}</p>
            <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-[#e2e7ea] bg-[#e2e7ea] sm:grid-cols-2 lg:grid-cols-3">
              {professionalFields.map(({ label, value, badge, valueClass }) => (
                <div key={label} className="min-w-0 bg-white px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <dt className="text-xs text-[#75818b]">{label}</dt>
                    {badge}
                  </div>
                  <dd className={`mt-1.5 break-words text-sm font-semibold leading-5 text-[#2d414e] ${valueClass}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {state === "inactive" && (
          <div className="flex gap-3 border-t border-[#eccfc9] bg-[#fbefed] px-5 py-4 text-sm leading-6 text-[#87483f] sm:px-6">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{c.stateCopy.inactive}</p>
          </div>
        )}
      </Panel>

      <Dialog open={canSubmit && formOpen} onOpenChange={changeFormOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#dce3e7] bg-white p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-[#e2e7ea] px-5 py-5 pr-12 sm:px-7 sm:py-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#eaf1f4] text-[#0a4b72]">
                <BadgeCheck className="size-5" />
              </span>
              <div>
                <DialogTitle className="font-serif text-2xl text-[#173246]">{c.modalTitle}</DialogTitle>
                <DialogDescription className="mt-2 max-w-2xl leading-6 text-[#66747f]">{c.modalDescription}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="professional-application-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-[#dce5e9] bg-[#f7fafb] p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-[#0a4b72]" />
                  <p className="text-sm leading-5 text-[#526570]">{c.stateCopy.not_applied}</p>
                </div>
                <a href={SPL_PUBLIC_SEARCH_URL} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0a4b72] hover:underline">
                  {c.official}<ExternalLink className="size-3.5" />
                </a>
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">
                  {error}
                </p>
              )}

              <fieldset disabled={submitting} className="grid gap-4 sm:grid-cols-2">
                <legend className="sr-only">{c.modalTitle}</legend>
                <label className="text-sm font-semibold sm:col-span-2">
                  {c.registeredNames}
                  <input name="registeredFirstNames" required defaultValue={currentApplication?.registeredFirstNames ?? `${currentUser.firstName}${currentUser.middleNames ? ` ${currentUser.middleNames}` : ""}`} autoComplete="name" className={fieldClass} />
                </label>
                <label className="text-sm font-semibold">
                  {c.registrySurname}
                  <input name="registryLastName" required defaultValue={state === "action_required" ? currentApplication?.registryLastName : undefined} autoComplete="off" data-ph-mask className={fieldClass} />
                </label>
                <label className="text-sm font-semibold">
                  {c.licenceNumber}
                  <input name="licenceDocumentNumber" required defaultValue={state === "action_required" ? currentApplication?.licenceDocumentNumber : undefined} autoComplete="off" inputMode="numeric" data-ph-mask className={fieldClass} />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  {c.licenceType}
                  <select name="licenceType" required defaultValue={currentApplication?.licenceType ?? ""} className={fieldClass}>
                    <option value="">—</option>
                    <option>Sermaye Piyasası Faaliyetleri Düzey 1</option>
                    <option>Sermaye Piyasası Faaliyetleri Düzey 2</option>
                    <option>Sermaye Piyasası Faaliyetleri Düzey 3</option>
                    <option>Türev Araçlar Lisansı</option>
                    <option>Konut Değerleme Lisansı</option>
                    <option>Gayrimenkul Değerleme Lisansı</option>
                    <option>{lang === "tr" ? "Diğer / manuel inceleme" : "Other / manual review"}</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  {c.titleLabel}
                  <input name="professionalTitle" required defaultValue={currentApplication?.professionalTitle} autoComplete="organization-title" className={fieldClass} />
                </label>
                <label className="text-sm font-semibold">
                  {c.firmWorkEmail}
                  <input name="firmWorkEmail" required type="email" defaultValue={currentApplication?.firmWorkEmail} autoComplete="email" className={fieldClass} />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  {c.firm}
                  <input name="firmName" required defaultValue={applicationOrganization?.legalName} autoComplete="organization" className={fieldClass} />
                  <span className="mt-1.5 block text-xs font-normal text-[#78858e]">{c.firmHelp}</span>
                </label>

                <div className="space-y-3 border-t border-[#e2e7ea] pt-5 sm:col-span-2">
                  <label className="flex gap-3 text-sm leading-6 text-[#4f5f6b]">
                    <input name="lookupConsent" required type="checkbox" className="mt-1 size-4 shrink-0 accent-[#0a4b72]" />
                    <span>{c.consentLookup}</span>
                  </label>
                  <label className="flex gap-3 text-sm leading-6 text-[#4f5f6b]">
                    <input name="accuracyConsent" required type="checkbox" className="mt-1 size-4 shrink-0 accent-[#0a4b72]" />
                    <span>{c.consentAccuracy}</span>
                  </label>
                </div>
              </fieldset>
            </div>

            <DialogFooter className="shrink-0 border-t border-[#e2e7ea] bg-white px-5 py-4 sm:px-7">
              <button type="button" onClick={() => changeFormOpen(false)} disabled={submitting} className="h-11 rounded-lg border border-[#cfd8de] bg-white px-5 text-sm font-semibold text-[#4b5d68] disabled:opacity-60">
                {c.cancel}
              </button>
              <button disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0a2d46] px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {submitting ? c.submitting : c.submit}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
