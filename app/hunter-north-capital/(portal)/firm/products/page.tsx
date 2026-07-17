import { FirmWorkspace } from "@/components/capital/north/FirmWorkspace";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function HunterNorthFirmProductsPage() {
  return <FirmWorkspace section="products" offerings={await getPublishedOfferings()} />;
}
