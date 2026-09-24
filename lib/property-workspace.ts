/** Private real estate deal workspace; separate from the Equity Market funds portal. */
export const PROPERTY_WORKSPACE_URL = (
  process.env.NEXT_PUBLIC_PROPERTY_WORKSPACE_URL ?? "https://app.huntergroupremax.com"
).replace(/\/$/, "");
