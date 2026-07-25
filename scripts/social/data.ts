/**
 * Reads real building + offering data out of the committed seed bundles so a
 * social card can never drift from what the site publishes.
 *
 * The seeds under supabase/seed/offerings/*.json are the same input
 * `scripts/seed-content.ts` pushes through `api.seed_offering`, and each
 * property carries a `media.card` Storage reference. We resolve that reference
 * to the public `offering-public` URL exactly the way `lib/capital/asset-url.ts`
 * does at read time — so the photo on a post is the photo on the site.
 *
 * Honesty rule (see the building-card memory): a card shows the photo of that
 * exact address, a Street View of that exact address, or a clearly labelled
 * rendering. Buildings with no `media.card` are excluded from image-led posts
 * rather than given a stand-in.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seedDir = join(here, "..", "..", "supabase", "seed", "offerings");

export interface Building {
  id: string;
  /** The street line — buildings are titled by address, never a marketing name. */
  name: string;
  city: string;
  province: string;
  /** Resolved public URL, or null when the building has no approved image. */
  imageUrl: string | null;
  /** `render` paints the "Artist's rendering" tag, matching AssetGallery. */
  imageKind: string | null;
  verified: boolean;
  unitCount: number | null;
  assetClassId: string | null;
  /** Manager's published note — the only prose we may quote about a building. */
  note: string | null;
  offeringSlug: string;
  offeringName: string;
}

function publicAssetUrl(bucket: string, path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encoded}`;
}

function en(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "en" in value) {
    const inner = (value as { en?: unknown }).en;
    return typeof inner === "string" ? inner : null;
  }
  return null;
}

/** The slice of a seed bundle this renderer reads. */
interface SeedImageSlot {
  bucket?: string;
  path?: string;
  src?: string;
  kind?: string;
}

interface SeedProperty {
  id: string;
  name?: unknown;
  city?: string;
  province?: string;
  assetClassId?: string;
  verificationStatus?: string;
  unitCount?: unknown;
  ownershipNote?: unknown;
  media?: { card?: SeedImageSlot; gallery?: SeedImageSlot[] };
}

interface SeedOffering {
  slug: string;
  name?: unknown;
  shortName?: unknown;
  properties?: SeedProperty[];
}

export interface Offering {
  slug: string;
  name: string;
  shortName: string | null;
  buildings: Building[];
}

let cache: Offering[] | null = null;

/** All committed offerings, each with its buildings, address-titled. */
export function loadOfferings(): Offering[] {
  if (cache) return cache;
  cache = readdirSync(seedDir)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const raw = JSON.parse(readFileSync(join(seedDir, file), "utf8")) as SeedOffering;
      const offeringName = en(raw.name) ?? raw.slug;
      const buildings: Building[] = (raw.properties ?? []).map((p) => {
        const slot = p.media?.card ?? p.media?.gallery?.[0];
        return {
          id: p.id,
          name: en(p.name) ?? p.id,
          city: p.city ?? "",
          province: p.province ?? "",
          imageUrl:
            slot?.bucket && slot?.path ? publicAssetUrl(slot.bucket, slot.path) : (slot?.src ?? null),
          imageKind: slot?.kind ?? null,
          verified: p.verificationStatus === "verified",
          unitCount: typeof p.unitCount === "number" ? p.unitCount : null,
          assetClassId: p.assetClassId ?? null,
          note: en(p.ownershipNote),
          offeringSlug: raw.slug,
          offeringName,
        };
      });
      return {
        slug: raw.slug,
        name: offeringName,
        shortName: en(raw.shortName),
        buildings,
      };
    });
  return cache;
}

/** Every building across every offering that has an approved image. */
export function imagedBuildings(): Building[] {
  return loadOfferings()
    .flatMap((o) => o.buildings)
    .filter((b) => Boolean(b.imageUrl));
}

export function findBuilding(id: string): Building | undefined {
  return loadOfferings()
    .flatMap((o) => o.buildings)
    .find((b) => b.id === id);
}
