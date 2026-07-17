import { InterestRequestAdmin } from "@/components/capital/north/InterestRequestAdmin";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function InterestRequestsAdminPage() {
  return <InterestRequestAdmin offerings={await getPublishedOfferings()} />;
}
