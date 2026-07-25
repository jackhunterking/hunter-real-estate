import { redirect } from "next/navigation";

/** The tool moved under Resources → Tools and was renamed "Active vs. Passive". */
export default function CompareInvestmentsPage() {
  redirect("/hunter-advisory/resources/tools/active-vs-passive");
}
