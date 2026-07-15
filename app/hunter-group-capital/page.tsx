import type { Metadata } from "next";
import { getOfferings } from "@/lib/capital/repository";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = { title: "Hunter North Capital", description: "Review Canadian private-market real estate products, portfolios, and source documents." };

export default function CapitalPage() {
  return <Dashboard offerings={getOfferings()} />;
}
