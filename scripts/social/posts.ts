/**
 * The post queue.
 *
 * A post is a spec plus the caption that ships with it. Two fields keep the
 * compliance line visible at authoring time:
 *
 *   tier 1 — the asset class, the process, the buildings, our diligence, market
 *            context. Post freely.
 *   tier 2 — names a specific offering AND a target return, distribution,
 *            minimum, or the simulator. This is OM marketing material: it does
 *            not leave the machine before Parvis compliance signs off.
 *
 * `render.ts --tier 1` is the safe default when batching.
 *
 * Everything below is tier 1. Nothing here quotes a return figure — that is
 * deliberate, not an oversight. Returns don't grow an audience; proof does.
 *
 * Every post carries `art`: a photograph of a real building, or a figure drawn
 * from the post's own numbers. A card of pure type does not render.
 */
import type { Spec } from "./templates.ts";
import type { Platform } from "./tokens.ts";
import { imagedBuildings } from "./data.ts";

export interface Post {
  id: string;
  /** Which frame(s) to render. */
  platform: Platform[];
  tier: 1 | 2;
  /** Content pillar — used by `--pillar` and by the caption export. */
  pillar: "building" | "howitworks" | "compare" | "diligence" | "market" | "pov";
  spec: Spec;
  caption: string;
}

/* ------------------------------------------------------------------ */
/* Hand-authored posts                                                 */
/* ------------------------------------------------------------------ */

