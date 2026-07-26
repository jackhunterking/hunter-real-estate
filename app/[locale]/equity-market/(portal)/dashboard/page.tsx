import { redirect } from "next/navigation";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";

export default function EquityMarketDashboardPage() {
  redirect(`${INVESTMENT_BASE_PATH}/portfolio`);
}
