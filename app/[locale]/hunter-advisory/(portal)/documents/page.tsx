import { redirect } from "next/navigation";
import { INVESTMENT_BASE_PATH } from "@/lib/capital/investment-brand";

export default function HunterNorthDocumentsPage() {
  redirect(`${INVESTMENT_BASE_PATH}/investments`);
}
