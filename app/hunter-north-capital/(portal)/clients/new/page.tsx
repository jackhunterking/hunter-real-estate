import { Suspense } from "react";
import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { ClientOnboarding } from "./ClientOnboarding";

export default async function NewClientPage() {
  return <Suspense><ClientOnboarding offerings={await getPublishedOfferings()} /></Suspense>;
}
