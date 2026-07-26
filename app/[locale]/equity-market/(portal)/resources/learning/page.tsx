import { LearningLibrary } from "@/components/equity-market/portal/LearningLibrary";
import { getPublishedLearningResources } from "@/lib/equity-market/learning-repository-server";

export default async function LearningCentrePage() {
  const resources = await getPublishedLearningResources();
  return <LearningLibrary resources={resources} />;
}
