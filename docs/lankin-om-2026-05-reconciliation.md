# Lankin Apartment REIT — reconciled to the Offering Memorandum

**Review date 23 July 2026 · period Q2 2026 · content version v8**

Reconciled against the **Offering Memorandum dated 1 May 2026** (SEDAR filing version,
148 pages) and the audited financial statements for the year ended 31 December 2025 bound
into it. The OM supersedes the March 2026 investor deck and the Q1 2026 fact sheet: it is
the legal document, it is newer, and where marketing material disagreed with it the OM
won. Recorded in `app.offering_reviews`.

**Sources registered** (every figure on the profile resolves to one):

| Key | Document | Allowed to establish |
|---|---|---|
| `lankin-om-2026-05` | Offering Memorandum, 1 May 2026 | Structure, series, fees, redemption, properties, capital, risk |
| `lankin-fs-2025-audit` | Audited statements, y/e 31 Dec 2025 (BDO Canada LLP) | NAV per unit, gross assets |
| `lankin-fact-2026-q1` | Fund Fact Sheet, Q1 2026 | **Only** the targeted return and targeted distribution — the OM publishes neither |
| `lankin-site-2026-07` | lankin.com fund page | Current portfolio count and AUM |
| `renx-2026-05-ottawa` | Public reporting | The Ottawa acquisition |
| `lankin-deck-2026-03` | March 2026 SEDAR deck | Property photography only |

---

## Corrections made — things the site was publishing wrongly

**1. Redemption schedule was wrong.** Published: *Year 1 10% / Year 2 8% / Year 3 6% /
none after*. The OM (Item 5.1.1) sets a different schedule, and one per series:

| Series | Channel | Selling commission | Trailer | Redemption deduction (<6 mo / y1 / y2 / y3 / after) |
|---|---|---|---|---|
| A | Exempt market dealer | up to 8% | nil | **8% / 8% / 7% / 6% / nil** |
| C | CIRO dealer | nil | 1% of NAV | 3% within 6 months, nil after |
| D | CIRO dealer | 5% | 0.75% of NAV | 8% / 8% / 7% / 6% / nil |
| D-U | CIRO dealer, USD | 5% | 0.75% of NAV | 8% / 8% / 7% / 6% / nil |
| F | Fee-based accounts | nil | nil | nil |

All five carry a $5,000 minimum and a marketing fee of up to 2%.

**2. `isInvestmentFund` was `true`; the OM says otherwise.** Item 2.1.2 and risk 10.2.24
state the Trust "is not, and will not become, a 'mutual fund' or 'non-redeemable
investment fund' as defined by applicable Canadian securities legislation". It qualifies
as a *mutual fund trust* only for **Income Tax Act** purposes — a different definition.
This is not cosmetic: [`ontario-investor-assessment.ts:215`](../lib/capital/ontario-investor-assessment.ts)
gates the offering-memorandum exemption on `!isInvestmentFund`, because that exemption is
unavailable to investment funds. The wrong flag was suppressing the very route this Trust
distributes under (the OM confirms it files on SEDAR only as required by NI 45-106 s.2.9).

**3. One share class became five.** The profile carried "Class A (Series A)". The Trust
offers Class A Units in five series: A, C, D, D-U and F. Series D and D-U currently have
nil units outstanding but are offered, so they belong on the profile.

**4. Unit price.** Published $10.74 (from deck page 12). The audited net assets per unit
at 31 December 2025 are **Series A $10.61, Series C $10.95, Series F $11.24** — the Series
A figure is corroborated by the 24 April 2026 subscription price in Item 4.3.

**5. Management fee restated.** "0.70% of AUM" → **0.7% of Gross Asset Value per year,
paid monthly**. Gross Asset Value is a defined term: the Partnership's total assets per
the financial statements at each 31 December.

**6. Fund term — the deck was wrong, the site was right.** The March deck's page 17 said
"close-ended fund with redemption at the end of year 5". OM Item 2.1.2: the Trust is an
**open-ended** unincorporated trust with Units offered on a continuous basis. The
published "open-ended" stands. Redemption Dates are the last day of each month, on 90
days' written notice.

**7. Every property renamed and re-addressed** to the OM's Item 2.4 table.

---

## The two unnamed Brampton buildings — resolved

OM Item 2.4 names them outright:

- **242 units = Orenda Court Property, 75-90 Orenda Court, Brampton** — built 1976, 948 sq ft
  average including 91 townhouses, 224 of 242 rented at 10 Mar 2026, average rent $1,753.
- **219 units = 4 Silver Maple Court Property, 4 Silver Maple Court, Brampton** — built 1982,
  1,009 sq ft average, 211 of 219 rented, average rent $1,840.

Public reporting had said the towers at 2 and 4 Silver Maple hold a combined 461 units,
which coincidentally equals 242 + 219 and sent me the wrong way. The OM is unambiguous:
**2 Silver Maple Court is not in this Trust.** Orenda Court is, and the deck's "242 units
through four apartment complexes" matches its four street numbers.

## Full portfolio, per the OM

