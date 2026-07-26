import { getPublishedOfferings } from "@/lib/equity-market/repository-server";
import { toFundComparable } from "@/lib/equity-market/compare-investments";
import { CompareInvestments } from "@/components/equity-market/portal/CompareInvestments";

export default async function ActiveVsPassivePage() {
  const offerings = await getPublishedOfferings();
  const funds = offerings
    .map(toFundComparable)
    .filter((fund): fund is NonNullable<typeof fund> => fund !== null);
  return <CompareInvestments funds={funds} />;
}
