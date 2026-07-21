import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { ProductsExplorer } from "../products/ProductsExplorer";

export default async function HunterNorthFundsPage() {
  return <ProductsExplorer offerings={await getPublishedOfferings()} />;
}
