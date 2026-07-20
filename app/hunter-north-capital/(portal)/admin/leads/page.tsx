import { redirect } from "next/navigation";

export default function LeadsPage() {
  redirect("/hunter-advisory/operations?module=leads");
}
