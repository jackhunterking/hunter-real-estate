"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, FilePlus2, Plus, RefreshCw, Save, Send, Trash2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FLAGSHIP_LEARNING_RESOURCE, type LearningAdminResource, type LearningResourceSource } from "@/lib/capital/learning";
import { hasPlatformRole } from "@/lib/capital/portal-access";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick, tx } from "@/lib/i18n/localize";
import { usePortalAccess } from "./PortalAccessProvider";

type Draft = {
  resourceId?: string;
  versionId?: string;
  status: LearningAdminResource["status"];
  version: number;
  authorId?: string;
  slug: string;
  categoryKey: "investment-fundamentals";
  title: { en: string; tr: string };
  summary: { en: string; tr: string };
  bodyMarkdown: { en: string; tr: string };
  disclaimer: { en: string; tr: string };
  sources: Array<Omit<LearningResourceSource, "id"> & { id?: string }>;
  reviewNotes?: string;
};

const COPY = {
  en: { title: "Learning content", description: "Create bilingual, sourced guides and move them through review before publication.", backend: "Connect the Supabase backend to create and publish controlled content.", newGuide: "New guide", flagship: "Import flagship draft", noContent: "No learning content has been created.", english: "English", turkish: "Turkish", slug: "Slug", category: "Category", guideTitle: "Title", summary: "Summary", body: "Markdown body", disclaimer: "Disclaimer", sources: "Sources", addSource: "Add source", sourceTitle: "Source title", publisher: "Publisher", url: "HTTPS URL", publishedOn: "Published date", accessedAt: "Accessed date", notes: "Notes", preview: "Preview", save: "Save draft", submit: "Submit for review", request: "Request changes", approve: "Approve", publish: "Publish", withdraw: "Withdraw", revision: "Create new version", reviewNote: "Required review note", saved: "Saved", error: "The content update was not completed.", version: "Version", authorApproval: "The author cannot approve this version." },
  tr: { title: "Bilgi içeriği", description: "İki dilli ve kaynaklı rehberler oluşturun; yayımdan önce inceleme sürecinden geçirin.", backend: "Kontrollü içerik oluşturmak ve yayımlamak için Supabase altyapısını bağlayın.", newGuide: "Yeni rehber", flagship: "Ana rehberi taslak olarak aktar", noContent: "Henüz bilgi içeriği oluşturulmadı.", english: "İngilizce", turkish: "Türkçe", slug: "Kısa bağlantı", category: "Kategori", guideTitle: "Başlık", summary: "Özet", body: "Markdown içerik", disclaimer: "Uyarı", sources: "Kaynaklar", addSource: "Kaynak ekle", sourceTitle: "Kaynak başlığı", publisher: "Yayıncı", url: "HTTPS adresi", publishedOn: "Yayın tarihi", accessedAt: "Erişim tarihi", notes: "Notlar", preview: "Önizleme", save: "Taslağı kaydet", submit: "İncelemeye gönder", request: "Değişiklik iste", approve: "Onayla", publish: "Yayımla", withdraw: "Yayından kaldır", revision: "Yeni sürüm oluştur", reviewNote: "Zorunlu inceleme notu", saved: "Kaydedildi", error: "İçerik güncellemesi tamamlanamadı.", version: "Sürüm", authorApproval: "Yazar bu sürümü onaylayamaz." },
} as const;

const EMPTY_SOURCE = (): Draft["sources"][number] => ({ title: "", url: "https://", publisher: "", publishedOn: "", accessedAt: new Date().toISOString().slice(0, 10), notes: "", sortOrder: 0 });

function blankDraft(): Draft {
  return {
    status: "draft",
    version: 1,
    slug: "",
    categoryKey: "investment-fundamentals",
    title: { en: "", tr: "" },
    summary: { en: "", tr: "" },
    bodyMarkdown: { en: "", tr: "" },
    disclaimer: {
      en: "Educational information only. This guide is not investment, legal, tax or suitability advice.",
      tr: "Yalnızca eğitim amaçlı bilgidir. Bu rehber yatırım, hukuk, vergi veya uygunluk tavsiyesi değildir.",
    },
    sources: [EMPTY_SOURCE()],
  };
}

