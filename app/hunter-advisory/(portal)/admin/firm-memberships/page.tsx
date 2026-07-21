import { redirect } from "next/navigation";

export default function FirmMembershipsAdminPage() {
  redirect("/hunter-advisory/operations?module=firms");
}
