import type { Metadata } from "next";
import { tr } from "@/lib/i18n/dictionaries";
import OgrenClient from "./OgrenClient";

export const metadata: Metadata = {
  title: tr.ogren.metaTitle,
  description: tr.ogren.metaDesc,
};

export default function OgrenPage() {
  return <OgrenClient />;
}
