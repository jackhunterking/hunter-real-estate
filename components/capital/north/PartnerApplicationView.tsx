"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileUp,
  LockKeyhole,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { SPL_PUBLIC_SEARCH_URL } from "@/lib/capital/portal-access";
import { uploadPartnerCredential } from "@/lib/supabase/storage";
import { PageHeader, Panel, shortDate } from "./PortalUI";
import { usePortalAccess } from "./PortalAccessProvider";

const COPY = {
  tr: {
    eyebrow: "Lisanslı partner erişimi",
    title: "Partner başvurusu",
    description:
      "Partner erişimi için aktif SPL lisansı, onaylı bir firma bağlantısı ve Hunter North uyum onayı gerekir.",
    status: "Başvuru durumu",
    firmGate: "Firma bağlantısı",
    licenceGate: "SPL doğrulaması",
    accountGate: "Partner hesabı",
    verified: "SPL üzerinden doğrulandı",
    notLive: "Bu tarih canlı senkronizasyon anlamına gelmez.",
    privacy:
      "Sicil soyadınız ve lisans numaranız firma listelerinde, URL’lerde, analizlerde veya e-posta konu satırlarında gösterilmez.",
    registeredNames: "SPL kaydındaki ad ve orta adlar",
    registrySurname: "Sicil Soyad",
    licenceNumber: "SPL lisans belge numarası",
    licenceType: "Lisans türü",
    firm: "Mevcut firma",
    searchFirm: "Firma ara",
    chooseFirm: "Kayıtlı firma seçin",
    newFirm: "Firmam listede yok",
    firmWorkEmail: "Firma iş e-postası",
    titleLabel: "Mevcut mesleki unvan",
    evidence: "Opsiyonel lisans belgesi",
    consentLookup: "Hunter North’un resmi SPL araması yapmasına ve sonucu kaydetmesine izin veriyorum.",
    consentAccuracy: "Verdiğim bilgilerin güncel ve doğru olduğunu beyan ederim.",
    submit: "Partner başvurusunu gönder",
    submitted: "Başvurunuz firma ve SPL incelemesine gönderildi.",
    official: "Resmi SPL aramasını aç",
    firmLegalName: "Firma yasal adı",
    tradingName: "Ticari ad",
    firmType: "Firma türü",
    spk: "SPK yetki / kayıt bilgisi",
    address: "Kayıtlı adres",
    website: "Web sitesi",
    domain: "İş alan adı",
    authorized: "Yetkili kişi",
    compliance: "Uyum iletişimi",
    authorizationFile: "Yetki belgesi",
    newFirmNote: "Yeni firma önce Hunter North firma incelemesine alınır.",
    active: "Aktif",
    pending: "Beklemede",
  },
  en: {
    eyebrow: "Licensed-partner access",
    title: "Partner application",
    description:
      "Partner access requires an active SPL licence, an approved firm association, and Hunter North compliance approval.",
    status: "Application status",
    firmGate: "Firm association",
    licenceGate: "SPL verification",
    accountGate: "Partner account",
    verified: "Verified through SPL",
    notLive: "This date does not imply continuous live synchronization.",
    privacy:
      "Your registry surname and licence number are never placed in firm-wide lists, URLs, analytics, or email subject lines.",
    registeredNames: "First and middle names as registered",
    registrySurname: "Sicil Soyad (registry surname)",
    licenceNumber: "SPL licence-document number",
    licenceType: "Licence type",
    firm: "Current firm",
    searchFirm: "Search firms",
    chooseFirm: "Select a registered firm",
    newFirm: "My firm is not listed",
    firmWorkEmail: "Firm work email",
    titleLabel: "Current professional title",
    evidence: "Optional licence document",
    consentLookup: "I authorize Hunter North to perform and record an official public SPL lookup.",
    consentAccuracy: "I declare that the information submitted is current and accurate.",
    submit: "Submit partner application",
    submitted: "Your application was sent for firm and SPL review.",
    official: "Open official SPL search",
    firmLegalName: "Firm legal name",
    tradingName: "Trading name",
    firmType: "Firm type",
    spk: "SPK authorization / registration",
    address: "Registered address",
    website: "Website",
    domain: "Business domain",
    authorized: "Authorized contact",
    compliance: "Compliance contact",
    authorizationFile: "Authorization document",
    newFirmNote: "A new firm is reviewed by Hunter North before membership approval.",
    active: "Active",
    pending: "Pending",
  },
} as const;

function gateClass(active: boolean) {
  return active ? "border-[#bdd9c8] bg-[#edf7f1] text-[#326449]" : "border-[#e6d9b9] bg-[#fbf6e9] text-[#735c20]";
}

