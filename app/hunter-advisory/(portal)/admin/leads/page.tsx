import { redirect } from "next/navigation";

export default function LeadsAdminPage() {
  redirect("/hunter-advisory/admin?section=leads");
}
