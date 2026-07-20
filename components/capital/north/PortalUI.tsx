import type { ReactNode } from "react";
import type { Lang } from "@/lib/capital/types";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 border-b border-[#dfe4e9] pb-6 md:flex-row md:items-end">
      <div className="min-w-0">
        <h1 className="font-serif text-3xl font-semibold text-[#102638] sm:text-[2.25rem]">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65717e]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-[#172a39]">{title}</h2>
        {meta && <p className="mt-1 text-xs text-[#76818b]">{meta}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-md border border-[#dfe4e9] bg-white ${className}`}>{children}</section>;
}

export function money(value: number, lang: Lang, currency = "CAD") {
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortDate(value: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}
