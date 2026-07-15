import { Suspense } from "react";
import { getOfferings } from "@/lib/capital/repository";
import { ClientOnboarding } from "./ClientOnboarding";

export default function NewClientPage() {
  return <Suspense><ClientOnboarding offerings={getOfferings()} /></Suspense>;
}
