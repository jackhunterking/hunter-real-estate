import { getOfferings } from "@/lib/capital/repository";
import { DashboardView } from "../dashboard/DashboardView";

export default function HunterNorthPartnerDashboardPage() {
  return <DashboardView offerings={getOfferings()} />;
}
