grant usage on schema app to anon;

alter role authenticator set pgrst.db_schemas = 'api';
notify pgrst, 'reload config';

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

create index if not exists idx_audit_events_actor_user_id_fkey
  on private.audit_events(actor_user_id);
create index if not exists idx_email_suppressions_source_event_id_fkey
  on private.email_suppressions(source_event_id);
create index if not exists idx_retention_actions_performed_by_fkey
  on private.retention_actions(performed_by);

drop policy commissions_hunter_write on app.commission_entries;
create policy commissions_hunter_insert
on app.commission_entries for insert to authenticated
with check (
  (select private.has_platform_role('finance_admin'::app.platform_role))
  or (select private.has_platform_role('platform_admin'::app.platform_role))
);
create policy commissions_hunter_update
on app.commission_entries for update to authenticated
using (
  (select private.has_platform_role('finance_admin'::app.platform_role))
  or (select private.has_platform_role('platform_admin'::app.platform_role))
)
with check (
  (select private.has_platform_role('finance_admin'::app.platform_role))
  or (select private.has_platform_role('platform_admin'::app.platform_role))
);
create policy commissions_hunter_delete
on app.commission_entries for delete to authenticated
using (
  (select private.has_platform_role('finance_admin'::app.platform_role))
  or (select private.has_platform_role('platform_admin'::app.platform_role))
);

drop policy documents_hunter_write on app.document_records;
drop policy documents_owner_insert on app.document_records;
create policy documents_owner_or_hunter_insert
on app.document_records for insert to authenticated
with check (
  (
    owner_user_id = (select auth.uid())
    and access = 'private_user'::app.document_access
  )
  or (select private.is_hunter_admin())
);
create policy documents_hunter_update
on app.document_records for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));
create policy documents_hunter_delete
on app.document_records for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy investments_hunter_update on app.investment_applications;
drop policy investments_owner_update_preapproval on app.investment_applications;
create policy investments_owner_or_hunter_update
on app.investment_applications for update to authenticated
using (
  (
    user_id = (select auth.uid())
    and status in (
      'draft'::app.investment_application_status,
      'submitted'::app.investment_application_status
    )
  )
  or (select private.is_hunter_admin())
)
with check (
  (
    user_id = (select auth.uid())
    and status in (
      'draft'::app.investment_application_status,
      'submitted'::app.investment_application_status
    )
  )
  or (select private.is_hunter_admin())
);

drop policy offering_access_hunter_write on app.organization_offering_access;
create policy offering_access_hunter_insert
on app.organization_offering_access for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy offering_access_hunter_update
on app.organization_offering_access for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));
create policy offering_access_hunter_delete
on app.organization_offering_access for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy organization_private_details_hunter_write on app.organization_private_details;
create policy organization_private_details_hunter_insert
on app.organization_private_details for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy organization_private_details_hunter_update
on app.organization_private_details for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));
create policy organization_private_details_hunter_delete
on app.organization_private_details for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy partner_accounts_hunter_write on app.partner_accounts;
create policy partner_accounts_hunter_insert
on app.partner_accounts for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy partner_accounts_hunter_update
on app.partner_accounts for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));
create policy partner_accounts_hunter_delete
on app.partner_accounts for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy partner_applications_hunter_update on app.partner_applications;
drop policy partner_applications_update_own_preapproval on app.partner_applications;
create policy partner_applications_owner_or_hunter_update
on app.partner_applications for update to authenticated
using (
  (
    user_id = (select auth.uid())
    and status in (
      'draft'::app.partner_application_status,
      'submitted'::app.partner_application_status,
      'changes_requested'::app.partner_application_status
    )
  )
  or (select private.is_hunter_admin())
)
with check (
  (
    user_id = (select auth.uid())
    and status in (
      'draft'::app.partner_application_status,
      'submitted'::app.partner_application_status,
      'changes_requested'::app.partner_application_status
    )
  )
  or (select private.is_hunter_admin())
);

