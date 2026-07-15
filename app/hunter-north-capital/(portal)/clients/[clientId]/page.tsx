import { getOfferings } from "@/lib/capital/repository";
import { ClientProfile } from "./ClientProfile";

export default async function ClientProfilePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  return <ClientProfile clientId={clientId} offerings={getOfferings()} />;
}
