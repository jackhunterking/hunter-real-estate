# Working in this repo

## What this repo is

**Hunter Group Real Estate** (`jackhunter.com`) — the real-estate and mortgage
site. RE/MAX Hallmark for real estate, Real Mortgage Associates for mortgages.

The **Equity Market** investor portal used to live here and no longer does. It
is a separate business with a separate regulator, and moved to its own repo:
`github.com/jackhunterking/equity-market`. Anything about offerings, investors,
Supabase schema or securities disclosure belongs there, not here.

What is left of that relationship in this repo:

- `lib/portal-link.ts` — the one place the portal's URL is defined. Set
  `NEXT_PUBLIC_PORTAL_URL` when the portal's domain changes; do not hardcode it.
- `middleware.ts` 301s every path the portal used to occupy
  (`/equity-market`, `/hunter-advisory`, `/investing`, the legacy capital
  routes) to that domain.
- `lib/email/templates.ts` and `app/api/cron/email-jobs` still drain
  `app.email_jobs`, which is shared with the portal. Jobs are claimed atomically
  and sent with a Resend idempotency key, so both apps draining it is safe.
  The Supabase **migrations** live in the portal repo, which owns the schema.

## Social media

Any Hunter & Hunter / Jack Hunter social media work — a post, a caption, a
carousel, a building post, a week's batch, a hook rewrite, anything destined for
Instagram, Facebook or LinkedIn — goes through the **`hunter-social`** skill
(`.claude/skills/hunter-social/`). Invoke it before drafting, every time, even
when the request is a single line or doesn't use the word "post". The skill
carries Jack's voice, the compliance tier gate, and the render pipeline; drafting
without it produces work that gets sent back.

Social output carries the Hunter brand. The investor portal rebranded to Equity
Market and moved out, so the two now advertise different names — that is the
current state, not a bug to "fix" mid-post.

This does not cover Jack ve Tara (Turkish, separate business) — that has its own
skill.
