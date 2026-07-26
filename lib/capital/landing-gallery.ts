import type {
  LocalizedText,
  PublicOfferingPreview,
  PublicOfferingPropertyPreview,
} from "./types";

/**
 * A photo shown in the public "real assets" footprint, with an honest caption
 * and the fund it belongs to.
 */
export type FootprintImage = {
  src: string;
  alt?: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  /** Which published offering the photo comes from — drives the fund chip. */
  offering: {
    id: string;
    name: LocalizedText;
    logoSrc?: string;
    logoAlt?: LocalizedText;
  };
};

function offeringBadge(offering: PublicOfferingPreview): FootprintImage["offering"] {
  return {
    id: offering.id,
    name: offering.shortName,
    logoSrc: offering.media?.logo?.src,
    logoAlt: offering.media?.logo?.alt,
  };
}

function propertyImage(
  property: PublicOfferingPropertyPreview,
  offering: PublicOfferingPreview,
): FootprintImage | null {
  const image = property.media?.card ?? property.media?.gallery?.[0];
  if (!image?.src) return null;
  const place = `${property.city}, ${property.province}`;
  return {
    src: image.src,
    alt: image.alt,
    title: property.name,
    subtitle: { en: place, tr: place },
    offering: offeringBadge(offering),
  };
}

/**
 * Photography for one offering, strongest first: named-property photos, then
 * offering-level fact-sheet photography (captioned with the fund — never with
 * a building name the source doesn't support).
 */
function offeringQueue(
  offering: PublicOfferingPreview,
  seenProperties: Set<string>,
): FootprintImage[] {
  const queue: FootprintImage[] = [];
  offering.properties.forEach((property) => {
    // A building shared by two funds is credited to the first fund that
    // published it, so the same photo never appears twice in the grid.
    if (seenProperties.has(property.id)) return;
    const item = propertyImage(property, offering);
    if (!item) return;
    seenProperties.add(property.id);
    queue.push(item);
  });
  offering.media?.gallery?.forEach((image) => {
    if (!image.src) return;
    queue.push({
      src: image.src,
      alt: image.alt,
      title: offering.shortName,
      subtitle: offering.managerName,
      offering: offeringBadge(offering),
    });
  });
  return queue;
}

/**
 * Interleave every published fund's photography round-robin, so the first
 * shots the page shows are a mix of portfolios rather than the whole of
 * whichever fund happens to be first. A fund with more buildings still
 * contributes more photos overall — it just no longer owns the top of the
 * grid, which is all any truncated view (the gallery caps at 8) ever renders.
 *
 * Each round starts one fund further along, so in a fixed-column grid the same
 * fund does not stack down a single column: two funds checkerboard rather than
 * striping. The rotation is positional only — it never changes which fund a
 * photo is credited to.
 */
export function buildFootprintGallery(
  offerings: PublicOfferingPreview[],
): FootprintImage[] {
  const seenProperties = new Set<string>();
  const queues = offerings.map((offering) => offeringQueue(offering, seenProperties));
  const longest = queues.reduce((max, queue) => Math.max(max, queue.length), 0);
  const mixed: FootprintImage[] = [];
  for (let round = 0; round < longest; round += 1) {
    for (let i = 0; i < queues.length; i += 1) {
      const item = queues[(round + i) % queues.length][round];
      if (item) mixed.push(item);
    }
  }
  return mixed;
}
