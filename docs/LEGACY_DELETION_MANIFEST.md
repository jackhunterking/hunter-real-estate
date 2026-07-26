# Equity Market legacy deletion manifest

Status: **Awaiting explicit owner approval. Nothing in this manifest has been deleted, with the one recorded exception below.**

Recorded exception — Equity Market rename, 2026-07-26: the two
`app/[locale]/hunter-x-capital/**` pages were deleted. They were redirect-only
stubs that middleware could never reach: the legacy-capital rule in
`middleware.ts` 301s `/hunter-x-capital` and `/hunter-group-capital` before
routing, on every host. Redirect coverage is therefore unchanged and the
12-month monitoring condition still holds — it is now met by middleware alone.
No other row has been actioned.

The live Jack domains now use `/investing` as their bridge and return a 301 from approved legacy capital URLs. These candidates should remain available in source until production traffic and replacement coverage are verified.

| Category | Candidate | Replacement / redirect | Dependencies and deletion condition |
| --- | --- | --- | --- |
| Obsolete route | `app/hunter-group-capital/**` | Jack domains: 301 to `/investing`; the portal's public root and portal replace the experience | Retain for at least 12 months of redirect monitoring. Confirm no external campaign or indexed deep link still requires route-specific forwarding. |
| Obsolete route | ~~`app/[locale]/hunter-x-capital/page.tsx`~~ | Jack domains: 301 to `/investing`, served by `middleware.ts` | **Deleted 2026-07-26** (see recorded exception). Redirect retained. |
| Obsolete route | ~~`app/[locale]/hunter-x-capital/investor-map/page.tsx`~~ | Jack domains: 301 to `/investing`, served by `middleware.ts` | **Deleted 2026-07-26** (see recorded exception). Redirect retained; no map deep link was route-specific. |
| Duplicate file | `components/equity-market/map/BuildingMapThumb 2.tsx` | `components/equity-market/map/BuildingMapThumb.tsx` | Confirm there are no dynamic or non-TypeScript imports. |
| Duplicate file | `components/equity-market/portal/PortalShell 2.tsx` | `components/equity-market/portal/PortalShell.tsx` | Confirm production build and visual parity. |
| Duplicate file | `lib/equity-market/eligibility 2.ts` | `lib/equity-market/eligibility.ts` | Compare exports before deletion. |
| Duplicate file | `lib/equity-market/investor-readiness 2.ts` | `lib/equity-market/investor-readiness.ts` | Compare ruleset and compliance references before deletion. |
| Demo/static module | `lib/equity-market/data.ts` | `lib/equity-market/repository-server.ts` backed by `api.published_offerings` | Retain as development fixtures until the live import is verified field-for-field. Never use in production when `PORTAL_USE_FIXTURE_DATA` is unset. |
| Demo/static module | `lib/equity-market/partner-data.ts` | Supabase portal snapshot, referrals, documents, and fixed tier rules in `lib/equity-market/commissions.ts` | Retain only for local preview clients until live partner-role regression testing passes. |
| Demo/static module | `lib/equity-market/portal-demo.ts` | Supabase portal repositories and RLS-filtered API views | Retain for explicit local preview only; never enable preview in production. |
| Replaced component | Legacy offering cards, investor profile, and legacy capital dashboard under `app/hunter-group-capital/**` | the portal one-page explorer, onboarding, fund detail, and interest-request flow | Covered by the obsolete-route approval above. |
| Archived documentation | `docs/archive/**` | None | **Excluded from cleanup.** Business and historical material remains archived. |
| Database/storage dependency | All `supabase/migrations/**`, production rows, offering documents, licence evidence, client documents | None | **Excluded from code cleanup. Never delete through this manifest.** |

## Approval checklist

- Capture 12 months of legacy-route analytics after the production redirect begins.
- Verify public documents and fund deep links have an explicit replacement.
- Verify Supabase contains the current approved `content_snapshot` for every published fund.
- Verify investor, pending-professional, active-partner, firm-admin, and the portal-admin journeys without fixture data.
- Record written approval beside each manifest row before deleting it.

Approval must be item-specific; approving one category does not authorize database, storage, migration, or archived-document deletion.
