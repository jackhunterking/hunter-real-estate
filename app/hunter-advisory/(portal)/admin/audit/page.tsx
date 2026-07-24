import { redirect } from "next/navigation";

export default function AuditAdminPage() {
  redirect("/hunter-advisory/admin?section=audit");
}
