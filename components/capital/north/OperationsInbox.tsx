"use client";

import { useMemo, useState } from "react";
import { Banknote, BookOpen, Building2, ClipboardCheck, FileSearch, Gauge, Search, ShieldCheck, UserCheck, X } from "lucide-react";
import type { LocalizedText } from "@/lib/capital/types";
import type { LearningAdminResource } from "@/lib/capital/learning";
import { hasPlatformRole } from "@/lib/capital/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { investorTerminology } from "@/lib/i18n/investor-terminology";
import { FundCommissionScheduleManager } from "./FundCommissionScheduleManager";
import { LearningContentManager } from "./LearningContentManager";
import { usePortalAccess } from "./PortalAccessProvider";
import { PageHeader, Panel, shortDate } from "./PortalUI";

export type OperationsModule = "requests" | "professional" | "licences" | "firms" | "payments" | "fund-schedules" | "content" | "leads" | "audit";
type LeadRow = { id: string; submission_type: string; status: string; submitted_at: string; email: string; first_name?: string | null; last_name?: string | null; source?: string | null };
export type OperationsQueueItem = { id: string; module: OperationsModule; title: string; summary: string; status: string; date: string; details: Record<string, string | number | undefined> };
type QueueItem = OperationsQueueItem;

const ICONS = { requests: ClipboardCheck, professional: UserCheck, licences: ShieldCheck, firms: Building2, payments: Banknote, "fund-schedules": Gauge, content: BookOpen, leads: FileSearch, audit: FileSearch };
const COPY = {
  en: { eyebrow: "Hunter & Hunter Investment Advisors staff", title: "Operations", description: "One workspace for investor requests, professional approvals, learning content, payments, and audit activity.", all: "All work", requests: "Investor requests", professional: "Professional applications", licences: "Licence checks", firms: "Firm records", payments: "Payments", fundSchedules: "Fund schedules", content: "Content", leads: "Legacy leads", audit: "Audit activity", search: "Search the queue", noItems: "No items match these filters.", details: "Review details", close: "Close drawer", approveFirm: "Approve firm record", approvePayment: "Approve payment", markPaid: "Mark paid", paymentRef: "Payment reference", required: "Required role", compliance: "Compliance", finance: "Finance", platform: "Platform admin" },
  tr: { eyebrow: "Hunter & Hunter Investment Advisors ekibi", title: "Operasyonlar", description: "Yatırımcı talepleri, profesyonel onayları, bilgi içeriği, ödemeler ve denetim faaliyeti için tek çalışma alanı.", all: "Tüm işler", requests: "Yatırımcı talepleri", professional: "Profesyonel başvuruları", licences: "Lisans kontrolleri", firms: "Firma kayıtları", payments: "Ödemeler", fundSchedules: "Fon programları", content: "İçerik", leads: "Eski potansiyel müşteriler", audit: "Denetim faaliyeti", search: "Kuyrukta ara", noItems: "Bu filtrelerle eşleşen kayıt yok.", details: "İnceleme ayrıntıları", close: "Paneli kapat", approveFirm: "Firma kaydını onayla", approvePayment: "Ödemeyi onayla", markPaid: "Ödendi olarak işaretle", paymentRef: "Ödeme referansı", required: "Gerekli rol", compliance: "Uyum", finance: "Finans", platform: "Platform yöneticisi" },
} as const;

