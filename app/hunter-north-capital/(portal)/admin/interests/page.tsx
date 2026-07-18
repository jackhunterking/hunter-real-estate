import { redirect } from "next/navigation";

export default function InterestRequestsAdminPage() {
  redirect("/hunter-north-capital/operations?module=requests");
}
