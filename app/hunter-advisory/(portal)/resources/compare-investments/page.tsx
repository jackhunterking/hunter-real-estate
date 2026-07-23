import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { toFundComparable } from "@/lib/capital/compare-investments";
import { CompareInvestments } from "@/components/capital/north/CompareInvestments";

export default async function CompareInvestmentsPage() {
  const offerings = await getPublishedOfferings();
  const funds = offerings
    .map(toFundComparable)
    .filter((fund): fund is NonNullable<typeof fund> => fund !== null);
  return <CompareInvestments funds={funds} />;
}
