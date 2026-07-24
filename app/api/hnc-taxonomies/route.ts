import "server-only";

import { z } from "zod";
import { NextResponse } from "next/server";
import { portalRpc } from "@/lib/capital/portal-route";
import type { Json } from "@/lib/supabase/database.types";

const Localized = z.object({ en: z.string().min(1), tr: z.string().min(1) }).passthrough();

const Upsert = z.object({
  action: z.literal("upsert"),
  kind: z.enum(["strategy", "asset_class", "region"]),
  key: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, digits and hyphens only"),
  label: Localized,
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const Retire = z.object({
  action: z.literal("retire"),
  kind: z.enum(["strategy", "asset_class", "region"]),
  key: z.string().min(1),
});

/**
 * Create, rename or retire an investment tag. Both RPCs are admin-gated in SQL.
 *
 * `retire` refuses server-side when any investment still uses the key — a tag
 * cited by a published content_snapshot has to keep resolving, so retiring one
 * in use would break the profile that references it.
 */
export async function POST(request: Request) {
  const parsed = z.union([Upsert, Retire]).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid taxonomy update." }, { status: 400 });
  }

  if (parsed.data.action === "retire") {
    return portalRpc("retire_taxonomy", { p_kind: parsed.data.kind, p_key: parsed.data.key });
  }

  return portalRpc("upsert_taxonomy", {
    p_kind: parsed.data.kind,
    p_key: parsed.data.key,
    p_label: parsed.data.label as unknown as Json,
    p_color: parsed.data.color ?? null,
    p_sort_order: parsed.data.sortOrder ?? 0,
  });
}
