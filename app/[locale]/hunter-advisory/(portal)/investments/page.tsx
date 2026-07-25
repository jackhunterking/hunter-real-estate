import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { ProductsExplorer } from "../products/ProductsExplorer";

export default async function HunterNorthInvestmentsPage() {
  return <ProductsExplorer offerings={await getPublishedOfferings()} />;
}
