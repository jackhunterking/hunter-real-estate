import { LearningLibrary } from "@/components/capital/north/LearningLibrary";
import { getPublishedLearningResources } from "@/lib/capital/learning-repository-server";

export default async function LearningCentrePage() {
  const resources = await getPublishedLearningResources();
  return <LearningLibrary resources={resources} />;
}
