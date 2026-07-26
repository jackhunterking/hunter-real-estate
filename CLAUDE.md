# Working in this repo

## Two businesses, one repo

- **Equity Market** (`equitymarket.io`, `/equity-market`) — the investor portal.
  Jack Hunter's Parvis-approved trade name for private-market investing;
  securities activity runs through Parvis Investment Services Inc. Its code
  lives in `app/[locale]/equity-market/`, `components/equity-market/` and
  `lib/equity-market/`, and its name comes from `INVESTMENT_BRAND` in
  `lib/equity-market/investment-brand.ts` — never hardcode it.
- **Hunter Group Real Estate** (`jackhunter.com`) — the real-estate and mortgage
  site. Different business, different regulator (FSRA), and it keeps the Hunter
  brand.

The two are interleaved in `lib/i18n/dictionaries.ts` and `lib/email/templates.ts`,
so never run a blanket find/replace on "Hunter". `tests/rebrand-guard.test.ts`
fails if a retired brand token reappears in portal source.

## Social media

Any Hunter & Hunter / Jack Hunter social media work — a post, a caption, a
carousel, a building post, a week's batch, a hook rewrite, anything destined for
Instagram, Facebook or LinkedIn — goes through the **`hunter-social`** skill
(`.claude/skills/hunter-social/`). Invoke it before drafting, every time, even
when the request is a single line or doesn't use the word "post". The skill
carries Jack's voice, the compliance tier gate, and the render pipeline; drafting
without it produces work that gets sent back.

Social output still carries the Hunter brand — the rename covered the portal
only, so the social kit and the portal now advertise different names. Treat that
as an open item, not a bug to "fix" mid-post.

This does not cover Jack ve Tara (Turkish, separate business) — that has its own
skill.
