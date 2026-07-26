"use client";

/**
 * In-portal authoring for investment ("offering") profiles. Loads each offering's
 * editable bundle (app.offerings.draft_content via api.offering_admin), edits it
 * in place — preserving every field the form does not surface — and writes back
 * through api.save_offering_draft (save) / api.publish_offering (publish). Assets
 * upload straight to Supabase Storage via a signed upload URL, then their
 * {bucket,path} is recorded on the bundle. Mirrors LearningContentManager.
 */
import { useMemo, useState } from "react";
import { FilePlus2, ImagePlus, Plus, Save, Send, Trash2, Upload } from "lucide-react";
import type { OfferingAdminRow } from "@/lib/equity-market/offering-admin-server";
import type {
  ImageSlot,
  LocalizedText,
  OfferingBundle,
  OfferingDocument,
  RiskCategory,
  RiskEntry,
  ShareClass,
  SourcedValue,
} from "@/lib/equity-market/types";
import { riskText } from "@/lib/equity-market/present";
import { scoreOfferingCompleteness } from "@/lib/equity-market/field-catalogue";
import { hasPlatformRole } from "@/lib/equity-market/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { usePortalAccess } from "./PortalAccessProvider";

type Lang = "en" | "tr";

const COPY = {
  en: {
    title: "Investments", description: "Create and edit investment profiles — content, facts, media and documents — then publish.",
    backend: "Connect the Supabase backend to author investments.", newOffering: "New investment", duplicate: "Duplicate as new",
    none: "No investments yet.", english: "English", turkish: "Turkish", identity: "Identity", slug: "Slug", status: "Status",
    featured: "Featured", name: "Name", shortName: "Short name", summary: "Summary", thesis: "Thesis", facts: "Key facts",
    riskProfile: "Risk profile", managementFee: "Management fee", valuationFrequency: "Valuation frequency",
    distributionFrequency: "Distribution frequency", fundType: "Fund type", fundStatus: "Fund status", inceptionDate: "Inception (YYYY)",
    aum: "AUM (display)", verifiedAt: "Verified at (YYYY-MM-DD)", highlights: "Highlights", risks: "Risks", add: "Add",
    returns: "Trailing returns", period: "Period", value: "Value", providers: "Service providers", auditor: "Auditor",
    legal: "Legal counsel", appraiser: "Appraiser", providerName: "Name", url: "URL", shareClasses: "Share classes",
    scName: "Class name", targetReturn: "Target return", targetDistribution: "Target distribution", minimum: "Minimum (number)",
    term: "Term", accounts: "Accounts (comma separated)", media: "Media", card: "Card", banner: "Banner", logo: "Logo",
    gallery: "Gallery", upload: "Upload", documents: "Documents", docTitle: "Title", type: "Type", visibility: "Visibility",
    version: "Version", effective: "Effective date", save: "Save draft", publish: "Publish", saved: "Saved",
    error: "The update was not completed.", uploading: "Uploading…", remove: "Remove", publishHint: "Save the draft before publishing.",
    freshness: "Data freshness", cadence: "Update cadence", dataAsOf: "Figures as of (YYYY-MM-DD)",
    dataPeriodLabel: "Period label", managerPublicUrl: "Manager fund page (URL)",
    completeness: "Profile completeness", missingRequired: "Still required", missingRecommended: "Recommended",
    allRequired: "Every required field is filled.",
  },
  tr: {
    title: "Yatırımlar", description: "Yatırım profillerini oluşturun ve düzenleyin — içerik, veriler, medya ve belgeler — ardından yayımlayın.",
    backend: "Yatırımları düzenlemek için Supabase altyapısını bağlayın.", newOffering: "Yeni yatırım", duplicate: "Kopyala",
    none: "Henüz yatırım yok.", english: "İngilizce", turkish: "Türkçe", identity: "Kimlik", slug: "Kısa bağlantı", status: "Durum",
    featured: "Öne çıkan", name: "Ad", shortName: "Kısa ad", summary: "Özet", thesis: "Tez", facts: "Önemli veriler",
    riskProfile: "Risk profili", managementFee: "Yönetim ücreti", valuationFrequency: "Değerleme sıklığı",
    distributionFrequency: "Dağıtım sıklığı", fundType: "Fon türü", fundStatus: "Fon durumu", inceptionDate: "Başlangıç (YYYY)",
    aum: "AUM (görüntü)", verifiedAt: "Doğrulama (YYYY-MM-DD)", highlights: "Öne çıkanlar", risks: "Riskler", add: "Ekle",
    returns: "Geçmiş getiriler", period: "Dönem", value: "Değer", providers: "Hizmet sağlayıcılar", auditor: "Denetçi",
    legal: "Hukuk danışmanı", appraiser: "Değerleme uzmanı", providerName: "Ad", url: "URL", shareClasses: "Pay sınıfları",
    scName: "Sınıf adı", targetReturn: "Hedef getiri", targetDistribution: "Hedef dağıtım", minimum: "Minimum (sayı)",
    term: "Vade", accounts: "Hesaplar (virgülle)", media: "Medya", card: "Kart", banner: "Afiş", logo: "Logo",
    gallery: "Galeri", upload: "Yükle", documents: "Belgeler", docTitle: "Başlık", type: "Tür", visibility: "Görünürlük",
    version: "Sürüm", effective: "Yürürlük tarihi", save: "Taslağı kaydet", publish: "Yayımla", saved: "Kaydedildi",
    error: "Güncelleme tamamlanamadı.", uploading: "Yükleniyor…", remove: "Kaldır", publishHint: "Yayımlamadan önce taslağı kaydedin.",
    freshness: "Veri güncelliği", cadence: "Güncelleme sıklığı", dataAsOf: "Veri tarihi (YYYY-AA-GG)",
    dataPeriodLabel: "Dönem etiketi", managerPublicUrl: "Yönetici fon sayfası (URL)",
    completeness: "Profil tamamlanma", missingRequired: "Hâlâ zorunlu", missingRecommended: "Önerilen",
    allRequired: "Tüm zorunlu alanlar dolu.",
  },
} as const;