Eight buildings, **1,434 units** — reconciling exactly with the deck and fact sheet.
Occupancy as at 10 March 2026.

| Property | Address | Units | Built | Occupied | Avg rent |
|---|---|---:|---|---|---|
| Park Centre Place | 2014 Sherwood Drive, Edmonton, AB | 177 | 2023 | 165/177 | $2,067 |
| Huron Heights | 75-77 Huron Heights Drive, Newmarket, ON | 110 | 1963 | 107/110 | $1,795 |
| Orenda Court | 75-90 Orenda Court, Brampton, ON | 242 | 1976 | 224/242 | $1,753 |
| 4 Silver Maple Court | 4 Silver Maple Court, Brampton, ON | 219 | 1982 | 211/219 | $1,840 |
| Greenstone Park | 11350 128 Street NW, Edmonton, AB | 89 | 2022 | 88/89 | $1,896 |
| Darcel Avenue | 7110 Darcel Avenue, Mississauga, ON | 118 | 1971 | 116/118 | $1,591 |
| Queen Frederica | 3045 Queen Frederica Drive, Mississauga, ON | 140 | 1975 | 132/140 | $1,870 |
| 6 Silver Maple Court | 6 Silver Maple Court, Brampton, ON | 339 | 1982 | 324/339 | $1,869 |

6 Silver Maple Court is held through **6 Silver Maple JV LP**, secured by a $97,750,000
facility at 6.25% maturing **1 January 2027**.

Plus, carried and labelled as a post-OM acquisition:

| The Riverwood | 1551 Lycée Place, Ottawa, ON K1G 0E5 | 258 | 23-storey; $72.0M, May 2026 |
|---|---|---:|---|

**The Ottawa property appears nowhere in the OM** — zero mentions across 148 pages,
because it closed after the 1 May 2026 OM date. It is on the profile with that stated
plainly, since omitting a building the manager advertises would be its own inaccuracy.

## AUM — your reasoning was right

The audited figures confirm it. Gross assets of the Partnership at 31 December 2025 were
**$450,705,972** (investment properties $412.1M plus the $19.8M equity-accounted JV
interest). The progression since is coherent:

| As at | Gross assets | Source |
|---|---|---|
| 31 Dec 2025 | $450.7M | Audited statements |
| March 2026 | $489M+ | SEDAR deck |
| Q1 2026 | $510M+ | Fact sheet |
| July 2026 | **$580M+** | lankin.com, post-Ottawa |

$510M + the $72M Ottawa purchase lands almost exactly on $580M+. The profile now publishes
**$580M+**, sourced to the manager's own current page, with the audited $450.7M carried
alongside as a dated portfolio fact.

---

## Also now on the profile, from the OM

Trustee **Olympia Trust Company** ($7,500/year, management delegated to Lankin Apartment
Asset Management Inc.) · investment fund manager **Axcess Capital Advisors Inc.** · exempt
market dealer **Parvis Investment Services Inc.**, with the OM's disclosed conflict that
several Parvis dealing representatives are also employees of the Administrator · maximum
offering **$250,000,000**, no minimum · acquisition, financing and disposition fees of 1%
each · finder's fee up to 3% · guarantee fee up to 1% · profit share fee in the OM's exact
wording · annual cash redemption cap of the greater of $100,000 or 5% of NAV, above which
Redemption Notes may be issued (not qualified investments for Registered Plans) · 22 risk
statements across six categories drawn from OM Item 10 · auditor **BDO Canada LLP**, tax
counsel **Borden Ladner Gervais LLP**.

---

## Open items

1. **The manager's site says 1,694 units; the OM's eight buildings plus Ottawa give 1,692.**
   Two units unaccounted for.
2. **Targeted return (10–14%) and targeted distribution (7–8%) appear only in marketing
   material.** The OM publishes neither, and states that "targeted returns are not
   guaranteed". They remain on the profile sourced to the fact sheet, never to the OM.
   Worth confirming they are still the current targets for Q2 2026.
3. **A photograph for The Riverwood** — the only building without one.
4. **`approvedOntarioExemptions` is still empty**, so the investor assessment reports
   "offering compliance not confirmed" and surfaces no exemption route. The OM points at
   NI 45-106 s.2.9, but approving an exemption route is a licensed compliance decision.
   I left it unset and did not stamp a compliance review that has not happened.
5. **Q2 2026 fact sheet**, when issued, to confirm AUM, unit counts and the current NAV
   per unit for each series.

## Separately: document placement

`offering-public` is a genuinely public Supabase bucket — the fact sheets download
anonymously over plain HTTP with no credentials. The OM's own first page restricts it to
"the confidential use of only those persons to whom it is transmitted", and recipients
agree not to reproduce or make it available to anyone but their professional advisers.
**The OM must not go in `offering-public`**, and the existing fact sheets should move to
`offering-private` with `visibility: approved-investor`, where the signed-URL route already
serves them.

## Not the ninth building

33 Dawson Road, Guelph (80 units) belongs to **Lankin Real Estate Growth LP**, a separate
fund. It appears nowhere in this Trust's OM.
