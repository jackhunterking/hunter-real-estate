import { redirect } from "next/navigation";

export default function FirmsAdminPage() {
  redirect("/hunter-advisory/operations?module=firms");
}
