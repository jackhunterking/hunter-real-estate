import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { RequestsView } from "@/components/capital/north/RequestsView";

export default async function EquityMarketRequestsPage() {
  return <RequestsView offerings={await getPublishedOfferings()} />;
}
