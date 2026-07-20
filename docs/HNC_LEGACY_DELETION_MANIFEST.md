# Hunter Advisory legacy deletion manifest

Status: **Awaiting explicit owner approval. Nothing in this manifest has been deleted.**

The live Jack domains now use `/investing` as their bridge and return a 301 from approved legacy capital URLs. These candidates should remain available in source until production traffic and replacement coverage are verified.

| Category | Candidate | Replacement / redirect | Dependencies and deletion condition |
| --- | --- | --- | --- |
| Obsolete route | `app/hunter-group-capital/**` | Jack domains: 301 to `/investing`; HNC public root and portal replace the experience | Retain for at least 12 months of redirect monitoring. Confirm no external campaign or indexed deep link still requires route-specific forwarding. |
| Obsolete route | `app/hunter-x-capital/page.tsx` | Jack domains: 301 to `/investing` | Same 12-month traffic condition. |
| Obsolete route | `app/hunter-x-capital/investor-map/page.tsx` | Jack domains: 301 to `/investing` | Confirm whether any map deep link needs a specific HNC fund replacement before deletion. |
| Duplicate file | `components/capital/map/BuildingMapThumb 2.tsx` | `components/capital/map/BuildingMapThumb.tsx` | Confirm there are no dynamic or non-TypeScript imports. |
| Duplicate file | `components/capital/north/NorthShell 2.tsx` | `components/capital/north/NorthShell.tsx` | Confirm production build and visual parity. |
| Duplicate file | `lib/capital/eligibility 2.ts` | `lib/capital/eligibility.ts` | Compare exports before deletion. |
| Duplicate file | `lib/capital/investor-readiness 2.ts` | `lib/capital/investor-readiness.ts` | Compare ruleset and compliance references before deletion. |
| Demo/static module | `lib/capital/data.ts` | `lib/capital/repository-server.ts` backed by `api.published_offerings` | Retain as development fixtures until the live import is verified field-for-field. Never use in production when `HNC_USE_FIXTURE_DATA` is unset. |
| Demo/static module | `lib/capital/partner-data.ts` | Supabase portal snapshot, referrals, documents, and fixed tier rules in `lib/capital/commissions.ts` | Retain only for local preview clients until live partner-role regression testing passes. |
| Demo/static module | `lib/capital/portal-demo.ts` | Supabase portal repositories and RLS-filtered API views | Retain for explicit local preview only; never enable preview in production. |
| Replaced component | Legacy offering cards, investor profile, and legacy capital dashboard under `app/hunter-group-capital/**` | HNC one-page explorer, onboarding, fund detail, and interest-request flow | Covered by the obsolete-route approval above. |
| Archived documentation | `docs/archive/**` | None | **Excluded from cleanup.** Business and historical material remains archived. |
| Database/storage dependency | All `supabase/migrations/**`, production rows, offering documents, licence evidence, client documents | None | **Excluded from code cleanup. Never delete through this manifest.** |

## Approval checklist

- Capture 12 months of legacy-route analytics after the production redirect begins.
- Verify public documents and fund deep links have an explicit replacement.
- Verify Supabase contains the current approved `content_snapshot` for every published fund.
- Verify investor, pending-professional, active-partner, firm-admin, and HNC-admin journeys without fixture data.
- Record written approval beside each manifest row before deleting it.

Approval must be item-specific; approving one category does not authorize database, storage, migration, or archived-document deletion.