export const POSTS: Post[] = [
  {
    id: "diligence-address-audit",
    platform: ["ig", "li"],
    tier: 1,
    pillar: "diligence",
    spec: {
      kind: "fact",
      // 30 dots, 15 of them filled — the claim, drawn.
      art: { kind: "dots", total: 30, filled: 15 },
      eyebrow: "Behind the diligence",
      value: "15 of 30",
      label: "addresses were plotted in the wrong place",
      body: "Before we showed a single building, we geocoded every address in the portfolio against its own paperwork. Half were off by more than 150 metres. One sat 4.7 km from the building it named. All corrected.",
      source: "Hunter & Hunter address audit · July 2026",
    },
    caption: `We checked 30 addresses. 15 of them were plotted in the wrong place.

Not by a little. One was 2.5 km out. Another 4.7 km. Two buildings that sit next door to each other in real life were 2.3 km apart in the file.

Nobody had done anything wrong on purpose. Coordinates get copied between documents for years and quietly drift. But it means that if you pull a photo of "the building" using those coordinates, you get a photo of some other building entirely — and we found that too: one address that was supposed to be an apartment showed a detached house.

So we geocoded all 30 against the address on the paperwork, corrected every one that was off by more than 150 metres, and re-pulled the imagery from the corrected point.

This is the unglamorous half of the job. Nobody asks to see it. But it's the difference between a portfolio you can check and a portfolio you have to take on faith.`,
  },

  {
    id: "pov-rendering-label",
    platform: ["li"],
    tier: 1,
    pillar: "pov",
    spec: {
      kind: "pov",
      // The quote is about renderings, so it sits over the one card that IS a
      // rendering — and is tagged as one.
      art: { kind: "photo", buildingId: "lankin-park-centre-place" },
      eyebrow: "A rule we hold",
      quote:
        "If the picture is an architect’s drawing, the picture says it’s an architect’s drawing.",
      attribution: "Jack Hunter",
    },
    caption: `Three of the building photos we were handed weren't photos.

Two were architect's renderings. One was a drone shot taken straight down, which tells you the roof exists and nothing else.

There's no rule that says you have to flag that. Renderings are normal in this industry and everyone uses them. But an investor scrolling a portfolio reads an image as evidence, and a rendering is not evidence — it's an intention.

So we re-shot what we could from street level, and the one building still under construction when the last street-level imagery was taken kept its rendering with "Artist's rendering" printed on the card.

It cost us nothing except a slightly less beautiful page. That seems like a fair trade for a page you can trust.`,
  },

  {
    id: "carousel-how-it-works",
    platform: ["ig", "li"],
    tier: 1,
    pillar: "howitworks",
    spec: {
      kind: "carousel",
      slides: [
        {
          variant: "cover",
          art: { kind: "photo", buildingId: "lankin-orenda-court" },
          eyebrow: "How it actually works",
          title: "You can own part of an apartment building without being a landlord.",
          body: "Most people think the choice is a rental property or the stock market. There is a third path, and almost nobody explains it plainly.",
        },
        {
          variant: "body",
          art: {
            kind: "flow",
            steps: [
              { label: "The fund buys the buildings", sub: "Real, occupied, Canadian" },
              { label: "You buy units of the fund", sub: "A share of the whole portfolio" },
              { label: "The mortgage stays with the fund", sub: "Never in your name" },
            ],
          },
          eyebrow: "01 — The structure",
          title: "A fund buys the buildings. You buy a share of the fund.",
          // The diagram already states the three steps — the copy says what
          // they mean instead of repeating them.
          body: "It is the same ownership a landlord has, divided. You get the rent and the appreciation of a whole portfolio; you don't get the mortgage, the tenants or the roof.",
        },
        {
          variant: "body",
          art: {
            kind: "flow",
            steps: [
              { label: "Tenants pay rent", sub: "Monthly, from occupied units" },
              { label: "The manager pays the costs", sub: "Taxes, repairs, insurance, debt" },
              { label: "What's left is distributed", sub: "A share of profit — not interest" },
            ],
          },
          eyebrow: "02 — The income",
          title: "Rent comes in. Costs come out. What’s left is distributed.",
          body: "The word that matters is “distribution”, not “interest”. Nobody owes you a fixed payment. You are paid a share of what the buildings actually earn, on the offering’s schedule — which is why occupancy is the number to watch.",
        },
        {
          variant: "list",
          art: { kind: "skyline" },
          eyebrow: "03 — What you don't do",
          title: "The work stays with the manager.",
          items: [
            "No tenant calls, no vacancies to fill, no repairs to chase.",
            "No mortgage you personally guarantee.",
            "No searching, financing, lawyers or closing costs.",
            "No single building, in one city, carrying your whole position.",
          ],
        },
        {
          variant: "body",
          art: { kind: "photo", buildingId: "legacy-3620-23-ave-s" },
          eyebrow: "04 — The honest part",
          title: "This is a private investment, and private means less liquid.",
          body: "You cannot sell it on a Tuesday afternoon the way you sell a stock. Capital can be lost. There is a minimum, and there are eligibility rules. Anyone who skips this part is selling you something.",
          kicker: "Private-market investments carry risk, including loss of principal.",
        },
        {
          variant: "cta",
          art: { kind: "photo", buildingId: "lankin-huron-heights" },
          eyebrow: "See the portfolio",
          title: "Every building, at its real address, with a real photo.",
          body: "Create an account and look at what's actually in there. No call required to browse.",
        },
      ],
    },
    caption: `"So do I own the building or not?"

It's the question I get most often, and the honest answer is: you own a share of a company that owns the buildings.

That distinction is where all the important details live — who carries the mortgage, who takes the 2 a.m. call, how the income reaches you, and what you give up in exchange (liquidity, mostly).

Swipe for the plain-language version. Slide 5 is the part most people skip.`,
  },

  {
    // A hand-authored building post — overrides the generated placeholder for
    // the same id (see allPosts). Its facts come from the manager's own March
    // 2026 materials, which is why the card can carry them at all.
    id: "building-lankin-orenda-court",
    platform: ["ig"],
    tier: 1,
    pillar: "building",
    spec: {
      kind: "building",
      buildingId: "lankin-orenda-court",
      // No eyebrow — the default reads "Ontario, Canada"; setting the city here
      // just repeats the line underneath.
      facts: [
        { label: "Units", value: "242" },
        { label: "Rented", value: "224 of 242" },
      ],
      source: "Lankin Apartment REIT investor materials · 10 March 2026",
    },
    caption: `Built in 1976. Still 92% rented.

75-90 Orenda Court, Brampton. 242 units, 91 of them townhouses, 948 square feet on average.

Nobody puts a 1976 building on a brochure cover. But a building doesn't earn its place in a portfolio by photographing well — it earns it by being somewhere people want to live at a price that works. 224 of the 242 units were rented as at 10 March 2026, at an average of $1,753 a month.

That's the unfashionable thesis of older multifamily: you aren't betting on a story. You're buying something that is already full, and inheriting the rent roll that made it full.

Source: Lankin Apartment REIT investor materials, March 2026.`,
  },

  {
    id: "compare-three-paths",
    platform: ["ig", "li"],
    tier: 1,
    pillar: "compare",
    spec: {
      kind: "compare",
      // Short glyph labels — the column headers are too long to sit under art.
      art: { kind: "paths", labels: ["One property", "A portfolio", "Listed shares"] },
      eyebrow: "Compare the three paths",
      title: "Buy a rental yourself. Buy stocks. Or invest this way.",
      columns: ["Buying a rental", "Investing with us", "Stocks & index funds"],
      highlight: 1,
      rows: [
        {
          label: "What you own",
          cells: [
            "One property, one address, one city.",
            "A share of a portfolio of real, income-producing Canadian buildings.",
            "A slice of hundreds of listed companies — no building behind it.",
          ],
        },
        {
          label: "Who does the work",
          cells: [
            "You. Tenants, repairs, vacancies, the 2 a.m. call.",
            "Professional managers run the buildings. You hold the units.",
            "Nobody you can reach. You watch the price and wait.",
          ],
        },
        {
          label: "Debt in your name",
          cells: [
            "A mortgage you personally guarantee, plus rate risk.",
            "None. You invest cash and are never on the hook for a loan.",
            "None, unless you borrow to buy.",
          ],
        },
        {
          label: "Getting out",
          cells: [
            "List it, wait, pay the agent and the lawyer.",
            "Private and less liquid — planned exits, not same-day.",
            "Instant, at whatever the market says that morning.",
          ],
        },
      ],
      note: "Structural characteristics, not a performance comparison.",
    },
    caption: `Most people weighing real estate are really choosing between three things, and they compare them on the wrong axis: which one "returns more."

You can't know that in advance. What you can know in advance is what each one asks of you.

One asks for your weekends and your personal credit. One asks you to accept less liquidity in exchange for handing off the work. One asks nothing and gives you nothing to hold.

No return figures in this table on purpose — those are unknowable and I'm not going to pretend otherwise. These are structural facts, and structural facts are what you can actually decide on.`,
  },
];

