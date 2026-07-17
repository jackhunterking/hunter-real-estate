import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { ClientDirectory } from "./ClientDirectory";

export default async function HunterNorthClientsPage() {
  return <ClientDirectory offerings={await getPublishedOfferings()} />;
}
