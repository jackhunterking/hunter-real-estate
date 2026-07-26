import { PublicLanding } from "@/components/equity-market/portal/PublicLanding";
import { buildPublicOfferingPreviews } from "@/lib/equity-market/public-preview";
import { getPublishedOfferings } from "@/lib/equity-market/repository-server";

export const dynamic = "force-dynamic";

export default async function EquityMarketAccessPage() {
  const offerings = buildPublicOfferingPreviews(await getPublishedOfferings());

  return <PublicLanding offerings={offerings} />;
}
