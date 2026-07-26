import { getPublishedOfferings } from "@/lib/equity-market/repository-server";
import { RequestsView } from "@/components/equity-market/portal/RequestsView";

export default async function EquityMarketRequestsPage() {
  return <RequestsView offerings={await getPublishedOfferings()} />;
}
