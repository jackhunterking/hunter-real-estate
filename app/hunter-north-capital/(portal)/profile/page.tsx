import { ProfileView } from "@/components/capital/north/InvestorWorkspace";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export default async function HunterNorthProfilePage() {
  return <ProfileView offerings={await getPublishedOfferings()} />;
}
