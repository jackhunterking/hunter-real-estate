import { getOfferings } from "@/lib/capital/repository";
import { DocumentsLibrary } from "./DocumentsLibrary";

export default function HunterNorthDocumentsPage() {
  return <DocumentsLibrary offerings={getOfferings()} />;
}
