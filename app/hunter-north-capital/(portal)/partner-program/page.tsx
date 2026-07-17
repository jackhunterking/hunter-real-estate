import { PartnershipOverview } from "@/components/capital/north/PartnershipOverview";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function PartnerProgramPage() {
  return <PartnershipOverview offerings={await getPublishedOfferings()} />;
}
