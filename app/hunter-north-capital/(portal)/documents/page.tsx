import { getPublishedOfferings } from "@/lib/capital/repository-server";
import { DocumentsLibrary } from "./DocumentsLibrary";

export default async function HunterNorthDocumentsPage() {
  return <DocumentsLibrary offerings={await getPublishedOfferings()} />;
}
