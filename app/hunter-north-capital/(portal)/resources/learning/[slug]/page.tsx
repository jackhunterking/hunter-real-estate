import { notFound } from "next/navigation";
import { LearningGuide } from "@/components/capital/north/LearningGuide";
import { getPublishedLearningResourceBySlug } from "@/lib/capital/learning-repository-server";

export default async function LearningGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getPublishedLearningResourceBySlug(slug);
  if (!resource) notFound();
  return <LearningGuide resource={resource} />;
}
