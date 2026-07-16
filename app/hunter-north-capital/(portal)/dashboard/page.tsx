import { getOfferings } from "@/lib/capital/repository";
import { InvestorDashboard } from "@/components/capital/north/InvestorWorkspace";

export default function HunterNorthDashboardPage() {
  return <InvestorDashboard offerings={getOfferings()} />;
}
