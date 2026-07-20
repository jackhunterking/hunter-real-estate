import { redirect } from "next/navigation";

export default function LicenseVerificationsAdminPage() {
  redirect("/hunter-advisory/operations?module=licences");
}
