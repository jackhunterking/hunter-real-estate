/**
 * Resolves Supabase Storage references on an offering bundle to URLs at read
 * time. The published `content_snapshot` stores immutable Storage PATHS (never
 * baked URLs), so links never go stale; this module turns them into live URLs.
 *
 *  - Public images and public documents live in the public `offering-public`
 *    bucket → a stable `getPublicUrl`-style CDN URL.
 *  - Private documents live in `offering-private` → NOT resolved here; the client
 *    requests a short-lived signed URL from /api/portal-offering-documents.
 *
 * Resolution is non-destructive and backward compatible: a `{bucket,path}`
 * reference wins, but any legacy `src`/`href` already on the object is preserved
 * when no Storage reference is present.
 */
import type { ImageSlot, MediaSet, OfferingBundle, OfferingDocument, Property } from "./types";

const PUBLIC_BUCKET = "offering-public";

function publicBase(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url.replace(/\/$/, "")}/storage/v1/object/public` : null;
}

/** Deterministic public URL for an object in a public Storage bucket. */
export function publicAssetUrl(bucket: string, path: string): string | null {
  const base = publicBase();
  if (!base) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/${bucket}/${encoded}`;
}

function resolveImageSlot(slot: ImageSlot | undefined): ImageSlot | undefined {
  if (!slot) return slot;
  if (slot.bucket && slot.path) {
    const url = publicAssetUrl(slot.bucket, slot.path);
    if (url) return { ...slot, src: url };
  }
  return slot;
}

function resolveMediaSet(media: MediaSet | undefined): MediaSet | undefined {
  if (!media) return media;
  return {
    ...media,
    card: resolveImageSlot(media.card),
    banner: resolveImageSlot(media.banner),
    logo: resolveImageSlot(media.logo),
    gallery: media.gallery?.map((slot) => resolveImageSlot(slot) as ImageSlot),
  };
}

function resolveDocument(doc: OfferingDocument): OfferingDocument {
  if (doc.bucket === PUBLIC_BUCKET && doc.path) {
    const url = publicAssetUrl(doc.bucket, doc.path);
    if (url) return { ...doc, href: url };
  }
  // Private-bucket (or fileless) documents keep their reference untouched; the
  // client resolves a signed URL on demand.
  return doc;
}

/**
 * Returns a copy of the bundle with all Storage-backed images and public
 * documents resolved to live URLs. Pure — never mutates the input.
 */
export function resolveBundleAssets(bundle: OfferingBundle): OfferingBundle {
  return {
    ...bundle,
    media: resolveMediaSet(bundle.media),
    properties: bundle.properties?.map((property): Property => ({
      ...property,
      media: resolveMediaSet(property.media),
    })),
    documents: bundle.documents?.map(resolveDocument),
  };
}
