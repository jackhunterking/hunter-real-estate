import { notFound } from "next/navigation";
import { LearningGuide } from "@/components/equity-market/portal/LearningGuide";
import { getPublishedLearningResourceBySlug } from "@/lib/equity-market/learning-repository-server";

export default async function LearningGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getPublishedLearningResourceBySlug(slug);
  if (!resource) notFound();
  return <LearningGuide resource={resource} />;
}