drop policy platform_roles_platform_admin_write on app.platform_role_assignments;
create policy platform_roles_platform_admin_insert
on app.platform_role_assignments for insert to authenticated
with check ((select private.has_platform_role('platform_admin'::app.platform_role)));
create policy platform_roles_platform_admin_update
on app.platform_role_assignments for update to authenticated
using ((select private.has_platform_role('platform_admin'::app.platform_role)))
with check ((select private.has_platform_role('platform_admin'::app.platform_role)));
create policy platform_roles_platform_admin_delete
on app.platform_role_assignments for delete to authenticated
using ((select private.has_platform_role('platform_admin'::app.platform_role)));

drop policy credentials_hunter_write on app.regulatory_credentials;
create policy credentials_hunter_insert
on app.regulatory_credentials for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy credentials_hunter_update
on app.regulatory_credentials for update to authenticated
using ((select private.is_hunter_admin()))
with check ((select private.is_hunter_admin()));
create policy credentials_hunter_delete
on app.regulatory_credentials for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_offerings_read on app.offerings;
drop policy offering_admin_all on app.offerings;
create policy published_offerings_anon_read
on app.offerings for select to anon
using (status = 'published' and (withdrawal_at is null or withdrawal_at > now()));
create policy offerings_authenticated_read
on app.offerings for select to authenticated
using (
  (status = 'published' and (withdrawal_at is null or withdrawal_at > now()))
  or (select private.is_hunter_admin())
);
create policy offerings_admin_insert on app.offerings for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy offerings_admin_update on app.offerings for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy offerings_admin_delete on app.offerings for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_versions_read on app.offering_content_versions;
drop policy offering_versions_admin_all on app.offering_content_versions;
create policy published_versions_anon_read
on app.offering_content_versions for select to anon
using (
  status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now())
);
create policy offering_versions_authenticated_read
on app.offering_content_versions for select to authenticated
using (
  (
    status = 'published'
    and effective_at <= now()
    and (withdrawal_at is null or withdrawal_at > now())
  )
  or (select private.is_hunter_admin())
);
create policy offering_versions_admin_insert on app.offering_content_versions for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy offering_versions_admin_update on app.offering_content_versions for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy offering_versions_admin_delete on app.offering_content_versions for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_managers_read on app.fund_managers;
drop policy managers_admin_all on app.fund_managers;
create policy published_managers_anon_read
on app.fund_managers for select to anon
using (
  exists (
    select 1
    from app.offerings offering
    where offering.manager_id = fund_managers.id
      and offering.status = 'published'
      and (offering.withdrawal_at is null or offering.withdrawal_at > now())
  )
);
create policy managers_authenticated_read
on app.fund_managers for select to authenticated
using (
  exists (
    select 1
    from app.offerings offering
    where offering.manager_id = fund_managers.id
      and offering.status = 'published'
      and (offering.withdrawal_at is null or offering.withdrawal_at > now())
  )
  or (select private.is_hunter_admin())
);
create policy managers_admin_insert on app.fund_managers for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy managers_admin_update on app.fund_managers for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy managers_admin_delete on app.fund_managers for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_share_classes_read on app.share_classes;
drop policy share_classes_admin_all on app.share_classes;
create policy published_share_classes_anon_read
on app.share_classes for select to anon
using (
  status = 'published'
  and exists (
    select 1
    from app.offerings offering
    where offering.id = share_classes.offering_id
      and offering.status = 'published'
      and (offering.withdrawal_at is null or offering.withdrawal_at > now())
  )
);
create policy share_classes_authenticated_read
on app.share_classes for select to authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from app.offerings offering
      where offering.id = share_classes.offering_id
        and offering.status = 'published'
        and (offering.withdrawal_at is null or offering.withdrawal_at > now())
    )
  )
  or (select private.is_hunter_admin())
);
create policy share_classes_admin_insert on app.share_classes for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy share_classes_admin_update on app.share_classes for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy share_classes_admin_delete on app.share_classes for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_properties_read on app.properties;
drop policy properties_admin_all on app.properties;
create policy published_properties_anon_read
on app.properties for select to anon
using (status = 'published');
create policy properties_authenticated_read
on app.properties for select to authenticated
using (status = 'published' or (select private.is_hunter_admin()));
create policy properties_admin_insert on app.properties for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy properties_admin_update on app.properties for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy properties_admin_delete on app.properties for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_offering_properties_read on app.offering_properties;
drop policy offering_properties_admin_all on app.offering_properties;
create policy published_offering_properties_anon_read
on app.offering_properties for select to anon
using (
  exists (
    select 1
    from app.offerings offering
    where offering.id = offering_properties.offering_id
      and offering.status = 'published'
  )
);
create policy offering_properties_authenticated_read
on app.offering_properties for select to authenticated
using (
  exists (
    select 1
    from app.offerings offering
    where offering.id = offering_properties.offering_id
      and offering.status = 'published'
  )
  or (select private.is_hunter_admin())
);
create policy offering_properties_admin_insert on app.offering_properties for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy offering_properties_admin_update on app.offering_properties for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy offering_properties_admin_delete on app.offering_properties for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_sources_read on app.source_references;
drop policy sources_admin_all on app.source_references;
create policy published_sources_anon_read
on app.source_references for select to anon
using (
  exists (
    select 1
    from app.offering_content_versions version
    where version.id = source_references.offering_version_id
      and version.status = 'published'
      and version.effective_at <= now()
      and (version.withdrawal_at is null or version.withdrawal_at > now())
  )
);
create policy sources_authenticated_read
on app.source_references for select to authenticated
using (
  exists (
    select 1
    from app.offering_content_versions version
    where version.id = source_references.offering_version_id
      and version.status = 'published'
      and version.effective_at <= now()
      and (version.withdrawal_at is null or version.withdrawal_at > now())
  )
  or (select private.is_hunter_admin())
);
create policy sources_admin_insert on app.source_references for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy sources_admin_update on app.source_references for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy sources_admin_delete on app.source_references for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_metrics_read on app.offering_metrics;
drop policy metrics_admin_all on app.offering_metrics;
create policy published_metrics_anon_read
on app.offering_metrics for select to anon
using (
  exists (
    select 1
    from app.offering_content_versions version
    where version.id = offering_metrics.offering_version_id
      and version.status = 'published'
      and version.effective_at <= now()
      and (version.withdrawal_at is null or version.withdrawal_at > now())
  )
);
create policy metrics_authenticated_read
on app.offering_metrics for select to authenticated
using (
  exists (
    select 1
    from app.offering_content_versions version
    where version.id = offering_metrics.offering_version_id
      and version.status = 'published'
      and version.effective_at <= now()
      and (version.withdrawal_at is null or version.withdrawal_at > now())
  )
  or (select private.is_hunter_admin())
);
create policy metrics_admin_insert on app.offering_metrics for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy metrics_admin_update on app.offering_metrics for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy metrics_admin_delete on app.offering_metrics for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_offering_documents_read on app.offering_documents;
drop policy offering_documents_admin_all on app.offering_documents;
create policy published_offering_documents_anon_read
on app.offering_documents for select to anon
using (
  status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now())
);
create policy offering_documents_authenticated_read
on app.offering_documents for select to authenticated
using (
  (
    status = 'published'
    and effective_at <= now()
    and (withdrawal_at is null or withdrawal_at > now())
  )
  or (select private.is_hunter_admin())
);
create policy offering_documents_admin_insert on app.offering_documents for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy offering_documents_admin_update on app.offering_documents for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy offering_documents_admin_delete on app.offering_documents for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_guides_read on app.guide_assets;
drop policy guides_admin_all on app.guide_assets;
create policy published_guides_anon_read
on app.guide_assets for select to anon
using (
  status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now())
);
create policy guides_authenticated_read
on app.guide_assets for select to authenticated
using (
  (
    status = 'published'
    and effective_at <= now()
    and (withdrawal_at is null or withdrawal_at > now())
  )
  or (select private.is_hunter_admin())
);
create policy guides_admin_insert on app.guide_assets for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy guides_admin_update on app.guide_assets for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy guides_admin_delete on app.guide_assets for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy published_legal_read on app.legal_document_versions;
drop policy legal_admin_all on app.legal_document_versions;
create policy published_legal_anon_read
on app.legal_document_versions for select to anon
using (
  status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now())
);
create policy legal_authenticated_read
on app.legal_document_versions for select to authenticated
using (
  (
    status = 'published'
    and effective_at <= now()
    and (withdrawal_at is null or withdrawal_at > now())
  )
  or (select private.is_hunter_admin())
);
create policy legal_admin_insert on app.legal_document_versions for insert to authenticated
with check ((select private.is_hunter_admin()));
create policy legal_admin_update on app.legal_document_versions for update to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy legal_admin_delete on app.legal_document_versions for delete to authenticated
using ((select private.is_hunter_admin()));

