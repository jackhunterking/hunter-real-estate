import { PublicLanding } from "@/components/capital/north/PublicLanding";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export const dynamic = "force-dynamic";

export default async function HunterNorthAccessPage() {
  const offerings = await getPublishedOfferings();
  return <PublicLanding offerings={offerings} />;
}
