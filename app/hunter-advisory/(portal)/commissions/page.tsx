import { RepresentativeCommissions } from "@/components/capital/north/RepresentativeCommissions";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function HunterNorthCommissionsPage() {
  return <RepresentativeCommissions offerings={await getPublishedOfferings()} />;
}
