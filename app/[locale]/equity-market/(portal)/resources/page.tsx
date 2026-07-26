import { redirect } from "next/navigation";
import { INVESTMENT_BASE_PATH } from "@/lib/capital/investment-brand";

export default function ResourcesPage() {
  redirect(`${INVESTMENT_BASE_PATH}/resources/learning`);
}