function fromResource(resource: LearningAdminResource): Draft {
  return {
    resourceId: resource.resourceId,
    versionId: resource.id,
    status: resource.status,
    version: resource.version,
    authorId: resource.authorId,
    slug: resource.slug,
    categoryKey: "investment-fundamentals",
    title: { ...resource.title },
    summary: { ...resource.summary },
    bodyMarkdown: { ...resource.bodyMarkdown },
    disclaimer: { ...resource.disclaimer },
    sources: resource.sources.map((source) => ({ ...source })),
    reviewNotes: resource.reviewNotes,
  };
}

function flagshipDraft(): Draft {
  return {
    ...blankDraft(),
    slug: FLAGSHIP_LEARNING_RESOURCE.slug,
    title: { ...FLAGSHIP_LEARNING_RESOURCE.title },
    summary: { ...FLAGSHIP_LEARNING_RESOURCE.summary },
    bodyMarkdown: { ...FLAGSHIP_LEARNING_RESOURCE.bodyMarkdown },
    disclaimer: { ...FLAGSHIP_LEARNING_RESOURCE.disclaimer },
    sources: FLAGSHIP_LEARNING_RESOURCE.sources.map((source) => ({
      title: source.title,
      url: source.url,
      publisher: source.publisher,
      publishedOn: source.publishedOn,
      accessedAt: source.accessedAt,
      notes: source.notes,
      sortOrder: source.sortOrder,
    })),
  };
}

function apiBody(draft: Draft) {
  return {
    slug: draft.slug,
    resourceType: "guide",
    categoryKey: draft.categoryKey,
    audience: "investor_and_professional",
    title: draft.title,
    summary: draft.summary,
    bodyMarkdown: draft.bodyMarkdown,
    disclaimer: draft.disclaimer,
    sources: draft.sources.map((source, index) => ({ ...source, id: undefined, sortOrder: index })),
  };
}

