import type { Metadata } from "next";
import { getOfferings } from "@/lib/capital/repository";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = { title: "Hunter Advisory", description: "A clearer view of Canadian private real estate and alternative investments." };

export default function CapitalPage() {
  return <Dashboard offerings={getOfferings()} />;
}
