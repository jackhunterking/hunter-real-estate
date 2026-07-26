import { redirect } from "next/navigation";
import { INVESTMENT_BASE_PATH } from "@/lib/capital/investment-brand";

export default function EquityMarketDocumentsPage() {
  redirect(`${INVESTMENT_BASE_PATH}/investments`);
}