const EMPTY_LOCALIZED: LocalizedText = { en: "", tr: "" };
const today = () => new Date().toISOString().slice(0, 10);

function blankBundle(): OfferingBundle {
  return {
    id: "", slug: "", managerId: "", name: { ...EMPTY_LOCALIZED }, shortName: { ...EMPTY_LOCALIZED },
    summary: { ...EMPTY_LOCALIZED }, thesis: { ...EMPTY_LOCALIZED }, status: "coming-soon",
    strategyIds: [], assetClassIds: [], regionIds: [], shareClassIds: [], propertyIds: [], documentIds: [],
    featured: false, portfolioFacts: [], risks: [],
    complianceProfile: { issuerLegalType: "trust", isInvestmentFund: true, approvedOntarioExemptions: [], reviewOwner: "Licensed compliance review" },
    verifiedAt: today(),
    manager: { id: "", slug: "", name: { ...EMPTY_LOCALIZED }, headquarters: { city: "", province: "", country: "" }, description: { ...EMPTY_LOCALIZED } },
    shareClasses: [], properties: [], documents: [],
  } as OfferingBundle;
}

function sourced(value: string | number, classification: SourcedValue["classification"] = "target"): SourcedValue {
  return { value, classification, asOfDate: today(), sourceId: "admin", approval: "approved-public" };
}

