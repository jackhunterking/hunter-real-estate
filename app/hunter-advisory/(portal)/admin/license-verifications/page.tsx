import { redirect } from "next/navigation";

export default function LicenseVerificationsAdminPage() {
  redirect("/hunter-advisory/admin?section=licences");
}
