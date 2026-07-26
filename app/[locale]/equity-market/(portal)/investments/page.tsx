import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { ProductsExplorer } from "../products/ProductsExplorer";

export default async function EquityMarketInvestmentsPage() {
  return <ProductsExplorer offerings={await getPublishedOfferings()} />;
}
