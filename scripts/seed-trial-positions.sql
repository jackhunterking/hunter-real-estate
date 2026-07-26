-- Trial positions for the Asset network section.
--
-- Loads two funded investment applications onto jack@jackhunter.com so the
-- admin-only Asset network has real holdings to draw: 10,000 units of Lankin
-- Apartment REIT and 15,000 units of Epiphany Legacy.
--
-- READ THIS BEFORE RUNNING. These rows are ordinary investment applications.
-- Once written they are indistinguishable from genuine subscriptions to every
-- other surface — the portfolio page will show them as held positions, the
-- Investors section of the admin console will list them, and anything that
-- counts funded applications will count them. That is the point (the network
-- has to read the same data as everything else), but it is also the risk. Two
-- things keep it manageable:
--
--   1. Every row carries the marker note below, so they can always be found.
--   2. The rollback at the bottom of this file removes exactly those rows and
--      nothing else.
--
-- Amounts are not hardcoded. The unit price is read from each offering's live
-- published snapshot, so the amount always equals units × the price the
-- platform is actually publishing. If a manager's price changes, re-running
-- this script rewrites the positions at the new price rather than drifting.
--
-- Run it in the Supabase SQL editor. It is a single transaction and it is
-- idempotent: running it twice leaves two positions, not four.

begin;

with target_user as (
  select user_id
  from app.profiles
  where lower(email) = lower('jack@jackhunter.com')
),

-- The live published snapshot for each offering, which is where the unit price
-- and the offering's real id both come from. Matching the same publication
-- predicate the portal reads on means we can never attach a position to a
-- withdrawn or unpublished version.
published as (
  select
    offering.id            as offering_id,
    offering.slug          as slug,
    (version.content_snapshot -> 'shareClasses' -> 0 -> 'unitPrice' ->> 'value')::numeric as unit_price
  from app.offerings offering
  join app.offering_content_versions version on version.id = offering.current_version_id
  where offering.status = 'published'
    and version.status = 'published'
    and version.effective_at <= now()
    and (version.withdrawal_at is null or version.withdrawal_at > now())
    and (offering.withdrawal_at is null or offering.withdrawal_at > now())
),

wanted (slug, units) as (
  values
    ('lankin-apartment-reit', 10000::numeric),
    ('legacy-epiphany',       15000::numeric)
),

resolved as (
  select
    target_user.user_id,
    published.offering_id,
    wanted.slug,
    wanted.units,
    published.unit_price,
    round(wanted.units * published.unit_price, 2) as amount
  from wanted
  join published on published.slug = wanted.slug
  cross join target_user
),

-- Idempotency: clear any previous run's rows for these offerings before
-- writing. Scoped by the marker note so a genuine subscription by the same
-- account to the same offering is never touched.
cleared as (
  delete from app.investment_applications application
  using resolved
  where application.user_id = resolved.user_id
    and application.offering_id = resolved.offering_id::text
    and application.note = 'TRIAL POSITION - asset network visualisation. Not a real subscription.'
  returning application.id
)

insert into app.investment_applications (
  user_id,
  offering_id,
  amount,
  share_quantity,
  status,
  account_type,
  preferred_contact_channel,
  contact_consent_at,
  submitted_at,
  note
)
select
  resolved.user_id,
  resolved.offering_id::text,
  resolved.amount,
  resolved.units,
  'funded',
  'individual',
  'email',
  now(),
  now(),
  'TRIAL POSITION - asset network visualisation. Not a real subscription.'
from resolved
-- No target user or no published offering means nothing is written, rather
-- than a position attached to the wrong account.
where resolved.user_id is not null;

-- What was written. Check this before committing: two rows, the expected unit
-- counts, and amounts equal to units × the published unit price.
select
  profile.email,
  application.offering_id,
  application.share_quantity as units,
  application.amount,
  round(application.amount / nullif(application.share_quantity, 0), 2) as unit_price,
  application.status,
  application.note
from app.investment_applications application
join app.profiles profile on profile.user_id = application.user_id
where application.note = 'TRIAL POSITION - asset network visualisation. Not a real subscription.'
order by application.amount desc;

commit;

-- ---------------------------------------------------------------------------
-- ROLLBACK — removes exactly the rows this script wrote, and nothing else.
--
-- delete from app.investment_applications
-- where note = 'TRIAL POSITION - asset network visualisation. Not a real subscription.';
-- ---------------------------------------------------------------------------