drop policy guides_published_read on storage.objects;
drop policy offering_public_published_read on storage.objects;
drop policy partner_credentials_owner_read on storage.objects;
drop policy partner_credentials_owner_insert on storage.objects;
drop policy partner_credentials_owner_update on storage.objects;
drop policy partner_credentials_owner_delete on storage.objects;
drop policy client_documents_owner_read on storage.objects;
drop policy client_documents_owner_insert on storage.objects;
drop policy client_documents_owner_update on storage.objects;
drop policy client_documents_owner_delete on storage.objects;
drop policy private_offering_hunter_only on storage.objects;

create policy storage_objects_anon_published_read
on storage.objects for select to anon
using (
  (
    bucket_id = 'guides-public'
    and exists (
      select 1
      from app.guide_assets asset
      where asset.bucket_id = bucket_id
        and asset.storage_path = name
        and asset.status = 'published'
        and asset.effective_at <= now()
        and (asset.withdrawal_at is null or asset.withdrawal_at > now())
    )
  )
  or (
    bucket_id = 'offering-public'
    and exists (
      select 1
      from app.offering_documents document
      where document.bucket_id = bucket_id
        and document.storage_path = name
        and document.status = 'published'
        and document.effective_at <= now()
        and (document.withdrawal_at is null or document.withdrawal_at > now())
    )
  )
);

