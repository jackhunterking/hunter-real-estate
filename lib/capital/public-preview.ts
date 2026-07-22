import "server-only";

import type {
  ImageSlot,
  OfferingBundle,
  PublicOfferingPreview,
  SourcedValue,
} from "./types";

function approved<T>(value: SourcedValue<T> | undefined) {
  return value?.approval === "approved-public" ? value : undefined;
}

function verifiedPropertyImage(slot: ImageSlot | undefined) {
  return slot?.src && slot.sourceId && slot.verifiedAt ? slot : undefined;
}

export function buildPublicOfferingPreviews(
  offerings: OfferingBundle[],
): PublicOfferingPreview[] {
  return offerings
    .filter((offering) => offering.featured && offering.status === "available")
    .map((offering) => {
      const shareClass = offering.shareClasses[0];
      const targetDistribution = approved(
        shareClass?.targetDistribution ?? shareClass?.distributionPerUnit,
      );
      // Only source-attributed, verified photography may leave the portal.
      const offeringGallery = offering.media?.gallery?.filter((image) =>
        Boolean(verifiedPropertyImage(image)),
      );

      return {
        id: offering.id,
        slug: offering.slug,
        shortName: offering.shortName,
        managerName: offering.manager.name,
        summary: offering.summary,
        status: offering.status,
        media: offering.media
          ? {
              card: offering.media.card,
              banner: offering.media.banner,
              logo: offering.media.logo,
              gallery: offeringGallery?.length ? offeringGallery : undefined,
            }
          : undefined,
        strategyIds: offering.strategyIds,
        assetClassIds: offering.assetClassIds,
        regionIds: offering.regionIds,
        minimumInvestment: approved(shareClass?.minimumInvestment),
        targetReturn: approved(shareClass?.targetReturn),
        targetDistribution,
        portfolioFacts: offering.portfolioFacts
          .filter((fact) => fact.approval === "approved-public")
          .slice(0, 3),
        aum: approved(offering.aum),
        term: approved(shareClass?.term),
        riskProfile: offering.riskProfile,
        registeredAccountTypes: shareClass?.registeredAccountTypes,
        // Published fact-sheet figures only; rendered pre-auth with the
        // "historical, not a forecast" framing. Remove this block to pull
        // historical performance back behind authentication.
        performance: offering.trailingReturns?.map((row) => ({
          period: row.period,
          value: row.value,
        })),
        performanceNote: offering.trailingReturnsNote,
        properties: offering.properties
          .filter((property) => property.verificationStatus === "verified")
          .map((property) => {
            const card = verifiedPropertyImage(property.media?.card);
            const gallery = property.media?.gallery?.filter((image) =>
              Boolean(verifiedPropertyImage(image)),
            );
            return {
              id: property.id,
              name: property.name,
              city: property.city,
              province: property.province,
              latitude: property.latitude,
              longitude: property.longitude,
              assetClassId: property.assetClassId,
              status: property.status,
              media: card || gallery?.length ? { card, gallery } : undefined,
            };
          }),
        verifiedAt: offering.verifiedAt,
      } satisfies PublicOfferingPreview;
    });
}
