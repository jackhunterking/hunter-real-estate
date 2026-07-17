import { FirmWorkspace } from "@/components/capital/north/FirmWorkspace";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function HunterNorthFirmCommissionsPage() {
  return <FirmWorkspace section="commissions" offerings={await getPublishedOfferings()} />;
}
