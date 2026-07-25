# Social card kit

Renders Instagram and LinkedIn posts from the same palette and the same building
data the site publishes. No Canva, no drift: a building card here shows the same
photo, the same street address and the same "Artist's rendering" tag the offering
page shows.

**No brand lockup, no disclosure footer.** These cards are content, not
letterhead. The only URL that appears is on an explicit CTA slide, where a call
to action needs somewhere to go. Legal copy lives on the site, in `DisclosureBar`.

**Never text alone.** Every spec carries an `art` — a photograph of a real
building, or a figure drawn from the card's own content — and `renderSpec`
throws if one is missing.

```bash
node --env-file=.env.local scripts/social/render.ts
```

Output lands in `output/social/` — PNGs plus a `captions.md` with the copy for
everything just rendered. `output/` is gitignored; the *inputs* (post specs and
captions in `posts.ts`) are what's committed.

## Requirements

- `NEXT_PUBLIC_SUPABASE_URL` — building photos live in the public
  `offering-public` bucket. Without it, image-led cards render empty.
- A local Chrome (or set `CHROME_BIN`). Nothing is installed from npm; the
  renderer drives Chrome over the DevTools Protocol using Node's built-in
  WebSocket.

## Flags

| Flag | Effect |
| --- | --- |
| `--list` | Print the queue and exit |
| `--only <id,id>` | Render specific post ids |
| `--pillar <name>` | `building`, `howitworks`, `compare`, `diligence`, `market`, `pov` |
| `--tier <1\|2>` | Default 1. See *Compliance* below |
| `--platform <ig\|li>` | Override the frame the post declares |
| `--buildings` | Only the auto-generated building series |
| `--limit <n>` | Cap the batch |
| `--html` | Write HTML only, skip Chrome — fast when tuning a template |
| `--out <dir>` | Default `output/social` |

Filenames are `<post-id>.<platform>.png`, and carousels get a `.01`, `.02` … in
slide order so they upload in sequence.

## Compliance

Every post declares a tier, and `--tier 1` is the default:

- **Tier 1** — the asset class, the process, the buildings, our diligence, market
  context. Post freely.
- **Tier 2** — names a specific offering **and** a target return, distribution,
  minimum, or the simulator. That is OM marketing material: it does not leave the
  machine until Parvis compliance signs off. Render it explicitly with
  `--tier 2`.

One rule is enforced in code rather than left to memory: a card with no approved
image **throws** instead of falling back to a stock photo. Exact photo, Street
View of that exact address, or a labelled rendering — nothing else. Run
`scripts/pull-street-view.ts` first. The "Artist's rendering" tag is drawn by
`photoBand` itself, so every surface showing a CGI says so.

The building series is deliberately metric-free (no doors, occupancy or NOI):
the site's `AssetGallery` card shows none, because managers may not publish them,
and a social card must not disclose more than the page it links to. Where a
manager *has* published a number, add `facts` to that one post — the template
then requires a `source` line.

## Templates

| Kind | Frame | Art | Use |
| --- | --- | --- | --- |
| `building` | Photo-led, navy | The photograph is the card | The weekly proof series — one address, one real photo |
| `fact` | Navy | Figure or photo band | One figure, drawn as well as written |
| `carousel` | Navy/cream | Photo (cover, cta) or figure (body, list) | Explainers. Variants: `cover`, `body`, `list`, `cta` |
| `compare` | Navy | Three-path glyph strip by default | Three-column structural comparison |
| `pov` | Photo + scrim | Photo | A quote set over a real building |

### Art

`art.ts` draws the figures, from the card's own content rather than as
decoration — the "15 of 30" dot grid really is 30 dots with 15 filled.

| `art.kind` | What it draws |
| --- | --- |
| `photo` | A real building, by property id, from the seeds |
| `dots` | `filled` of `total`, as a grid |
| `flow` | A vertical chain of labelled steps |
| `skyline` | A row of building silhouettes, some windows lit |
| `paths` | One house · a portfolio · a price line |

## Adding a post

Add an entry to `POSTS` in `posts.ts`: an `id`, the `platform` frames it should
render in, its `tier` and `pillar`, the `spec`, and the `caption` that ships with
it. Then:

```bash
node --env-file=.env.local scripts/social/render.ts --only my-post-id
```

Iterate on a template with `--html` and open the file from `output/social/_html/`
in a browser — no Chrome round-trip per change.

To write a real caption for one of the auto-generated building posts, add an
entry to `POSTS` using the same id (`building-<property-id>`). A hand-authored
post wins and the generated placeholder steps aside, so the two never render to
the same filename.

## Why CDP and not `chrome --headless --screenshot`

`--screenshot` captures the *window*, and on macOS the page lays out in a viewport
78px shorter than `--window-size`, so every card came out with a white band and a
clipped disclosure footer. `Emulation.setDeviceMetricsOverride` sets the viewport
directly, so 1080×1350 in means 1080×1350 out. It also keeps one browser alive for
the whole batch instead of paying a cold start per card. See `chrome.ts`.
