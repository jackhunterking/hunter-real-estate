import { getPublishedOfferings } from "@/lib/equity-market/repository-server";
import { toFundComparable } from "@/lib/equity-market/compare-investments";
import { CompareFunds } from "@/components/equity-market/portal/CompareFunds";

export default async function PassiveVsPassivePage() {
  const offerings = await getPublishedOfferings();
  const funds = offerings
    .map(toFundComparable)
    .filter((fund): fund is NonNullable<typeof fund> => fund !== null);
  return <CompareFunds funds={funds} />;
}
