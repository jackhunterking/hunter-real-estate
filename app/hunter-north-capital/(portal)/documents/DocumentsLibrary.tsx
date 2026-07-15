"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, FileText, Search } from "lucide-react";
import type { OfferingBundle } from "@/lib/capital/types";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { PageHeader, Panel, shortDate } from "@/components/capital/north/PortalUI";

const COPY = {
  tr: { eyebrow:"Kurumsal kaynaklar",title:"Belgeler",desc:"Fon bilgi formlarını, raporları ve talep üzerine sunulan inceleme materyallerini tek kütüphanede görüntüleyin.",search:"Belge veya fon ara",allProducts:"Tüm fonlar",allTypes:"Tüm belge türleri",document:"Belge",product:"Fon",type:"Tür",date:"Geçerlilik",language:"Dil",access:"Erişim",action:"İşlem",public:"Kamuya açık",request:"Talep üzerine",view:"Görüntüle",unavailable:"Partner incelemesinde",count:"belge",empty:"Eşleşen belge bulunamadı." },
  en: { eyebrow:"Institutional resources",title:"Documents",desc:"Review fund fact sheets, reports, and request-only diligence materials in one library.",search:"Search document or fund",allProducts:"All funds",allTypes:"All document types",document:"Document",product:"Fund",type:"Type",date:"Effective",language:"Language",access:"Access",action:"Action",public:"Public",request:"On request",view:"View",unavailable:"Partner review",count:"documents",empty:"No documents match." },
} as const;

export function DocumentsLibrary({ offerings }: { offerings: OfferingBundle[] }) {
  const { lang, t } = useLang();
  const c = COPY[lang];
  const [query,setQuery] = useState("");
  const [product,setProduct] = useState("all");
  const [type,setType] = useState("all");
  const rows = useMemo(() => offerings.flatMap((offering) => offering.documents.map((document) => ({offering,document}))).filter(({offering,document}) => {
    const q=query.trim().toLocaleLowerCase(lang === "tr" ? "tr" : "en");
    const text=`${document.title[lang]} ${offering.shortName[lang]}`.toLocaleLowerCase(lang === "tr" ? "tr" : "en");
    return (!q || text.includes(q)) && (product === "all" || offering.id === product) && (type === "all" || document.type === type);
  }).sort((a,b) => b.document.effectiveDate.localeCompare(a.document.effectiveDate)),[lang,offerings,product,query,type]);
  const types=Array.from(new Set(offerings.flatMap((offering) => offering.documents.map((document) => document.type))));
  const labels=t.capitalApp.documents.types as Record<string,string>;
  return <div><PageHeader eyebrow={c.eyebrow} title={c.title} description={c.desc} /><div className="mb-4 grid gap-3 rounded-md border border-[#dfe4e9] bg-white p-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto] md:items-center"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b858e]"/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder={c.search} className="h-10 w-full rounded-md border border-[#d6dde2] pl-9 pr-3 text-sm outline-none focus:border-[#0a4b72]"/></label><select value={product} onChange={(event)=>setProduct(event.target.value)} className="h-10 rounded-md border border-[#d6dde2] bg-white px-3 text-sm"><option value="all">{c.allProducts}</option>{offerings.map((offering)=><option key={offering.id} value={offering.id}>{offering.shortName[lang]}</option>)}</select><select value={type} onChange={(event)=>setType(event.target.value)} className="h-10 rounded-md border border-[#d6dde2] bg-white px-3 text-sm"><option value="all">{c.allTypes}</option>{types.map((item)=><option key={item} value={item}>{labels[item] ?? item}</option>)}</select><span className="px-2 text-xs font-semibold text-[#6d7881]">{rows.length} {c.count}</span></div><Panel className="overflow-hidden">{rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f6f8f9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#73808a]"><tr>{[c.document,c.product,c.type,c.date,c.language,c.access,c.action].map((item)=><th key={item} className="border-b border-[#e2e6e9] px-5 py-3">{item}</th>)}</tr></thead><tbody>{rows.map(({offering,document})=><tr key={document.id} className="border-b border-[#edf0f2] last:border-0 hover:bg-[#fafbfc]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-[#eef2f5] text-[#0a2d46]"><FileText className="size-4"/></span><div><p className="font-semibold text-[#293d49]">{document.title[lang]}</p><p className="mt-1 text-[10px] text-[#7d8790]">v{document.version}</p></div></div></td><td className="px-5 py-4 text-[#63717c]">{offering.shortName[lang]}</td><td className="px-5 py-4 text-[#63717c]">{labels[document.type] ?? document.type}</td><td className="px-5 py-4 text-[#63717c]">{shortDate(document.effectiveDate,lang)}</td><td className="px-5 py-4 text-[#63717c]">TR / EN</td><td className="px-5 py-4"><span className={`rounded px-2 py-1 text-[10px] font-bold ${document.visibility === "public" ? "bg-[#e8f2ec] text-[#2e6849]" : "bg-[#f0f2f4] text-[#65717a]"}`}>{document.visibility === "public" ? c.public : c.request}</span></td><td className="px-5 py-4">{document.href ? <a href={document.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4b72] hover:underline">{c.view}<ArrowUpRight className="size-3.5"/></a> : <span className="text-xs text-[#879099]">{c.unavailable}</span>}</td></tr>)}</tbody></table></div> : <div className="p-12 text-center text-sm text-[#74808a]">{c.empty}</div>}</Panel></div>;
}
