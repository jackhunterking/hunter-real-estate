import { getOfferings } from "@/lib/capital/repository";
import { ClientDirectory } from "./ClientDirectory";

export default function HunterNorthClientsPage() {
  return <ClientDirectory offerings={getOfferings()} />;
}
