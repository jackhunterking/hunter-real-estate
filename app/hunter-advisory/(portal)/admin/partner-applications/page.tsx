import { redirect } from "next/navigation";

export default function PartnerApplicationsAdminPage() {
  redirect("/hunter-advisory/admin?section=professional");
}
