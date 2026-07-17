import { InvestmentsView } from "@/components/capital/north/InvestorWorkspace";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function HunterNorthInvestmentsPage() {
  return <InvestmentsView offerings={await getPublishedOfferings()} />;
}