export function OfferingContentManager({ offerings, backendConfigured }: { offerings: OfferingAdminRow[]; backendConfigured: boolean }) {
  const { lang } = useLang();
  const { currentUser } = usePortalAccess();
  const c = pick(COPY, lang);
  const canPublish = hasPlatformRole(currentUser, "master_admin");
  const rows = useMemo(() => offerings, [offerings]);

  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const [bundle, setBundle] = useState<OfferingBundle | null>(() => (rows[0] ? structuredClone(rows[0].bundle) : null));
  const [offeringId, setOfferingId] = useState<string | null>(rows[0]?.id ?? null);
  const [editLanguage, setEditLanguage] = useState<Lang>("en");
  const [state, setState] = useState<"idle" | "saving" | "error" | "saved">("idle");
  const [busy, setBusy] = useState(false);
  // Recomputed on every keystroke so the gap panel tracks the draft, not the
  // last save — the point is to see the profile close as you fill it.
  const completeness = useMemo(
    () => scoreOfferingCompleteness(bundle ?? blankBundle()),
    [bundle],
  );

  function load(row: OfferingAdminRow) {
    setSelectedId(row.id);
    setOfferingId(row.id);
    setBundle(structuredClone(row.bundle));
    setState("idle");
  }
  function startNew(from?: OfferingBundle) {
    setSelectedId(null);
    setOfferingId(null);
    setBundle(from ? { ...structuredClone(from), slug: "", id: "", name: { ...EMPTY_LOCALIZED } } : blankBundle());
    setState("idle");
  }

  function patch(next: Partial<OfferingBundle>) {
    setBundle((b) => (b ? { ...b, ...next } : b));
  }
  function patchLocalized(field: "name" | "shortName" | "summary" | "thesis", value: string) {
    setBundle((b) => (b ? { ...b, [field]: { ...(b[field] ?? EMPTY_LOCALIZED), [editLanguage]: value } } : b));
  }
  function patchLocalizedOpt(
    field: "riskProfile" | "managementFee" | "valuationFrequency" | "distributionFrequency" | "fundType" | "fundStatus",
    value: string,
  ) {
    setBundle((b) => (b ? { ...b, [field]: { ...((b[field] as LocalizedText) ?? EMPTY_LOCALIZED), [editLanguage]: value } } : b));
  }

  async function request(url: string, payload: unknown) {
    setState("saving");
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) { setState("error"); return null; }
    return response.json().catch(() => ({}));
  }

  async function save() {
    if (!bundle) return;
    const result = await request("/api/portal-offerings", { bundle });
    if (!result) return;
    if (typeof result.data === "string") setOfferingId(result.data);
    setState("saved");
  }
  async function publish() {
    if (!offeringId) return;
    const result = await request("/api/portal-offerings/publish", { offeringId });
    if (result) setState("saved");
  }

  /** Upload a file to Storage and return its {bucket,path}. */
  async function uploadAsset(file: File, folder: "media" | "docs", bucket: "offering-public" | "offering-private"): Promise<{ bucket: string; path: string } | null> {
    if (!bundle?.slug) { setState("error"); return null; }
    setBusy(true);
    try {
      const safe = file.name.replace(/[^\w.-]+/g, "-");
      const path = `${bundle.slug}/${folder}/${Date.now()}-${safe}`;
      const res = await fetch("/api/portal-offerings/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bucket, path }) });
      if (!res.ok) { setState("error"); return null; }
      const { signedUrl, path: storedPath } = await res.json();
      const put = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!put.ok) { setState("error"); return null; }
      return { bucket, path: storedPath ?? path };
    } finally {
      setBusy(false);
    }
  }

  async function uploadImageSlot(file: File, slot: "card" | "banner" | "logo") {
    const ref = await uploadAsset(file, "media", "offering-public");
    if (!ref) return;
    setBundle((b) => (b ? { ...b, media: { ...b.media, [slot]: { ...(b.media?.[slot] ?? {}), bucket: ref.bucket, path: ref.path } as ImageSlot } } : b));
  }
  async function uploadGallery(file: File) {
    const ref = await uploadAsset(file, "media", "offering-public");
    if (!ref) return;
    setBundle((b) => (b ? { ...b, media: { ...b.media, gallery: [...(b.media?.gallery ?? []), { bucket: ref.bucket, path: ref.path, kind: "photo" } as ImageSlot] } } : b));
  }
  async function uploadDoc(file: File, index: number) {
    const doc = bundle?.documents[index];
    if (!doc) return;
    const bucket = doc.visibility === "public" ? "offering-public" : "offering-private";
    const ref = await uploadAsset(file, "docs", bucket);
    if (!ref) return;
    setBundle((b) => (b ? { ...b, documents: b.documents.map((d, i) => (i === index ? { ...d, bucket: ref.bucket as OfferingDocument["bucket"], path: ref.path } : d)) } : b));
  }

  function updateShareClass(index: number, updater: (sc: ShareClass) => ShareClass) {
    setBundle((b) => (b ? { ...b, shareClasses: b.shareClasses.map((sc, i) => (i === index ? updater(sc) : sc)) } : b));
  }

  if (!backendConfigured) {
    return <section className="rounded-lg border border-[#d9e1e5] bg-white p-8"><ImagePlus className="size-8 text-[#7b919e]" /><h2 className="mt-4 text-xl font-semibold text-[#18384e]">{c.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#657681]">{c.backend}</p></section>;
  }

  return <section>
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-2xl font-semibold text-[#18384e]">{c.title}</h2><p className="mt-1 text-sm text-[#657681]">{c.description}</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => startNew()} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cbd6dc] bg-white px-3 text-sm font-semibold text-[#31566c]"><FilePlus2 className="size-4" />{c.newOffering}</button>
        {bundle && <button type="button" onClick={() => startNew(bundle)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cbd6dc] bg-white px-3 text-sm font-semibold text-[#31566c]">{c.duplicate}</button>}
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-[#d9e1e5] bg-white p-3">
        {!rows.length ? <p className="p-4 text-sm text-[#71808a]">{c.none}</p> : <div className="space-y-2">{rows.map((row) => <button key={row.id} type="button" onClick={() => load(row)} className={`w-full rounded-md border p-3 text-left ${selectedId === row.id ? "border-[#8aaabd] bg-[#eef4f7]" : "border-transparent hover:bg-[#f5f7f8]"}`}><p className="line-clamp-2 text-sm font-semibold text-[#294657]">{tx(row.bundle?.name, lang) || row.slug}</p><div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-[#78868f]"><span>{row.slug}</span><span>{row.status}</span></div></button>)}</div>}
      </aside>

      {bundle && <div className="space-y-6 rounded-lg border border-[#d9e1e5] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">{(["en", "tr"] as const).map((l) => <button key={l} type="button" onClick={() => setEditLanguage(l)} className={`rounded-md px-3 py-2 text-xs font-semibold ${editLanguage === l ? "bg-[#0a2d46] text-white" : "bg-[#edf2f4] text-[#526875]"}`}>{l === "en" ? c.english : c.turkish}</button>)}</div>
          {busy && <span className="text-xs font-medium text-[#0a4b72]">{c.uploading}</span>}
        </div>

        {/* Freshness + gaps: what period these figures describe, and what is
            still missing before the profile is publishable. */}
        <Group title={c.freshness}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.cadence}>
              <select value={bundle.updateCadence ?? "quarterly"} onChange={(e) => patch({ updateCadence: e.target.value as OfferingBundle["updateCadence"] })} className="field">
                {(["quarterly", "semi-annual", "annual", "ad-hoc"] as const).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label={c.dataAsOf}><input value={bundle.dataAsOf ?? ""} onChange={(e) => patch({ dataAsOf: e.target.value })} placeholder="2026-03-31" className="field" /></Field>
            <Field label={c.dataPeriodLabel}><input value={bundle.dataPeriodLabel ?? ""} onChange={(e) => patch({ dataPeriodLabel: e.target.value })} placeholder="Q1 2026" className="field" /></Field>
            <Field label={c.managerPublicUrl}><input value={bundle.managerPublicUrl ?? ""} onChange={(e) => patch({ managerPublicUrl: e.target.value })} className="field" /></Field>
          </div>
          <div className="mt-4 rounded-md border border-[#dfe5e8] bg-[#fafbfb] p-4">
            <p className="text-xs font-semibold text-[#5d707b]">
              {c.completeness}: <span className="text-[#234154]">{completeness.percent}%</span>
              {" · "}{completeness.filled}/{completeness.total}
            </p>
            {completeness.missingRequired.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-[#8a6d24]">
                <strong>{c.missingRequired}:</strong> {completeness.missingRequired.map((f) => tx(f.label, lang)).join(" · ")}
              </p>
            ) : (
              <p className="mt-2 text-xs font-semibold text-[#2f7d55]">{c.allRequired}</p>
            )}
            {completeness.missingRecommended.length > 0 && (
              <p className="mt-2 text-xs leading-5 text-[#71808a]">
                <strong>{c.missingRecommended}:</strong> {completeness.missingRecommended.map((f) => tx(f.label, lang)).join(" · ")}
              </p>
            )}
          </div>
        </Group>

        {/* Identity */}
        <Group title={c.identity}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.slug}><input value={bundle.slug} onChange={(e) => patch({ slug: e.target.value })} className="field" /></Field>
            <Field label={c.status}><select value={bundle.status} onChange={(e) => patch({ status: e.target.value as OfferingBundle["status"] })} className="field"><option value="available">available</option><option value="coming-soon">coming-soon</option><option value="paused">paused</option><option value="closed">closed</option></select></Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-medium text-[#42586a]"><input type="checkbox" checked={Boolean(bundle.featured)} onChange={(e) => patch({ featured: e.target.checked })} />{c.featured}</label>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label={c.name}><input value={bundle.name?.[editLanguage] ?? ""} onChange={(e) => patchLocalized("name", e.target.value)} className="field" /></Field>
            <Field label={c.shortName}><input value={bundle.shortName?.[editLanguage] ?? ""} onChange={(e) => patchLocalized("shortName", e.target.value)} className="field" /></Field>
          </div>
          <Field label={c.summary}><textarea value={bundle.summary?.[editLanguage] ?? ""} onChange={(e) => patchLocalized("summary", e.target.value)} rows={2} className="field mt-3 min-h-20 py-2" /></Field>
          <Field label={c.thesis}><textarea value={bundle.thesis?.[editLanguage] ?? ""} onChange={(e) => patchLocalized("thesis", e.target.value)} rows={5} className="field mt-3 min-h-32 py-2" /></Field>
        </Group>

        {/* Facts */}
        <Group title={c.facts}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.riskProfile}><input value={(bundle.riskProfile as LocalizedText)?.[editLanguage] ?? ""} onChange={(e) => patchLocalizedOpt("riskProfile", e.target.value)} className="field" /></Field>
            <Field label={c.managementFee}><input value={(bundle.managementFee as LocalizedText)?.[editLanguage] ?? ""} onChange={(e) => patchLocalizedOpt("managementFee", e.target.value)} className="field" /></Field>
            <Field label={c.valuationFrequency}><input value={(bundle.valuationFrequency as LocalizedText)?.[editLanguage] ?? ""} onChange={(e) => patchLocalizedOpt("valuationFrequency", e.target.value)} className="field" /></Field>
            <Field label={c.distributionFrequency}><input value={(bundle.distributionFrequency as LocalizedText)?.[editLanguage] ?? ""} onChange={(e) => patchLocalizedOpt("distributionFrequency", e.target.value)} className="field" /></Field>
            <Field label={c.fundType}><input value={(bundle.fundType as LocalizedText)?.[editLanguage] ?? ""} onChange={(e) => patchLocalizedOpt("fundType", e.target.value)} className="field" /></Field>
            <Field label={c.fundStatus}><input value={(bundle.fundStatus as LocalizedText)?.[editLanguage] ?? ""} onChange={(e) => patchLocalizedOpt("fundStatus", e.target.value)} className="field" /></Field>
            <Field label={c.inceptionDate}><input value={bundle.inceptionDate ?? ""} onChange={(e) => patch({ inceptionDate: e.target.value })} className="field" /></Field>
            <Field label={c.verifiedAt}><input value={bundle.verifiedAt ?? ""} onChange={(e) => patch({ verifiedAt: e.target.value })} className="field" /></Field>
            <Field label={c.aum}><input value={String(bundle.aum?.value ?? "")} onChange={(e) => patch({ aum: { ...(bundle.aum ?? sourced("", "current")), value: e.target.value } })} className="field" /></Field>
          </div>
        </Group>

        {/* Highlights + Risks */}
        <Group title={c.highlights}>
          <LocalizedList items={bundle.highlights ?? []} lang={editLanguage} addLabel={c.add} removeLabel={c.remove}
            onChange={(items) => patch({ highlights: items })} />
        </Group>
        <Group title={c.risks}>
          <RiskList items={bundle.risks ?? []} lang={editLanguage} addLabel={c.add} removeLabel={c.remove}
            onChange={(items) => patch({ risks: items })} />
        </Group>

        {/* Trailing returns */}
        <Group title={c.returns}>
          <div className="space-y-2">
            {(bundle.trailingReturns ?? []).map((r, i) => <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input placeholder={c.period} value={r.period?.[editLanguage] ?? ""} onChange={(e) => patch({ trailingReturns: (bundle.trailingReturns ?? []).map((x, xi) => xi === i ? { ...x, period: { ...(x.period ?? EMPTY_LOCALIZED), [editLanguage]: e.target.value } } : x) })} className="field" />
              <input placeholder={c.value} value={r.value ?? ""} onChange={(e) => patch({ trailingReturns: (bundle.trailingReturns ?? []).map((x, xi) => xi === i ? { ...x, value: e.target.value } : x) })} className="field" />
              <IconButton onClick={() => patch({ trailingReturns: (bundle.trailingReturns ?? []).filter((_, xi) => xi !== i) })}><Trash2 className="size-4" /></IconButton>
            </div>)}
            <AddButton label={c.add} onClick={() => patch({ trailingReturns: [...(bundle.trailingReturns ?? []), { period: { ...EMPTY_LOCALIZED }, value: "" }] })} />
          </div>
        </Group>

        {/* Share classes */}
        <Group title={c.shareClasses}>
          <div className="space-y-4">
            {bundle.shareClasses.map((sc, i) => <div key={sc.id || i} className="rounded-md border border-[#dfe5e8] bg-[#fafbfb] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={c.scName}><input value={sc.name ?? ""} onChange={(e) => updateShareClass(i, (s) => ({ ...s, name: e.target.value }))} className="field" /></Field>
                <Field label={c.accounts}><input value={(sc.registeredAccountTypes ?? []).join(", ")} onChange={(e) => updateShareClass(i, (s) => ({ ...s, registeredAccountTypes: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))} className="field" /></Field>
                <Field label={c.targetReturn}><input value={String(sc.targetReturn?.value ?? "")} onChange={(e) => updateShareClass(i, (s) => ({ ...s, targetReturn: { ...(s.targetReturn ?? sourced("")), value: e.target.value } }))} className="field" /></Field>
                <Field label={c.targetDistribution}><input value={String(sc.targetDistribution?.value ?? "")} onChange={(e) => updateShareClass(i, (s) => ({ ...s, targetDistribution: { ...(s.targetDistribution ?? sourced("")), value: e.target.value } }))} className="field" /></Field>
                <Field label={c.minimum}><input value={String(sc.minimumInvestment?.value ?? "")} onChange={(e) => updateShareClass(i, (s) => ({ ...s, minimumInvestment: { ...(s.minimumInvestment ?? sourced(0, "current")), value: Number(e.target.value) || 0 } }))} className="field" /></Field>
                <Field label={c.term}><input value={String(sc.term?.value ?? "")} onChange={(e) => updateShareClass(i, (s) => ({ ...s, term: { ...(s.term ?? sourced("", "current")), value: e.target.value } }))} className="field" /></Field>
              </div>
              <div className="mt-2 flex justify-end"><IconButton onClick={() => patch({ shareClasses: bundle.shareClasses.filter((_, xi) => xi !== i) })}><Trash2 className="size-4" /></IconButton></div>
            </div>)}
            <AddButton label={c.add} onClick={() => patch({ shareClasses: [...bundle.shareClasses, { id: `class-${bundle.shareClasses.length + 1}`, offeringId: bundle.id, name: "", registeredAccountTypes: [] } as ShareClass] })} />
          </div>
        </Group>

        {/* Service providers */}
        <Group title={c.providers}>
          {(["auditor", "legalCounsel", "appraiser"] as const).map((role) => <div key={role} className="mb-2 grid grid-cols-[110px_1fr_1fr] items-center gap-2">
            <span className="text-xs font-semibold text-[#5d707b]">{role === "auditor" ? c.auditor : role === "legalCounsel" ? c.legal : c.appraiser}</span>
            <input placeholder={c.providerName} value={bundle.serviceProviders?.[role]?.name ?? ""} onChange={(e) => patch({ serviceProviders: { ...bundle.serviceProviders, [role]: { ...(bundle.serviceProviders?.[role] ?? { name: "" }), name: e.target.value } } })} className="field" />
            <input placeholder={c.url} value={bundle.serviceProviders?.[role]?.url ?? ""} onChange={(e) => patch({ serviceProviders: { ...bundle.serviceProviders, [role]: { ...(bundle.serviceProviders?.[role] ?? { name: "" }), name: bundle.serviceProviders?.[role]?.name ?? "", url: e.target.value } } })} className="field" />
          </div>)}
        </Group>

        {/* Media */}
        <Group title={c.media}>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["card", "banner", "logo"] as const).map((slot) => <div key={slot}>
              <p className="mb-1.5 text-xs font-semibold text-[#5d707b]">{slot === "card" ? c.card : slot === "banner" ? c.banner : c.logo}</p>
              <p className="mb-2 truncate text-[11px] text-[#8b98a1]">{bundle.media?.[slot]?.path ?? bundle.media?.[slot]?.src ?? "—"}</p>
              <UploadButton label={c.upload} accept="image/*" onFile={(f) => uploadImageSlot(f, slot)} />
            </div>)}
          </div>
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold text-[#5d707b]">{c.gallery}</p>
            <div className="mb-2 flex flex-wrap gap-2">{(bundle.media?.gallery ?? []).map((g, i) => <span key={i} className="inline-flex items-center gap-1 rounded bg-[#eef2f4] px-2 py-1 text-[11px] text-[#516471]">{(g.path ?? g.src ?? "").split("/").pop()}<button type="button" aria-label={c.remove} onClick={() => patch({ media: { ...bundle.media, gallery: (bundle.media?.gallery ?? []).filter((_, xi) => xi !== i) } })}><Trash2 className="size-3" /></button></span>)}</div>
            <UploadButton label={c.upload} accept="image/*" onFile={uploadGallery} />
          </div>
        </Group>

        {/* Documents */}
        <Group title={c.documents}>
          <div className="space-y-4">
            {bundle.documents.map((doc, i) => <div key={doc.id || i} className="rounded-md border border-[#dfe5e8] bg-[#fafbfb] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={c.docTitle}><input value={doc.title?.[editLanguage] ?? ""} onChange={(e) => patch({ documents: bundle.documents.map((d, di) => di === i ? { ...d, title: { ...(d.title ?? EMPTY_LOCALIZED), [editLanguage]: e.target.value } } : d) })} className="field" /></Field>
                <Field label={c.type}><select value={doc.type} onChange={(e) => patch({ documents: bundle.documents.map((d, di) => di === i ? { ...d, type: e.target.value as OfferingDocument["type"] } : d) })} className="field">{["fact-sheet", "presentation", "offering-memorandum", "term-sheet", "subscription-agreement", "report"].map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                <Field label={c.visibility}><select value={doc.visibility} onChange={(e) => patch({ documents: bundle.documents.map((d, di) => di === i ? { ...d, visibility: e.target.value as OfferingDocument["visibility"] } : d) })} className="field">{["public", "approved-investor", "private"].map((v) => <option key={v} value={v}>{v}</option>)}</select></Field>
                <Field label={c.version}><input value={doc.version ?? ""} onChange={(e) => patch({ documents: bundle.documents.map((d, di) => di === i ? { ...d, version: e.target.value } : d) })} className="field" /></Field>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="truncate text-[11px] text-[#8b98a1]">{doc.path ?? doc.href ?? "—"}</span>
                <div className="flex gap-2"><UploadButton label={c.upload} accept="application/pdf" onFile={(f) => uploadDoc(f, i)} /><IconButton onClick={() => patch({ documents: bundle.documents.filter((_, di) => di !== i) })}><Trash2 className="size-4" /></IconButton></div>
              </div>
            </div>)}
            <AddButton label={c.add} onClick={() => patch({ documents: [...bundle.documents, { id: `doc-${bundle.documents.length + 1}`, offeringId: bundle.id, title: { ...EMPTY_LOCALIZED }, type: "fact-sheet", effectiveDate: today(), version: "1", visibility: "public" } as OfferingDocument] })} />
          </div>
        </Group>

        {state === "error" && <p role="alert" className="text-sm font-semibold text-[#a24d43]">{c.error}</p>}
        {state === "saved" && <p className="text-sm font-semibold text-[#2f7d55]">{c.saved}</p>}
        {!offeringId && <p className="text-xs text-[#8a6d24]">{c.publishHint}</p>}
        <div className="flex flex-wrap gap-2 border-t border-[#e4e9ec] pt-5">
          <Action icon={Save} label={c.save} disabled={state === "saving" || busy} onClick={save} />
          {canPublish && <Action icon={Send} label={c.publish} disabled={!offeringId || state === "saving" || busy} onClick={publish} />}
        </div>
      </div>}
    </div>
    <style jsx>{`.field{height:2.75rem;width:100%;border-radius:.375rem;border:1px solid #cfd9df;background:white;padding:0 .75rem;font-size:.875rem;color:#263f4f;outline:none}.field:focus{border-color:#0a4b72;box-shadow:0 0 0 2px rgba(10,75,114,.12)}textarea.field{height:auto}`}</style>
  </section>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border-t border-[#e8edef] pt-5 first:border-t-0 first:pt-0"><h3 className="mb-3 font-semibold text-[#234154]">{title}</h3>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[#5d707b]"><span className="mb-1.5 block">{label}</span>{children}</label>;
}
function Action({ icon: Icon, label, disabled, onClick }: { icon: typeof Save; label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-45"><Icon className="size-4" />{label}</button>;
}
function IconButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="grid size-10 shrink-0 place-items-center rounded-md border border-[#e1c8c4] text-[#a24d43]">{children}</button>;
}
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4b72]"><Plus className="size-3.5" />{label}</button>;
}
function UploadButton({ label, accept, onFile }: { label: string; accept: string; onFile: (file: File) => void }) {
  return <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#cbd6dc] bg-white px-3 text-xs font-semibold text-[#31566c]"><Upload className="size-3.5" />{label}<input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></label>;
}
/**
 * Risks carry a category because fund documents group them that way (Lankin's
 * March 2026 deck breaks them into six). Legacy rows are plain LocalizedText, so
 * every read normalises through `riskText` and every write emits the object
 * form; `app.apply_offering_bundle` accepts both.
 */
function RiskList({ items, lang, addLabel, removeLabel, onChange }: { items: RiskEntry[]; lang: Lang; addLabel: string; removeLabel: string; onChange: (items: RiskEntry[]) => void }) {
  const categories: RiskCategory[] = ["investment", "regulatory", "leverage", "business", "redemption", "tax", "other"];
  const update = (index: number, next: Partial<{ text: LocalizedText; category: RiskCategory }>) =>
    onChange(items.map((item, i) => {
      if (i !== index) return item;
      const current = { text: riskText(item), category: "category" in item ? item.category : undefined };
      return { ...current, ...next };
    }));
  return <div className="space-y-2">
    {items.map((item, i) => <div key={i} className="grid grid-cols-[1fr_150px_auto] gap-2">
      <input value={riskText(item)[lang] ?? ""} onChange={(e) => update(i, { text: { ...riskText(item), [lang]: e.target.value } })} className="field" />
      <select value={("category" in item && item.category) || "other"} onChange={(e) => update(i, { category: e.target.value as RiskCategory })} className="field">
        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <IconButton onClick={() => onChange(items.filter((_, xi) => xi !== i))}><Trash2 className="size-4" /></IconButton>
    </div>)}
    <AddButton label={addLabel} onClick={() => onChange([...items, { text: { en: "", tr: "" }, category: "other" }])} />
    <span className="sr-only">{removeLabel}</span>
  </div>;
}

function LocalizedList({ items, lang, addLabel, removeLabel, onChange }: { items: LocalizedText[]; lang: Lang; addLabel: string; removeLabel: string; onChange: (items: LocalizedText[]) => void }) {
  return <div className="space-y-2">
    {items.map((item, i) => <div key={i} className="flex gap-2">
      <input value={item?.[lang] ?? ""} onChange={(e) => onChange(items.map((x, xi) => xi === i ? { ...x, [lang]: e.target.value } : x))} className="field" />
      <IconButton onClick={() => onChange(items.filter((_, xi) => xi !== i))}><Trash2 className="size-4" /></IconButton>
    </div>)}
    <AddButton label={addLabel} onClick={() => onChange([...items, { en: "", tr: "" }])} />
    <span className="sr-only">{removeLabel}</span>
  </div>;
}
