"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { OfferingCard } from "@/components/capital/OfferingCard";
import type { OfferingBundle } from "@/lib/capital/types";

export function Dashboard({ offerings }: { offerings: OfferingBundle[] }) {
  const { t } = useLang();
  const d = t.capitalApp.dashboard;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {d.eyebrow}
        </h1>
      </header>

      {offerings.length ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {offerings.map((o) => (
            <OfferingCard key={o.id} offering={o} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">{d.empty}</p>
      )}
    </div>
  );
}
