import { redirect } from "next/navigation";

export default function InterestRequestsAdminPage() {
  redirect("/hunter-advisory/operations?module=requests");
}
