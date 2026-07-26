import { NextResponse } from "next/server";
import { CAPITAL_SCHEMA_VERSION } from "@/lib/equity-market/types";
import { getPublishedOfferings } from "@/lib/equity-market/repository-server";

export async function GET() {
  return NextResponse.json({ schemaVersion: CAPITAL_SCHEMA_VERSION, data: await getPublishedOfferings() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
