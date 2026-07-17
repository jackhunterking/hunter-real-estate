import { NextResponse } from "next/server";
import { CAPITAL_SCHEMA_VERSION } from "@/lib/capital/repository";
import { getPublishedOfferings } from "@/lib/capital/repository-server";

export async function GET() {
  return NextResponse.json({ schemaVersion: CAPITAL_SCHEMA_VERSION, data: await getPublishedOfferings() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
