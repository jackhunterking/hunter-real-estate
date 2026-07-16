import { FirmWorkspace } from "@/components/capital/north/FirmWorkspace";
import { getOfferings } from "@/lib/capital/repository";

export default function HunterNorthFirmCommissionsPage() {
  return <FirmWorkspace section="commissions" offerings={getOfferings()} />;
}
