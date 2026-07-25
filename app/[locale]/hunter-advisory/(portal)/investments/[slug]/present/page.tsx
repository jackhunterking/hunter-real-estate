import { notFound } from "next/navigation";
import { getPublishedOfferingBySlug } from "@/lib/capital/repository-server";
import { FundPresentation } from "@/components/capital/north/FundPresentation";

export const dynamic = "force-dynamic";

export default async function InvestmentPresentationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offering = await getPublishedOfferingBySlug(slug);
  if (!offering) notFound();
  return <FundPresentation offering={offering} />;
}
