import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { RequestsView } from "@/components/capital/north/RequestsView";

export default async function HunterNorthRequestsPage() {
  return <RequestsView offerings={await getPublishedOfferings()} />;
}
