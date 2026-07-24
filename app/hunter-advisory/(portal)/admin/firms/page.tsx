import { redirect } from "next/navigation";

export default function FirmsAdminPage() {
  redirect("/hunter-advisory/admin?section=firms");
}
