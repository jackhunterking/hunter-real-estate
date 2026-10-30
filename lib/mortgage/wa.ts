/**
 * WhatsApp deep-link helper for Mortgage CTAs.
 *
 * The site is WhatsApp-first (see ContactSection.tsx, which links to the same
 * number). Mortgage leads route here.
 */

export const WA_NUMBER = "16473913311";

export function waHref(text: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
