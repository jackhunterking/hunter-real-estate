import { getOfferings } from "@/lib/capital/repository";
import { ProductsExplorer } from "../products/ProductsExplorer";

export default function HunterNorthFundsPage() {
  return <ProductsExplorer offerings={getOfferings()} />;
}
