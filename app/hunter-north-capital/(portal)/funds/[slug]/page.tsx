import { notFound } from "next/navigation";
import { getPublishedOfferingBySlug } from "@/lib/capital/repository-server";
import { ProductDetailView } from "../../products/[slug]/ProductDetailView";

export const dynamic = "force-dynamic";

export default async function HunterNorthFundDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offering = await getPublishedOfferingBySlug(slug);
  if (!offering) notFound();
  return <ProductDetailView offering={offering} />;
}
