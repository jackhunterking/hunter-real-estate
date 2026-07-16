import { InvestmentsView } from "@/components/capital/north/InvestorWorkspace";
import { getOfferings } from "@/lib/capital/repository";

export default function HunterNorthInvestmentsPage() {
  return <InvestmentsView offerings={getOfferings()} />;
}
