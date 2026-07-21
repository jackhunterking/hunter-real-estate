import { redirect } from "next/navigation";

export default function CommissionsAdminPage() {
  redirect("/hunter-advisory/operations?module=payments");
}
