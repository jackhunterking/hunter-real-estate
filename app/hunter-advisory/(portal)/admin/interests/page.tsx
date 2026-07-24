import { redirect } from "next/navigation";

export default function InterestRequestsAdminPage() {
  redirect("/hunter-advisory/admin?section=interests");
}