export function OperationsInbox({ leads = [], initialModule = "all", initialQueue = [], offerings = [], learningResources = [], backendConfigured = false }: { leads?: LeadRow[]; initialModule?: OperationsModule | "all"; initialQueue?: OperationsQueueItem[]; offerings?: { id: string; name: LocalizedText }[]; learningResources?: LearningAdminResource[]; backendConfigured?: boolean }) {
  const { lang } = useLang();
  const { currentUser, dataset, decideOrganization, updateCommissionStatus, markCommissionPaid } = usePortalAccess();
  const c = investorTerminology(pick(COPY, lang));
  const [module, setModule] = useState<OperationsModule | "all">(initialModule);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const platform = hasPlatformRole(currentUser, "platform_admin");
  const compliance = platform || hasPlatformRole(currentUser, "compliance_admin");
  const finance = platform || hasPlatformRole(currentUser, "finance_admin");
  const allowedModules = useMemo(() => new Set<OperationsModule>([
    ...(compliance ? ["requests", "professional", "licences", "firms", "content", "leads", "audit"] as OperationsModule[] : []),
    ...(finance ? ["payments", "fund-schedules", "audit"] as OperationsModule[] : []),
  ]), [compliance, finance]);

  const items = useMemo<QueueItem[]>(() => {
    if (initialQueue.length) {
      return initialQueue.filter((item) => allowedModules.has(item.module));
    }
    const userName = (id: string) => dataset.users.find((user) => user.id === id)?.displayName ?? id;
    const queue: QueueItem[] = [];
    if (allowedModules.has("requests")) dataset.investments.forEach((request) => queue.push({ id: `request:${request.id}`, module: "requests", title: userName(request.userId), summary: `${request.offeringId} · ${request.amount || "—"} CAD`, status: request.status, date: request.updatedAt, details: { "Request ID": request.id, Investor: userName(request.userId), Fund: request.offeringId, Amount: request.amount || undefined, "Account type": request.accountType, "Preferred contact": request.preferredContactChannel, Note: request.note } }));
    if (allowedModules.has("professional")) dataset.partnerApplications.forEach((application) => queue.push({ id: `professional:${application.id}`, module: "professional", title: `${application.registeredFirstNames} ${application.registryLastName}`, summary: `${application.professionalTitle} · ${application.firmWorkEmail}`, status: application.status, date: application.updatedAt, details: { "Application ID": application.id, "Licence type": application.licenceType, "Licence number": application.licenceDocumentNumber, "Firm email": application.firmWorkEmail, Organization: application.organizationId } }));
    if (allowedModules.has("licences")) dataset.licenseVerifications.forEach((check) => queue.push({ id: `licence:${check.id}`, module: "licences", title: userName(check.userId), summary: `${check.queriedLicenceNumber} · ${check.sourceUrl}`, status: check.result, date: check.verifiedAt, details: { "Check ID": check.id, "Licence number": check.queriedLicenceNumber, Surname: check.queriedRegistryLastName, Result: check.result, "Source URL": check.sourceUrl, Notes: check.reviewerNotes } }));
    if (allowedModules.has("firms")) dataset.organizations.forEach((organization) => queue.push({ id: `firm:${organization.id}`, module: "firms", title: organization.legalName, summary: organization.firmType, status: organization.status, date: dataset.auditEvents.find((event) => event.entityId === organization.id)?.occurredAt ?? "", details: { "Organization ID": organization.id, "Trading name": organization.tradingName, Type: organization.firmType, Website: organization.website, "SPK registration": organization.spkRegistration, Address: organization.registeredAddress, "Compliance contact": organization.complianceContact } }));
    if (allowedModules.has("payments")) dataset.commissions.forEach((payment) => queue.push({ id: `payment:${payment.id}`, module: "payments", title: payment.redactedReferralReference, summary: `${payment.amount} ${payment.currency} · ${payment.beneficiaryType}`, status: payment.status, date: payment.paidAt ?? payment.approvedAt ?? payment.fundedAt, details: { "Commission ID": payment.id, Fund: payment.offeringId, Beneficiary: payment.beneficiaryType, Amount: payment.amount, Currency: payment.currency, "Earning period": payment.earningPeriod, "Payment reference": payment.paymentReference } }));
    if (allowedModules.has("leads")) leads.forEach((lead) => queue.push({ id: `lead:${lead.id}`, module: "leads", title: `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || lead.email, summary: `${lead.submission_type} · ${lead.email}`, status: lead.status, date: lead.submitted_at, details: { "Lead ID": lead.id, Email: lead.email, Type: lead.submission_type, Source: lead.source ?? undefined } }));
    if (allowedModules.has("audit")) dataset.auditEvents.forEach((event) => queue.push({ id: `audit:${event.id}`, module: "audit", title: event.action, summary: event.summary, status: event.entityType, date: event.occurredAt, details: { "Event ID": event.id, Actor: userName(event.actorUserId), Entity: event.entityType, "Entity ID": event.entityId, Summary: event.summary } }));
    return queue.sort((a, b) => Date.parse(b.date || "1970-01-01") - Date.parse(a.date || "1970-01-01"));
  }, [allowedModules, dataset, initialQueue, leads]);

  const visible = items.filter((item) => (module === "all" || item.module === module) && `${item.title} ${item.summary} ${item.status}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const labels: Record<OperationsModule, string> = { requests: c.requests, professional: c.professional, licences: c.licences, firms: c.firms, payments: c.payments, "fund-schedules": c.fundSchedules, content: c.content, leads: c.leads, audit: c.audit };

  async function runAction(action: "firm" | "approve-payment" | "paid") {
    if (!selected) return;
    const id = selected.id.split(":").slice(1).join(":");
    if (action === "firm") await decideOrganization(id, "active", "Approved from the consolidated Operations inbox.");
    if (action === "approve-payment") await updateCommissionStatus(id, "approved");
    if (action === "paid") await markCommissionPaid(id, paymentReference);
    setSelected(null);
  }

  return <div>
    <PageHeader title={c.title} description={c.description} />
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setModule("all")} className={`rounded-md px-3 py-2 text-xs font-semibold ${module === "all" ? "bg-[#0a2d46] text-white" : "border border-[#d8e0e4] bg-white text-[#5e6d77]"}`}>{c.all}</button>{(Object.keys(labels) as OperationsModule[]).filter((key) => allowedModules.has(key)).map((key) => <button key={key} type="button" onClick={() => setModule(key)} className={`rounded-md px-3 py-2 text-xs font-semibold ${module === key ? "bg-[#0a2d46] text-white" : "border border-[#d8e0e4] bg-white text-[#5e6d77]"}`}>{labels[key]}</button>)}</div>
      {module !== "content" && module !== "fund-schedules" && <label className="relative block min-w-64"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81909a]" /><span className="sr-only">{c.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search} className="h-10 w-full rounded-md border border-[#d5dde2] bg-white pl-9 pr-3 text-sm" /></label>}
    </div>
    {module === "content" ? <LearningContentManager resources={learningResources} backendConfigured={backendConfigured} /> : module === "fund-schedules" ? <FundCommissionScheduleManager offerings={offerings} backendConfigured={backendConfigured} /> : <Panel className="overflow-hidden"><div className="divide-y divide-[#e8ecee]">{visible.map((item) => { const Icon = ICONS[item.module]; return <button key={item.id} type="button" onClick={() => setSelected(item)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left hover:bg-[#f7f9fa]"><span className="grid size-10 place-items-center rounded-lg bg-[#edf3f6] text-[#0a4b72]"><Icon className="size-5" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#1c3546]">{item.title}</span><span className="mt-1 block truncate text-xs text-[#6b7982]">{labels[item.module]} · {item.summary}</span></span><span className="text-right"><span className="block rounded bg-[#eef2f4] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5f6e78]">{item.status}</span>{item.date && <span className="mt-1.5 block text-[10px] text-[#87929a]">{shortDate(item.date.slice(0, 10), lang)}</span>}</span></button>; })}{!visible.length && <div className="p-12 text-center text-sm text-[#697680]">{c.noItems}</div>}</div></Panel>}

    {selected && <div className="fixed inset-0 z-[80]"><button type="button" aria-label={c.close} className="absolute inset-0 bg-[#061521]/50" onClick={() => setSelected(null)} /><aside role="dialog" aria-modal="true" aria-labelledby="operations-drawer-title" className="absolute inset-y-0 right-0 w-[min(94vw,520px)] overflow-y-auto bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b878f]">{labels[selected.module]}</p><h2 id="operations-drawer-title" className="mt-2 text-xl font-semibold text-[#183246]">{selected.title}</h2><span className="mt-2 inline-flex rounded bg-[#eef2f4] px-2 py-1 text-xs font-bold text-[#5c6b75]">{selected.status}</span></div><button type="button" aria-label={c.close} onClick={() => setSelected(null)} className="grid size-9 place-items-center rounded-full hover:bg-[#eef2f4]"><X className="size-5" /></button></div><dl className="mt-7 divide-y divide-[#e8ecee]">{Object.entries(selected.details).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => <div key={key} className="py-3"><dt className="text-xs font-semibold text-[#75818a]">{key}</dt><dd className="mt-1 break-words text-sm leading-6 text-[#2c4352]">{String(value)}</dd></div>)}</dl><div className="mt-7 border-t border-[#e5e9ec] pt-5">{selected.module === "firms" && selected.status === "pending" && compliance && <button type="button" onClick={() => runAction("firm")} className="h-10 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.approveFirm}</button>}{selected.module === "payments" && selected.status === "draft" && finance && <button type="button" onClick={() => runAction("approve-payment")} className="h-10 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white">{c.approvePayment}</button>}{selected.module === "payments" && selected.status === "approved" && finance && <div className="flex gap-2"><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder={c.paymentRef} className="h-10 min-w-0 flex-1 rounded-md border border-[#ccd5db] px-3 text-sm" /><button type="button" disabled={!paymentReference.trim()} onClick={() => runAction("paid")} className="h-10 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-50">{c.markPaid}</button></div>}<p className="mt-4 text-xs text-[#78848d]">{c.required}: {selected.module === "payments" ? c.finance : selected.module === "audit" ? c.platform : c.compliance}</p></div></aside></div>}
  </div>;
}