export function LearningContentManager({ resources, backendConfigured }: { resources: LearningAdminResource[]; backendConfigured: boolean }) {
  const { lang } = useLang();
  const { currentUser } = usePortalAccess();
  const c = pick(COPY, lang);
  const [draft, setDraft] = useState<Draft | null>(() => resources[0] ? fromResource(resources[0]) : null);
  const [editLanguage, setEditLanguage] = useState<"en" | "tr">("en");
  const [preview, setPreview] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const canReview = hasPlatformRole(currentUser, "platform_admin", "compliance_admin");
  const isAuthor = draft?.authorId === currentUser.id;
  const versions = useMemo(() => [...resources].sort((a, b) => b.version - a.version), [resources]);

  async function request(url: string, method: "POST" | "PATCH", body: unknown) {
    setStatus("saving");
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { setStatus("error"); return; }
    window.location.reload();
  }

  async function save() {
    if (!draft) return;
    const url = draft.resourceId && draft.versionId
      ? `/api/hnc-learning-resources/${draft.resourceId}/versions/${draft.versionId}`
      : "/api/hnc-learning-resources";
    await request(url, draft.resourceId ? "PATCH" : "POST", apiBody(draft));
  }

  async function transition(action: "submit" | "request_changes" | "approve" | "publish" | "withdraw" | "new_version") {
    if (!draft?.resourceId || !draft.versionId) return;
    await request(`/api/hnc-learning-resources/${draft.resourceId}/versions/${draft.versionId}/transition`, "POST", { action, note: reviewNote || undefined });
  }

  function localized(field: "title" | "summary" | "bodyMarkdown" | "disclaimer", value: string) {
    if (!draft) return;
    setDraft({ ...draft, [field]: { ...draft[field], [editLanguage]: value } });
  }

  function updateSource(index: number, field: keyof Draft["sources"][number], value: string) {
    if (!draft) return;
    setDraft({ ...draft, sources: draft.sources.map((source, sourceIndex) => sourceIndex === index ? { ...source, [field]: value } : source) });
  }

  if (!backendConfigured) return <section className="rounded-lg border border-[#d9e1e5] bg-white p-8"><BookOpen className="size-8 text-[#7b919e]" /><h2 className="mt-4 text-xl font-semibold text-[#18384e]">{c.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#657681]">{c.backend}</p></section>;

  return <section>
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold text-[#18384e]">{c.title}</h2><p className="mt-1 text-sm text-[#657681]">{c.description}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setDraft(blankDraft())} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cbd6dc] bg-white px-3 text-sm font-semibold text-[#31566c]"><FilePlus2 className="size-4" />{c.newGuide}</button>{!resources.some((item) => item.slug === FLAGSHIP_LEARNING_RESOURCE.slug) && <button type="button" onClick={() => setDraft(flagshipDraft())} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-3 text-sm font-semibold text-white"><BookOpen className="size-4" />{c.flagship}</button>}</div></div>

    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-[#d9e1e5] bg-white p-3">
        {!versions.length ? <p className="p-4 text-sm text-[#71808a]">{c.noContent}</p> : <div className="space-y-2">{versions.map((item) => <button key={item.id} type="button" onClick={() => setDraft(fromResource(item))} className={`w-full rounded-md border p-3 text-left ${draft?.versionId === item.id ? "border-[#8aaabd] bg-[#eef4f7]" : "border-transparent hover:bg-[#f5f7f8]"}`}><p className="line-clamp-2 text-sm font-semibold text-[#294657]">{tx(item.title, lang) || item.slug}</p><div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-[#78868f]"><span>{c.version} {item.version}</span><span>{item.status}</span></div></button>)}</div>}
      </aside>

      {draft && <div className="rounded-lg border border-[#d9e1e5] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2">{(["en", "tr"] as const).map((language) => <button key={language} type="button" onClick={() => setEditLanguage(language)} className={`rounded-md px-3 py-2 text-xs font-semibold ${editLanguage === language ? "bg-[#0a2d46] text-white" : "bg-[#edf2f4] text-[#526875]"}`}>{language === "en" ? c.english : c.turkish}</button>)}</div><span className="rounded-full bg-[#eef2f4] px-3 py-1 text-xs font-semibold text-[#526875]">{draft.status}</span></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label={c.slug}><input value={draft.slug} disabled={draft.status !== "draft"} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} className="field" /></Field><Field label={c.category}><select value={draft.categoryKey} disabled className="field"><option value="investment-fundamentals">Investment fundamentals</option></select></Field></div>
        <div className="mt-4 space-y-4"><Field label={c.guideTitle}><input value={draft.title[editLanguage]} disabled={draft.status !== "draft"} onChange={(event) => localized("title", event.target.value)} className="field" /></Field><Field label={c.summary}><textarea value={draft.summary[editLanguage]} disabled={draft.status !== "draft"} onChange={(event) => localized("summary", event.target.value)} rows={3} className="field min-h-24 py-3" /></Field><Field label={c.body}><textarea value={draft.bodyMarkdown[editLanguage]} disabled={draft.status !== "draft"} onChange={(event) => localized("bodyMarkdown", event.target.value)} rows={20} className="field min-h-[420px] py-3 font-mono text-xs leading-5" /></Field><Field label={c.disclaimer}><textarea value={draft.disclaimer[editLanguage]} disabled={draft.status !== "draft"} onChange={(event) => localized("disclaimer", event.target.value)} rows={3} className="field min-h-24 py-3" /></Field></div>

        <div className="mt-7 border-t border-[#e4e9ec] pt-6"><div className="flex items-center justify-between"><h3 className="font-semibold text-[#234154]">{c.sources}</h3>{draft.status === "draft" && <button type="button" onClick={() => setDraft({ ...draft, sources: [...draft.sources, { ...EMPTY_SOURCE(), sortOrder: draft.sources.length }] })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4b72]"><Plus className="size-3.5" />{c.addSource}</button>}</div><div className="mt-4 space-y-4">{draft.sources.map((source, index) => <div key={source.id ?? index} className="rounded-md border border-[#dfe5e8] bg-[#fafbfb] p-4"><div className="grid gap-3 sm:grid-cols-2"><Field label={c.sourceTitle}><input disabled={draft.status !== "draft"} value={source.title} onChange={(event) => updateSource(index, "title", event.target.value)} className="field" /></Field><Field label={c.publisher}><input disabled={draft.status !== "draft"} value={source.publisher} onChange={(event) => updateSource(index, "publisher", event.target.value)} className="field" /></Field><Field label={c.url}><input disabled={draft.status !== "draft"} value={source.url} onChange={(event) => updateSource(index, "url", event.target.value)} className="field" /></Field><div className="grid grid-cols-2 gap-2"><Field label={c.publishedOn}><input type="date" disabled={draft.status !== "draft"} value={source.publishedOn ?? ""} onChange={(event) => updateSource(index, "publishedOn", event.target.value)} className="field" /></Field><Field label={c.accessedAt}><input type="date" disabled={draft.status !== "draft"} value={source.accessedAt} onChange={(event) => updateSource(index, "accessedAt", event.target.value)} className="field" /></Field></div></div><div className="mt-3 flex gap-2"><input disabled={draft.status !== "draft"} value={source.notes ?? ""} onChange={(event) => updateSource(index, "notes", event.target.value)} placeholder={c.notes} className="field flex-1" />{draft.status === "draft" && draft.sources.length > 1 && <button type="button" aria-label="Remove source" onClick={() => setDraft({ ...draft, sources: draft.sources.filter((_, sourceIndex) => sourceIndex !== index) })} className="grid size-10 shrink-0 place-items-center rounded-md border border-[#e1c8c4] text-[#a24d43]"><Trash2 className="size-4" /></button>}</div></div>)}</div></div>

        <button type="button" onClick={() => setPreview((value) => !value)} className="mt-6 text-xs font-semibold text-[#0a4b72]">{c.preview}</button>
        {preview && <div className="mt-3 max-h-[520px] overflow-y-auto rounded-md border border-[#dce4e8] p-6 text-sm leading-7 text-[#344d5b]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.bodyMarkdown[editLanguage]}</ReactMarkdown></div>}
        {draft.reviewNotes && <p className="mt-5 rounded-md border border-[#ead7ad] bg-[#fbf7eb] p-3 text-xs text-[#735e2a]">{draft.reviewNotes}</p>}
        {draft.status === "in_review" && <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={c.reviewNote} className="field mt-5 min-h-20 py-3" />}
        {status === "error" && <p role="alert" className="mt-4 text-sm font-semibold text-[#a24d43]">{c.error}</p>}
        {isAuthor && draft.status === "in_review" && <p className="mt-4 text-xs text-[#8a6d24]">{c.authorApproval}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          {draft.status === "draft" && <><Action icon={Save} label={c.save} disabled={status === "saving"} onClick={save} /><Action icon={Send} label={c.submit} disabled={!draft.resourceId || status === "saving"} onClick={() => transition("submit")} /></>}
          {draft.status === "in_review" && canReview && <><Action icon={XCircle} label={c.request} disabled={!reviewNote.trim() || status === "saving"} onClick={() => transition("request_changes")} /><Action icon={CheckCircle2} label={c.approve} disabled={isAuthor || status === "saving"} onClick={() => transition("approve")} /></>}
          {draft.status === "approved" && canReview && <Action icon={Send} label={c.publish} disabled={status === "saving"} onClick={() => transition("publish")} />}
          {draft.status === "published" && canReview && <><Action icon={RefreshCw} label={c.revision} disabled={status === "saving"} onClick={() => transition("new_version")} /><Action icon={XCircle} label={c.withdraw} disabled={status === "saving"} onClick={() => transition("withdraw")} /></>}
        </div>
      </div>}
    </div>
    <style jsx>{`.field{height:2.75rem;width:100%;border-radius:.375rem;border:1px solid #cfd9df;background:white;padding:0 .75rem;font-size:.875rem;color:#263f4f;outline:none}.field:focus{border-color:#0a4b72;box-shadow:0 0 0 2px rgba(10,75,114,.12)}.field:disabled{background:#f3f5f6;color:#6f7c84}`}</style>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-[#5d707b]"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Action({ icon: Icon, label, disabled, onClick }: { icon: typeof Save; label: string; disabled: boolean; onClick: () => void }) { return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a2d46] px-4 text-sm font-semibold text-white disabled:opacity-45"><Icon className="size-4" />{label}</button>; }