export function PartnerApplicationView() {
  const { lang } = useLang();
  const {
    currentUser,
    currentApplication,
    currentVerification,
    activationIssues,
    backendConfigured,
    dataset,
    submitPartnerApplication,
  } = usePortalAccess();
  const c = COPY[lang];
  const [query, setQuery] = useState("");
  const [newFirm, setNewFirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const firms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-CA");
    return dataset.organizations.filter((organization) => {
      if (!normalized) return true;
      return `${organization.legalName} ${organization.tradingName ?? ""}`
        .toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-CA")
        .includes(normalized);
    });
  }, [dataset.organizations, lang, query]);

  const affiliation = currentApplication
    ? dataset.affiliations.find(
        (item) =>
          item.userId === currentUser.id &&
          item.organizationId === currentApplication.organizationId &&
          item.primary,
      )
    : undefined;
  const partnerAccount = dataset.partnerAccounts.find((item) => item.userId === currentUser.id);
  const firmApproved =
    affiliation?.status === "approved_by_firm" ||
    affiliation?.status === "approved_by_hnc_fallback";
  const licenceVerified = currentVerification?.result === "verified";
  const accountActive = partnerAccount?.status === "active" && activationIssues.length === 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setError("");
    const form = new FormData(formElement);
    const evidence = form.get("evidence");
    const authorizationEvidence = form.get("authorizationEvidence");

    try {
      const evidencePath =
        evidence instanceof File && evidence.name
          ? backendConfigured
            ? await uploadPartnerCredential(currentUser.id, evidence)
            : evidence.name
          : undefined;
      const authorizationEvidencePath =
        authorizationEvidence instanceof File && authorizationEvidence.name
          ? backendConfigured
            ? await uploadPartnerCredential(currentUser.id, authorizationEvidence)
            : authorizationEvidence.name
          : undefined;
      await submitPartnerApplication({
        organizationId: newFirm ? undefined : String(form.get("organizationId") ?? ""),
        newOrganization: newFirm
          ? {
              legalName: String(form.get("firmLegalName") ?? "").trim(),
              tradingName: String(form.get("tradingName") ?? "").trim(),
              firmType: String(form.get("firmType") ?? "").trim(),
              spkRegistration: String(form.get("spkRegistration") ?? "").trim(),
              registeredAddress: String(form.get("registeredAddress") ?? "").trim(),
              website: String(form.get("website") ?? "").trim(),
              businessDomain: String(form.get("businessDomain") ?? "").trim(),
              authorizedContact: String(form.get("authorizedContact") ?? "").trim(),
              complianceContact: String(form.get("complianceContact") ?? "").trim(),
              authorizationEvidenceFilename: authorizationEvidencePath,
            }
          : undefined,
        registeredFirstNames: String(form.get("registeredFirstNames") ?? ""),
        registryLastName: String(form.get("registryLastName") ?? ""),
        licenceDocumentNumber: String(form.get("licenceDocumentNumber") ?? ""),
        licenceType: String(form.get("licenceType") ?? ""),
        professionalTitle: String(form.get("professionalTitle") ?? ""),
        firmWorkEmail: String(form.get("firmWorkEmail") ?? ""),
        evidenceFilename: evidencePath,
        lookupConsent: form.get("lookupConsent") === "on",
        accuracyConsent: form.get("accuracyConsent") === "on",
      });
      setMessage(c.submitted);
      formElement.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Application could not be submitted.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        action={
          <a href={SPL_PUBLIC_SEARCH_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cfd8de] bg-white px-4 text-sm font-semibold text-[#0a4b72]">
            {c.official}<ExternalLink className="size-4" />
          </a>
        }
      />

      <div className="mb-6 flex gap-3 rounded-md border border-[#cbdde8] bg-[#edf5f9] p-4 text-sm leading-6 text-[#365b70]">
        <LockKeyhole className="mt-0.5 size-5 shrink-0" />
        <p>{c.privacy}</p>
      </div>

      {currentApplication && (
        <Panel className="mb-6 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.09em] text-[#74808a]">{c.status}</p>
              <p className="mt-2 text-lg font-semibold text-[#193143]">{currentApplication.status}</p>
            </div>
            {licenceVerified && currentVerification && (
              <div className="text-sm text-[#326449]">
                <p className="font-semibold">{c.verified} {shortDate(currentVerification.verifiedAt.slice(0, 10), lang)}</p>
                <p className="mt-1 text-xs text-[#71808b]">{c.notLive}</p>
              </div>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              [c.firmGate, firmApproved],
              [c.licenceGate, licenceVerified],
              [c.accountGate, accountActive],
            ].map(([label, active]) => (
              <div key={String(label)} className={`flex items-center gap-3 rounded-md border p-3 ${gateClass(Boolean(active))}`}>
                {active ? <CheckCircle2 className="size-5" /> : <Clock3 className="size-5" />}
                <div>
                  <p className="text-xs font-semibold">{label as string}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">{active ? c.active : c.pending}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <BadgeCheck className="size-5 text-[#0a4b72]" />
            <h2 className="font-semibold text-[#193143]">{c.licenceGate}</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              {c.registeredNames}
              <input name="registeredFirstNames" required defaultValue={`${currentUser.firstName}${currentUser.middleNames ? ` ${currentUser.middleNames}` : ""}`} className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
            </label>
            <label className="text-sm font-semibold">
              {c.registrySurname}
              <input name="registryLastName" required autoComplete="off" data-ph-mask className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
            </label>
            <label className="text-sm font-semibold">
              {c.licenceNumber}
              <input name="licenceDocumentNumber" required autoComplete="off" inputMode="numeric" data-ph-mask className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              {c.licenceType}
              <select name="licenceType" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
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
              <input name="professionalTitle" required className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
            </label>
            <label className="text-sm font-semibold">
              {c.firmWorkEmail}
              <input name="firmWorkEmail" required type="email" autoComplete="work email" className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              {c.evidence}
              <span className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-dashed border-[#c6d0d7] px-3 font-normal text-[#65717e]">
                <FileUp className="size-4" /><input name="evidence" type="file" accept=".pdf,.png,.jpg,.jpeg" className="w-full text-xs" />
              </span>
            </label>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Building2 className="size-5 text-[#0a4b72]" />
            <h2 className="font-semibold text-[#193143]">{c.firm}</h2>
          </div>
          {!newFirm ? (
            <div className="mt-5 space-y-4">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7a8790]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.searchFirm} className="h-11 w-full rounded-md border border-[#d6dde2] pl-9 pr-3 text-sm outline-none focus:border-[#0a4b72]" />
              </label>
              <label className="block text-sm font-semibold">
                {c.chooseFirm}
                <select name="organizationId" required={!newFirm} className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] bg-white px-3 font-normal">
                  <option value="">—</option>
                  {firms.map((firm) => <option key={firm.id} value={firm.id}>{firm.legalName}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => setNewFirm(true)} className="text-sm font-semibold text-[#0a4b72] hover:underline">{c.newFirm}</button>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <p className="sm:col-span-2 rounded-md bg-[#f7f2e5] p-3 text-xs leading-5 text-[#735c20]">{c.newFirmNote}</p>
              {[
                ["firmLegalName", c.firmLegalName, true],
                ["tradingName", c.tradingName, false],
                ["firmType", c.firmType, true],
                ["spkRegistration", c.spk, true],
                ["registeredAddress", c.address, true],
                ["website", c.website, true],
                ["businessDomain", c.domain, true],
                ["authorizedContact", c.authorized, true],
                ["complianceContact", c.compliance, true],
              ].map(([name, label, required]) => (
                <label key={String(name)} className={`text-sm font-semibold ${name === "registeredAddress" ? "sm:col-span-2" : ""}`}>
                  {label as string}
                  <input name={name as string} required={Boolean(required)} className="mt-2 h-11 w-full rounded-md border border-[#d6dde2] px-3 font-normal outline-none focus:border-[#0a4b72]" />
                </label>
              ))}
              <label className="text-sm font-semibold sm:col-span-2">
                {c.authorizationFile}
                <input name="authorizationEvidence" required type="file" accept=".pdf,.png,.jpg,.jpeg" className="mt-2 block w-full rounded-md border border-dashed border-[#c6d0d7] p-3 text-xs font-normal" />
              </label>
              <button type="button" onClick={() => setNewFirm(false)} className="justify-self-start text-sm font-semibold text-[#0a4b72] hover:underline">{c.chooseFirm}</button>
            </div>
          )}

          <div className="mt-6 space-y-3 border-t border-[#e2e7ea] pt-5">
            <label className="flex gap-3 text-sm leading-6 text-[#4f5f6b]">
              <input name="lookupConsent" required type="checkbox" className="mt-1 size-4 accent-[#0a4b72]" />
              <span>{c.consentLookup}</span>
            </label>
            <label className="flex gap-3 text-sm leading-6 text-[#4f5f6b]">
              <input name="accuracyConsent" required type="checkbox" className="mt-1 size-4 accent-[#0a4b72]" />
              <span>{c.consentAccuracy}</span>
            </label>
          </div>
        </Panel>

        <div className="xl:col-span-2">
          {message && <p role="status" className="mb-4 rounded-md border border-[#b8d8c5] bg-[#edf7f1] p-3 text-sm text-[#316247]">{message}</p>}
          {error && <p role="alert" className="mb-4 rounded-md border border-[#eccdc8] bg-[#fbefed] p-3 text-sm text-[#98463c]">{error}</p>}
          <button className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0a2d46] px-5 text-sm font-semibold text-white">
            <ShieldCheck className="size-4" />{c.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
