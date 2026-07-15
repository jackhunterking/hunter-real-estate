import { getOfferings } from "@/lib/capital/repository";
import { DashboardView } from "./DashboardView";

export default function HunterNorthDashboardPage() {
  return <DashboardView offerings={getOfferings()} />;
}
