import { redirect } from "next/navigation";

export default function AuditAdminPage() {
  redirect("/hunter-north-capital/operations?module=audit");
}
