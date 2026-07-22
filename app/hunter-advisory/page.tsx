import { PublicLanding } from "@/components/capital/north/PublicLanding";
import { buildPublicOfferingPreviews } from "@/lib/capital/public-preview";
import { getOfferings as getProductDemoOfferings } from "@/lib/capital/repository";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export const dynamic = "force-dynamic";

export default async function HunterNorthAccessPage() {
  const offerings = buildPublicOfferingPreviews(await getPublishedOfferings());
  const productDemoOfferings = offerings.length
    ? offerings
    : buildPublicOfferingPreviews(getProductDemoOfferings());

  return (
    <PublicLanding
      offerings={offerings}
      productDemoOfferings={productDemoOfferings}
    />
  );
}
