import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { DashboardView } from "../dashboard/DashboardView";

export default async function HunterNorthProfessionalOverviewPage() {
  return <DashboardView offerings={await getPublishedOfferings()} />;
}
