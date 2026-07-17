import { AdminWorkspace } from "@/components/capital/north/AdminWorkspace";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function CommissionsAdminPage() {
  return <AdminWorkspace section="commissions" offerings={await getPublishedOfferings()} />;
}
