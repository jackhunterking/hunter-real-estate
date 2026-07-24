import { redirect } from "next/navigation";

export default function FirmMembershipsAdminPage() {
  redirect("/hunter-advisory/admin?section=memberships");
}
