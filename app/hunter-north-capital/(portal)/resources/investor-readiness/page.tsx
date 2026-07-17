import { InvestorReadinessTool } from "./InvestorReadinessTool";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function InvestorReadinessPage() {
  return <InvestorReadinessTool offerings={await getPublishedOfferings()} />;
}
