import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { ClientProfile } from "./ClientProfile";

export default async function ClientProfilePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  return <ClientProfile clientId={clientId} offerings={await getPublishedOfferings()} />;
}
