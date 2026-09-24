/**
 * Where to send someone who wants the investment side of the business.
 *
 * The funds portal is a separate business with its own repo
 * (github.com/jackhunterking/equity-market) and its own domain. This app only
 * links out to it, so this is an absolute URL rather than an in-app path.
 *
 * The value is resolved once, in next.config.mjs, which also uses it for the
 * host redirect off the portal's former domain. Change it there (or set
 * NEXT_PUBLIC_PORTAL_URL) rather than here.
 */
export const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL as string;
