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
 * Live at Jack's direction. Parvis is the registered dealer and supervises this
 * marketing, so if their compliance review returns edits, change the copy in
 * lib/capital/entry-disclaimer.ts and bump ENTRY_DISCLAIMER_VERSION — every
 * visitor then re-acknowledges the revised wording rather than carrying an
 * acknowledgement of text that no longer exists.
 */
export const ENTRY_DISCLAIMER_ENABLED: boolean = true;
