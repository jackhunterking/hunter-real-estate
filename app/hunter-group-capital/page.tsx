import type { Metadata } from "next";
import { getOfferings } from "@/lib/capital/repository";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = { title: "Hunter & Hunter Investment Advisors", description: "Hunter & Hunter Investment Advisors, powered by Parvis, provides a clearer view of Canadian private real estate and alternative investments." };

export default function CapitalPage() {
  return <Dashboard offerings={getOfferings()} />;
}
