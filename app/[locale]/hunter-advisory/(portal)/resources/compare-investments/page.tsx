import { redirect } from "next/navigation";
import { INVESTMENT_BASE_PATH } from "@/lib/capital/investment-brand";

/** The tool moved under Resources → Tools and was renamed "Active vs. Passive". */
export default function CompareInvestmentsPage() {
  redirect(`${INVESTMENT_BASE_PATH}/resources/tools/active-vs-passive`);
}
