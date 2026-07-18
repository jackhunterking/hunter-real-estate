import { redirect } from "next/navigation";

export default function CommissionsAdminPage() {
  redirect("/hunter-north-capital/operations?module=payments");
}
