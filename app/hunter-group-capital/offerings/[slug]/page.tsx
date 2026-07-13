import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getOfferingBySlug } from "@/lib/capital/repository";
import { OfferingDetail } from "./OfferingDetail";

export const dynamic = "force-dynamic";

export default async function OfferingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offering = getOfferingBySlug(slug);
  if (!offering) notFound();
  return (
    <Suspense>
      <OfferingDetail offering={offering} />
    </Suspense>
  );
}
