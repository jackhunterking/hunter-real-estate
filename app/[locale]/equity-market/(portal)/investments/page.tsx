import { getPublishedOfferings } from "@/lib/equity-market/repository-server";
import { ProductsExplorer } from "../products/ProductsExplorer";

export default async function EquityMarketInvestmentsPage() {
  return <ProductsExplorer offerings={await getPublishedOfferings()} />;
}
