# Hunter Advisory controlled-content rollout

The application now reads public and authenticated fund screens from the server-side `api.published_offerings` repository. Static fund records are permitted only outside production when Supabase is not configured, or when `HNC_USE_FIXTURE_DATA=true` is explicitly set for local development. Production never falls back to fixtures.

## Import and publication sequence

1. Match each fixture manager to `app.fund_managers` and each fund slug to `app.offerings`.
2. Create a new `app.offering_content_versions` row as `draft`. Its `content_snapshot` must validate as a complete `OfferingBundle` and include only source-approved public or access-controlled document metadata.
3. Assign a distinct author, reviewer, and compliance owner. Move the record through `draft → in_review → approved → published`; the database trigger blocks skipped publication stages.
4. Populate effective, publication, source, and withdrawal dates. Set `app.offerings.current_version_id` only to the approved current version and publish the offering only when issuer/dealer/legal approval is recorded.
5. Verify the anonymous `api.published_offerings` response and compare every public field, document, property, metric, source date, and localized string against the approved source.
6. Remove `HNC_USE_FIXTURE_DATA`, run the full role matrix and production build, then approve the static-module rows in the deletion manifest separately.

No remote import was executed from this workspace because no Supabase project credentials are configured. The migration and repository are ready to apply through the normal reviewed deployment pipeline.
