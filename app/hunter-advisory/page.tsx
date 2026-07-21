import { PublicLanding } from "@/components/capital/north/PublicLanding";
import { buildPublicOfferingPreviews } from "@/lib/capital/public-preview";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export const dynamic = "force-dynamic";

export default async function HunterNorthAccessPage() {
  const offerings = buildPublicOfferingPreviews(await getPublishedOfferings());
  return <PublicLanding offerings={offerings} />;
}
