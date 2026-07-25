# Strategy — read when planning a batch, not for a single post

## What "growth" means here

Followers are the wrong number. The ladder is:

impression → profile visit → link click → **account created** → verified →
intro conversation

Tag the bio link so this is measurable: `?src=ig` and `?src=li`. The zero-to-one
target is roughly **50 accounts created and 10 real conversations in 90 days** —
not a follower count.

This matters when choosing what to post. A post that gets 400 likes and no
profile visits did nothing. A post that gets 30 likes from the right thirty
people and two DMs did the job.

## Content pillars

Ratio of about **4 : 3 : 1 : 1 : 1** per ten posts.

| Pillar | `pillar` value | What it is | Leans |
| --- | --- | --- | --- |
| The Building | `building` | One address, one real photo. The flagship weekly slot. | Instagram |
| How it actually works | `howitworks` | Carousels: what an EMD is, why a distribution isn't interest, fund vs. owning a rental | Both |
| The comparison | `compare` | Rental vs. this vs. public markets. Structural arguments, no performance claims | Both |
| Behind the diligence | `diligence` | The address audit, labelled renderings, source-dating, what got corrected | LinkedIn |
| Canada context | `market` | Why Canadian multifamily — supply, immigration, rents. Every figure sourced and dated | Both |
| Jack's view | `pov` | A single opinion, well argued | LinkedIn |

**The building series is the engine.** There are ~39 imaged buildings in the
seeds, which is most of a year of the weekly slot with no new design work:

```bash
node --env-file=.env.local scripts/social/render.ts --buildings
```

Don't burn them all at once, and don't post the same city twice in a row.

## Why the diligence pillar punches above its weight

It's the only pillar a competitor structurally cannot copy, because it requires
having actually done the work: geocoding all 30 addresses and finding 15 plotted
wrong (one 4.7 km out), catching two mis-mapped deck photos, labelling the
architect's renderings as renderings, correcting a building that was in the seed
under the wrong name.

Anything in that vein — a correction, a check that failed, a number that turned
out to be stale — is worth a post. The instinct to hide it is exactly backwards.

## Cadence

- **Instagram** — 3 posts/week, stories most days. Behind-the-scenes of the
  diligence work costs nothing to shoot and is genuinely interesting.
- **LinkedIn** — 3 posts/week, posted as Jack personally.

One production session per week: write and render 6–8 assets in a batch, schedule
them out. Batching is what makes the cadence survivable.

## Growth from zero is manual

The algorithm doesn't help an account with no audience. What does:

- Jack personally messages ~100 people he already knows. Not a broadcast — one at
  a time.
- LinkedIn: ~20 targeted connection requests a day (Canadian advisors and EMD
  people, professionals in his network), and ~10 substantive comments a day on
  other people's posts. **Comments out-reach posts** until there's an audience.
- Launch with a 9-post grid already up, so a first-time visitor never lands on an
  empty profile.
- Weeks 9–16: lock a recurring named slot (the building of the week), one or two
  collaborations, and a lead magnet — a plain-language explainer PDF behind an
  email capture.

## Sequencing a first month

1. **Weeks 1–2** — the 9-post launch grid: 4 buildings, 1 carousel (6 slides),
   the comparison, 2 diligence, 1 POV.
2. **Weeks 3–8** — settle the rhythm: building Monday, explainer Wednesday,
   POV or diligence Friday. Manual outreach every day.
3. **Weeks 9–16** — add the lead magnet and the first collaboration; start
   reading which pillar actually drives account creation and shift the ratio
   toward it.
