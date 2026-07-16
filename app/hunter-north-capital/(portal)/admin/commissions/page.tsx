import { AdminWorkspace } from "@/components/capital/north/AdminWorkspace";
import { getOfferings } from "@/lib/capital/repository";

export default function CommissionsAdminPage() {
  return <AdminWorkspace section="commissions" offerings={getOfferings()} />;
}
