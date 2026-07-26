# Strategy — read when planning a batch, not for a single post

The weekly grid is in SKILL.md. This is how to fill it well and what to measure.

## What "growth" means here

Followers are the wrong number. The ladder is:

impression → profile visit → link click → **account created** → verified →
intro conversation

Tag the bio link so it's measurable: `?src=ig`, `?src=fb`, `?src=li`. The
zero-to-one target is roughly **50 accounts created and 10 real conversations in
90 days**.

This decides what to post. A post with 400 likes and no profile visits did
nothing. A post with 30 likes from the right thirty people and two DMs did the
job.

## Filling each slot

**Buildings (Mon / Wed / Sat).** ~39 imaged buildings in the seeds — 13 weeks of
runway at three a week. Rotate province and city; never two Lethbridge walk-ups
back to back. List them with:

```bash
node --env-file=.env.local scripts/social/render.ts --list
```

Saturday's is the lightest: photo, address, one line. Monday's and Wednesday's
can carry published facts (units, occupancy) when the manager has published them
— which means a `source` line with a date.

**How it works (Tue).** The recurring questions, one per week, as a carousel:
what a fund actually owns, why a distribution isn't interest, what liquidity you
give up, what an exempt market dealer is, what happens if you need the money
back, how the minimum works. Each of these is a week.

**Question (Thu).** The cheapest post to make and often the best performer,
because it answers what the reader was already privately wondering. Source them
from real conversations — the questions Jack actually gets on calls.

**Comparison / opinion (Fri), alternating.** Comparison is structural: what each
path asks of you, never whose returns are higher. Opinion is a position someone
could argue with.

**Portal (Sun).** Same slot every week. Rotate the angle so it isn't the same
post seven times a quarter:

- every building at its real address, on a map
- the offering documents themselves, not a summary
- no call required to look around
- what you can see before you ever speak to anyone

## What not to post

Returns as a headline. "Opportunities." Countdowns and scarcity. Market
predictions. Process stories about how carefully we work — inward-looking, and
an investor wants to know what they're buying. Anything a fund's marketing
department could have written.

## Cadence and load

One production session a week: write four posts (Tue, Thu, Fri, Sun), render the
three buildings, schedule all seven. Batching is what makes daily survivable —
posting daily *and* writing daily is what burns people out.

Static cards go to Instagram, Facebook and LinkedIn. Video is a later phase and
will go everywhere including YouTube; don't plan for it yet.

## Growth from zero is manual

The algorithm doesn't help an account with no audience. What does:

- Jack personally messages ~100 people he already knows. One at a time, not a
  broadcast.
- LinkedIn: ~20 targeted connection requests a day and ~10 substantive comments
  a day on other people's posts. **Comments out-reach posts** until there's an
  audience.
- Launch with a 9-post grid already up, so a first-time visitor never lands on
  an empty profile.
- Around week 8: a lead magnet — a plain-language explainer PDF behind an email
  capture — and start reading which slot actually drives account creation, then
  give it more days.
