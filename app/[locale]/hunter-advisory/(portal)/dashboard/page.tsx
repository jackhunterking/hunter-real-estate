import { redirect } from "next/navigation";
import { INVESTMENT_BASE_PATH } from "@/lib/capital/investment-brand";

export default function HunterNorthDashboardPage() {
  redirect(`${INVESTMENT_BASE_PATH}/portfolio`);
}
