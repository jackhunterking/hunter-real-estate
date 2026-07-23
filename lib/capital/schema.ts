import { z } from "zod";
import type { OfferingBundle } from "./types";

/**
 * Runtime validation for offering bundles read from Supabase
 * (`api.published_offerings.content_snapshot`). Malformed snapshots are dropped
 * loudly rather than rendered. Object schemas use `.passthrough()` and the
 * validated value is returned unchanged, so no fields are stripped.
 */
const localized = z.object({ en: z.string().min(1), tr: z.string().min(1) }).passthrough();

const bundleShape = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: localized,
    shortName: localized,
    summary: localized,
    status: z.enum(["available", "coming-soon", "paused", "closed"]),
    manager: z
      .object({ id: z.string().min(1), slug: z.string().min(1), name: localized })
      .passthrough(),
    shareClasses: z.array(z.object({ id: z.string().min(1) }).passthrough()).min(1),
    properties: z.array(z.object({ id: z.string().min(1) }).passthrough()),
    documents: z.array(z.object({ id: z.string().min(1) }).passthrough()),
    verifiedAt: z.string().min(1),
  })
  .passthrough();

/**
 * Validates a published `content_snapshot` and returns it as an OfferingBundle,
 * or null if the shape is invalid. Returns the ORIGINAL object (unstripped) so
 * every downstream field survives.
 */
export function parseOfferingBundle(value: unknown): OfferingBundle | null {
  const result = bundleShape.safeParse(value);
  if (!result.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Dropped malformed offering snapshot:", result.error.issues.map((i) => i.path.join(".")).join(", "));
    }
    return null;
  }
  return value as OfferingBundle;
}
