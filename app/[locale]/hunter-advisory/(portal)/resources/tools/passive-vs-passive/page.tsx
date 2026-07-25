import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { toFundComparable } from "@/lib/capital/compare-investments";
import { CompareFunds } from "@/components/capital/north/CompareFunds";

export default async function PassiveVsPassivePage() {
  const offerings = await getPublishedOfferings();
  const funds = offerings
    .map(toFundComparable)
    .filter((fund): fund is NonNullable<typeof fund> => fund !== null);
  return <CompareFunds funds={funds} />;
}
