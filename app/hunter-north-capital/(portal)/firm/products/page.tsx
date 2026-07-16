import { FirmWorkspace } from "@/components/capital/north/FirmWorkspace";
import { getOfferings } from "@/lib/capital/repository";

export default function HunterNorthFirmProductsPage() {
  return <FirmWorkspace section="products" offerings={getOfferings()} />;
}
