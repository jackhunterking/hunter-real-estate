import { getPublishedOfferings } from "@/lib/equity-market/repository-server";
import { InvestorPortfolio } from "@/components/equity-market/portal/InvestorPortfolio";

export default async function EquityMarketPortfolioPage() {
  return <InvestorPortfolio offerings={await getPublishedOfferings()} />;
}
