# Building card imagery — Street View pull

Building cards show a real image of each property. Precedence per building:

1. **Real photo** (e.g. investor-deck photo) → set on `media.card` in the offering seed.
2. **Google Street View** of the exact address → pulled once by `pull-street-view.ts`, cached in Supabase.
3. **Branded placeholder tile** (navy + initials) → automatic when neither exists. Never a broken image.

The card never invents an image: it's the exact photo, a Street View of that exact address, or the placeholder.

## The key-access plan (works from any computer)

**The Google key is needed only to _pull_ images, never to _display_ them.** Once pulled, an image lives in the public `offering-public` Supabase bucket and the building's `media.card` holds a committed `{bucket, path}` reference. Displaying it needs no key, ever.

So, when someone adds buildings from a machine **without** the key:

- New buildings simply have no `media.card` yet → the portal shows the placeholder tile. Nothing breaks.
- `--report` (no key required) lists exactly which buildings are still awaiting a pull.
- Later, on **any** machine that has the key, run the pull. It's idempotent — it only fills the buildings still missing an image, and skips everything already done.

Nothing is ever blocked by not having the key on a given machine.

## Commands

Always run via `node --env-file=.env.local` so the key + Supabase creds load.

```bash
# What still needs a pull? (NO key required)
node --env-file=.env.local scripts/pull-street-view.ts --report

# Pull to disk for eyeball review only — no upload, no seed edit (needs key)
node --env-file=.env.local scripts/pull-street-view.ts --local /tmp/sv-review

# Pull missing → upload to Supabase → write media.card into the seed (needs key + Supabase)
node --env-file=.env.local scripts/pull-street-view.ts

# Limit to one offering (seed filename prefix)
node --env-file=.env.local scripts/pull-street-view.ts legacy-epiphany

# Re-pull even buildings that already have an image
node --env-file=.env.local scripts/pull-street-view.ts --force

# Re-pull exactly these buildings (overrides both "already has an image" and the
# skiplist) — use it to replace one bad card without touching the curated ones
node --env-file=.env.local scripts/pull-street-view.ts --only lankin-greenstone-park,lankin-huron-heights
```

## Renderings are never passed off as photos

An investor-deck image is sometimes an **architect's rendering**, not a photograph —
typical for an asset built in the last year or two, where Street View still shows the
construction site. A rendering may stay on the card, but it must be marked:
set `"kind": "render"` on that `media.card` in the seed (the alt text should say so
too). Every building card and map popup then shows an "Artist's rendering" tag.
`"kind": "photo"` means it really is a photo of that building.

Aerials are not used either — a top-down drone shot doesn't identify a building at
card size. Prefer, in order: a real ground-level photo → Street View of the exact
address → a labelled rendering → the placeholder tile.

## Curation

Street View quality varies (an empty road, a field, a parked truck, or heavy trees can hide the building). **Always `--local` review first**, then list the bad ids in `street-view-skiplist.json` so they stay on the clean placeholder instead of showing a misleading photo. The skip list is committed, so the decision is documented and re-runs honor it.

## Setup notes

- Key: Google Cloud → create an API key → **restrict to `Street View Static API`** → enable billing (a 30-image pull is well within the free monthly credit). Put it in `.env.local` as `GOOGLE_MAPS_API_KEY`. Never commit it.
- Images are pulled at 640×480 (4:3, matches the card) so `object-cover` keeps Google's baked-in attribution watermark visible — required when displaying Street View.
- Coverage is checked first via the **free** Street View metadata endpoint, so no-coverage addresses cost nothing and are skipped automatically.

## Publishing to the live portal

The pull writes images to Supabase Storage and updates the **seed** (`supabase/seed/offerings/*.json`). The live portal reads the **published** offering, so after a pull re-seed/publish the offering (the existing `api.seed_offering` → compose/publish flow) for the new `media.card` refs to appear in production.
