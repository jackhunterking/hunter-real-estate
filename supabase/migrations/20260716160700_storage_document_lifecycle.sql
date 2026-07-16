insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('guides-public', 'guides-public', false, 20971520, array['application/pdf']),
  ('offering-public', 'offering-public', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png']),
  ('offering-private', 'offering-private', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png']),
  ('partner-credentials', 'partner-credentials', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('client-documents', 'client-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy guides_published_read
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'guides-public'
  and exists (
    select 1 from app.guide_assets asset
    where asset.bucket_id = bucket_id
      and asset.storage_path = name
      and asset.status = 'published'
      and asset.effective_at <= now()
      and (asset.withdrawal_at is null or asset.withdrawal_at > now())
  )
);

create policy offering_public_published_read
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'offering-public'
  and exists (
    select 1 from app.offering_documents document
    where document.bucket_id = bucket_id
      and document.storage_path = name
      and document.status = 'published'
      and document.effective_at <= now()
      and (document.withdrawal_at is null or document.withdrawal_at > now())
  )
);

create policy partner_credentials_owner_read
on storage.objects for select to authenticated
using (
  bucket_id = 'partner-credentials'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_hunter_admin())
  )
);
create policy partner_credentials_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'partner-credentials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy partner_credentials_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'partner-credentials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'partner-credentials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy partner_credentials_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'partner-credentials'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_hunter_admin())
  )
);

create policy client_documents_owner_read
on storage.objects for select to authenticated
using (
  bucket_id = 'client-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_hunter_admin())
  )
);
create policy client_documents_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy client_documents_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy client_documents_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'client-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_hunter_admin())
  )
);

create policy private_offering_hunter_only
on storage.objects for all to authenticated
using (
  bucket_id in ('offering-public', 'offering-private')
  and (select private.is_hunter_admin())
)
with check (
  bucket_id in ('offering-public', 'offering-private')
  and (select private.is_hunter_admin())
);
