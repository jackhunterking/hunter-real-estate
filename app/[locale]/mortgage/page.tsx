import type { Metadata } from "next";
import { tr } from "@/lib/i18n/dictionaries";
import MortgageClient from "./MortgageClient";

export const metadata: Metadata = {
  title: tr.mortgage.metaTitle,
  description: tr.mortgage.metaDesc,
};

export default function MortgagePage() {
  return <MortgageClient />;
}