create policy storage_objects_authenticated_read
on storage.objects for select to authenticated
using (
  (
    bucket_id = 'guides-public'
    and exists (
      select 1
      from app.guide_assets asset
      where asset.bucket_id = bucket_id
        and asset.storage_path = name
        and asset.status = 'published'
        and asset.effective_at <= now()
        and (asset.withdrawal_at is null or asset.withdrawal_at > now())
    )
  )
  or (
    bucket_id = 'offering-public'
    and exists (
      select 1
      from app.offering_documents document
      where document.bucket_id = bucket_id
        and document.storage_path = name
        and document.status = 'published'
        and document.effective_at <= now()
        and (document.withdrawal_at is null or document.withdrawal_at > now())
    )
  )
  or (
    bucket_id = 'partner-credentials'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_hunter_admin())
    )
  )
  or (
    bucket_id = 'client-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_hunter_admin())
    )
  )
  or (
    bucket_id in ('offering-public', 'offering-private')
    and (select private.is_hunter_admin())
  )
);

create policy storage_objects_authenticated_insert
on storage.objects for insert to authenticated
with check (
  (
    bucket_id = 'partner-credentials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  or (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  or (
    bucket_id in ('offering-public', 'offering-private')
    and (select private.is_hunter_admin())
  )
);

create policy storage_objects_authenticated_update
on storage.objects for update to authenticated
using (
  (
    bucket_id = 'partner-credentials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  or (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  or (
    bucket_id in ('offering-public', 'offering-private')
    and (select private.is_hunter_admin())
  )
)
with check (
  (
    bucket_id = 'partner-credentials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  or (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  or (
    bucket_id in ('offering-public', 'offering-private')
    and (select private.is_hunter_admin())
  )
);

create policy storage_objects_authenticated_delete
on storage.objects for delete to authenticated
using (
  (
    bucket_id = 'partner-credentials'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_hunter_admin())
    )
  )
  or (
    bucket_id = 'client-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_hunter_admin())
    )
  )
  or (
    bucket_id in ('offering-public', 'offering-private')
    and (select private.is_hunter_admin())
  )
);
