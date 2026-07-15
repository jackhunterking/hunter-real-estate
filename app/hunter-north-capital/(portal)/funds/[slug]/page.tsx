import { notFound } from "next/navigation";
import { getOfferingBySlug } from "@/lib/capital/repository";
import { ProductDetailView } from "../../products/[slug]/ProductDetailView";

export const dynamic = "force-dynamic";

export default async function HunterNorthFundDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offering = getOfferingBySlug(slug);
  if (!offering) notFound();
  return <ProductDetailView offering={offering} />;
}
