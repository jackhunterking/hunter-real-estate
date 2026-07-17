import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { InvestorDashboard } from "@/components/capital/north/InvestorWorkspace";

export default async function HunterNorthDashboardPage() {
  return <InvestorDashboard offerings={await getPublishedOfferings()} />;
}
