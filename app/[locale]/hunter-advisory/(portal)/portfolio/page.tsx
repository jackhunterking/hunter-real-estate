import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { InvestorPortfolio } from "@/components/capital/north/InvestorPortfolio";

export default async function HunterNorthPortfolioPage() {
  return <InvestorPortfolio offerings={await getPublishedOfferings()} />;
}