/* ------------------------------------------------------------------ */
/* Auto-generated: the building series                                 */
/* ------------------------------------------------------------------ */

/**
 * One card per building that has an approved image — the flagship weekly slot.
 * Deliberately metric-free: the site's building card shows no doors/occupancy
 * because managers may not publish them, and a social card must not disclose
 * more than the page it links to. Add `facts` + `source` by hand on a specific
 * post when the manager has published the number.
 */
export function buildingPosts(): Post[] {
  return imagedBuildings().map((b) => ({
    id: `building-${b.id}`,
    platform: ["ig"] as Platform[],
    tier: 1,
    pillar: "building" as const,
    spec: { kind: "building", buildingId: b.id },
    caption: `${b.name} — ${b.city}, ${b.province}.

Part of the portfolio. Real address, real photo, verified against the offering documents.

${b.note ?? ""}`.trim(),
  }));
}

/**
 * Everything renderable: hand-authored posts first, then the building series.
 *
 * A hand-authored post wins over the generated one for the same building — write
 * a real caption for `building-<id>` in POSTS and the placeholder steps aside,
 * rather than both rendering to the same filename.
 */
export function allPosts(): Post[] {
  const authored = new Set(POSTS.map((p) => p.id));
  return [...POSTS, ...buildingPosts().filter((p) => !authored.has(p.id))];
}
