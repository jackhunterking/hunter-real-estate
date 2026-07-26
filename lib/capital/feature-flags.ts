/**
 * Temporarily hides the professional / partner ("middle layer") workspace so the
 * portal focuses on the investor experience. Flip to `true` to restore the
 * Professional Overview, Investors, Payments, the account-view toggle, and the
 * "Professional access" application on-ramp. Nothing else needs to change to revive it.
 */
export const PROFESSIONAL_WORKSPACE_ENABLED: boolean = false;

/**
 * The one-time entry acknowledgement on the advisory surface
 * (components/capital/north/EntryDisclaimer.tsx).
 *
 * Off until Parvis compliance has approved the wording. Parvis is the registered
 * dealer and supervises this marketing, and the repo already holds this line —
 * `PARVIS_RELATIONSHIP.compensationDisclosure` ships empty for the same reason.
 * The copy in lib/capital/entry-disclaimer.ts is a complete draft; flip this to
 * `true` once it comes back approved, and bump ENTRY_DISCLAIMER_VERSION if
 * compliance changed any wording.
 */
export const ENTRY_DISCLAIMER_ENABLED: boolean = false;
