# Hunter Group website: decisions and next phase

Started 2026-09-22 from a section-by-section review of huntergroupremax.com.
Phase 1 (home page) is on branch `claude/homepage-refresh`. Everything under
"Next phase" was deliberately deferred. Bring it back up before starting new
website work so nothing is lost.

## Decisions (Jack, 2026-09-22)

- **Team:** Jack Hunter, Tara Hunter and Selin Yılmaz. The group is more than
  two people, so no copy should describe a pair. Asif Karimov stays on the
  mortgage page.
- **Awards:** no years needed.
- **Positioning:** stays "Toronto-based Turkish real estate group". The area
  is Toronto and the GTA; no "across Canada".
- **Contact:** WhatsApp is the point of contact and always the main call to
  action. No phone, email or contact form for now.
- **Logo:** leave the header and footer logo exactly as it is.
- **Tone:** professional. No "family" framing.
- **Hero numbers:** $200M+ in transactions, 10+ years of experience.
- **Services:** the same three cards, with no links. Their eyebrows are
  RE/MAX Hallmark Realty, Real Mortgage Associates and Parvis Invest. (The
  request said "Realm Mortgage Associates"; we treated that as a typo, since
  the brokerage is Real Mortgage Associates.) The licence line lives in the
  footer, not on the cards.

## Phase 1: done on `claude/homepage-refresh`

- Header: the four flag buttons are replaced by a language dropdown
  (`components/LanguageMenu.tsx`, built on the shared `LOCALE_OPTIONS`).
- Hero:
  - The photo collage is replaced by a line-drawn Toronto skyline
    (`components/TorontoSkyline.tsx`).
  - New professional headline and sub-heading in all four languages.
  - WhatsApp is the primary button; "Our Services" is the secondary button.
  - Numbers: $200M+ and 10+.
- About sub-heading describes a team rather than two people.
- Services: new eyebrows, no links, no licence wording on the cards.
- Guides: the unreadable 01 / 02 numbers are removed.
- Team section (built in a separate session and merged here):
  - Selin's card.
  - Resized photos in `public/team/`, replacing the 5 MB and 11 MB originals.
- Awards:
  - The strip moved directly under the team.
  - Logos are now small transparent PNGs (`public/logos/awards/`,
    `remax-logo-dark.png`).
- Font: `app/fonts/Manrope.woff2` rebuilt from the official Manrope with
  Latin Extended-A, so İ, Ş and Ğ no longer fall back to the system font.
  The license is in `app/fonts/Manrope-OFL.txt`.
- Guides:
  - The home page and both guide pages now link to PDFs hosted on the site:
    `public/guides/alis-rehberi.pdf` (3.4 MB, was 9.6 MB on Drive) and
    `public/guides/satis-rehberi.pdf` (3.1 MB, was 9.0 MB).
  - Buyer's guide fixes, made as image edits since the PDF pages are images:
    - "$1,5 milyon" down-payment tiers.
    - The $612,000 example corrected to $36,200.
    - "10.000 / yüzde 14" first-time buyer credit.
    - "BANKADAN".
    - The English line removed.
    - "Collab" removed.
- Footer: mortgage licence line, plus links to the privacy, terms and
  advertising pages.
- Promise sign-off reads "Jack, Tara & Selin".
- The H watermark behind Services, Promise and Contact is hidden on
  phones, where it showed as grey blocks.
- Meta description no longer names only Jack & Tara.

## Still open with Jack

- [ ] Which Instagram / Facebook accounts represent Hunter Group? The footer
  links to jack.ve.tara.remax.
- [ ] The Drive copies of the guides ("Alis Rehberi.pdf", "Satis
  Rehberi.pdf") are unchanged. If ManyChat, Instagram or ads link to them,
  replace them with the files in `public/guides/`, or point those links at
  huntergroupremax.com/guides/…

## Next phase

### Social proof
- [ ] Instagram widget or feed as the site's social proof, near the Promise
  section.
- [ ] Optionally reuse client reviews from the guides (12 named testimonials),
  with each client's consent and a year.

### Other pages
- [ ] **Buyer's and seller's guide pages** (`/rehber/alici`,
  `/rehber/satici`):
  - Today each is a heading, a Turkish mockup image and one Drive button.
  - Turn them into "Buying with us" and "Selling with us": what's inside the
    guide, your process, the team, reviews, then the download.
  - The English page shows the Turkish mockup.
- [ ] **Thank-you pages** (`/rehber/*/tesekkur`):
  - Nothing on the site links to them. The email form (`GuideCard`) was
    replaced with Drive links in commit 361cb7b.
  - They say the guide was emailed, but no email is collected.
  - Decide whether to reconnect them to an email step or rewrite them. Check
    ManyChat and ads before removing anything.
  - Their download button serves the **old 2020 English** PDFs, and the
    sign-off is still "Jack & Tara Hunter".
- [ ] **Mortgage page:**
  - English, French and Spanish visitors read "made simple in Turkish".
  - It repeats itself:
    - four WhatsApp buttons
    - "Who we help" links to the same pages as the topic cards
    - "What shapes your file" appears in the hero and again on all six
      topic pages
    - the "Mortgage hub" block is mostly legal links
  - Trim it to: hero → topics → team → FAQ → one button.
  - The advisor strip says "Jack, Tara & Asif"; confirm it.
  - "Same-day pre-approval" on the buy-a-home page: keep it only if it's
    always true.
- [ ] **Learn page** (`/rehber/ogren`): it's mortgage content filed under
  guides, and its three roadmap cards link nowhere. Move it into the mortgage
  section and link each card to its topic page.

### Guides (the PDFs)
- [ ] There are two sets in use:
  - Drive: the Turkish Hunter Group guides, linked from the home page and the
    guide pages.
  - `public/guides/`: the October 2020 English "Jack Hunter Team" guides
    (18 MB and 12 MB, with jackhunter.com throughout), served by the
    thank-you pages and as the fallback in the guide email.
- [ ] Target: one set in Turkish and English, both branded Hunter Group. The
  Turkish set is now hosted and compressed. Delete the old English files once
  replaced. The Turkish PDFs are image-only (no text layer). Rebuild them from
  the design source so they're searchable and accessible, and so Selin can be
  added (the "Biz kimiz" page and the back cover list only Jack and Tara).
- [ ] Out-of-date content. The buyer's guide items below are fixed in the
  Turkish PDF; check the English 2020 files and the seller's guide:
  - Down payment: the "20% over $1M" rule changed. Since 2024-12-15 the
    5% / 10% tiers apply up to $1.5M.
  - The $612,000 example says $41,800; the correct figure is $36,200.
  - First-time buyer tax credit: the guide says 15% of $5,000. The amount has
    been $10,000 since 2022.
  - "Collab" MLS tool: retired when TRREB moved systems in July 2024. The
    Turkish pages mention it too.
  - "Your home will appreciate" reads like a promise. Soften it.
  - Consider a 2026 programs page: FHSA, RRSP Home Buyers' Plan ($60,000),
    30-year amortization for first-time buyers, Ontario and Toronto
    land-transfer-tax rebates, the GST rebate on new homes.
- [ ] Branding inside the guides:
  - "Jack Hunter Team" and jackhunter.com; Tara and Selin are missing.
  - Instagram jack.h.hunter with 2020 follower counts.
  - Office phone 647.518.9858; confirm it.
- [ ] Quality fixes:
  - Typos.
  - "Four steps" lists five.
  - The seller's guide copies buyer text ("support your purchase").
  - "Attractive to buyers" should say sellers.
  - The same review is worded differently in each guide.
  - Turkish pages:
    - An English line left in: "Here are a few benefits of completing the
      process:"
    - "BANKA'DAN" should be "BANKADAN".
    - A broken sentence on seller page 9.
    - The seller guide shows a buyer page.

### Site-wide
- [ ] Share preview (Open Graph) image: there is none, so WhatsApp link
  previews show no picture.
- [ ] Headings: every section uses the same label plus two-part slogan.
  Consider plainer headings.
- [ ] Page rhythm: with the awards moved onto the light team section, the dark
  sections are the hero, Services, Contact and the footer. Revisit once the
  Instagram section exists.
- [ ] Languages: French and Spanish are machine translations, and every copy
  change has to be made four times. Decide keep or drop for the public site.
  The legal pages exist only in Turkish and English.
- [ ] Speed: every page downloads all four languages' text plus the investor
  portal's (~178 KB, from the client-side `LanguageProvider` and the
  next-intl provider). Split the dictionary into public and portal parts.
- [ ] Metadata:
  - Public pages likely inherit the home page's canonical and hreflang.
    Check each page.
  - Titles still say "Hunter Group Real Estate", matching the logo.
- [ ] Old domain: www.jackhunter.com serves the whole site (200) instead of
  redirecting. Set a 308 redirect to huntergroupremax.com in Vercel's domain
  settings.
- [ ] Menu:
  - "Buying" and "Selling" go to guide download pages.
  - "Investment" (and the footer's "Advisors") goes to Hunter & Hunter
    Investment Advisors, while the services card now says Parvis Invest.
- [ ] Footer:
  - Trim the eight links; four repeat the header.
  - Decide which social accounts to link.
- [ ] Titles: RECO's permitted terms don't include "Real Estate Advisor"
  (Tara, Selin). Low priority, per Jack.
- [ ] Sitemap: 8 of 68 entries are redirects (`/mortgage/araclar`,
  `/mortgage/oranlar`), and 4 are `/hunter-advisory`, whose canonical is the
  advisors domain.

### Unused, to remove
- [ ] Components nothing imports: `HeroSection`, `MortgageTeaser`,
  `CapitalTeaser`, `GuideCard` (unless the email step returns),
  `lib/posthog-server.ts`, and 20 of the 23 files in `components/ui`.
- [ ] `InvestingBridge` and the pages at `/investing` and
  `/hunter-x-capital/**`. Middleware redirects those addresses first, so the
  pages never render.
- [ ] Dictionary blocks nothing reads (all four languages):
  - `capital` (the old "Hunter X Capital" pitch)
  - `capitalTeaser`
  - `mortgage.teaser`
  - `home.services.sell`
  - `contact.address`
  - `footer.logoText`
  - `nav.guides`
  - `mortgage.advisor.names` and `.line`
- [ ] About 18 unused CSS classes: old rate-table and top-bar styles.
- [ ] Files:
  - `public/hunter-x-bg.png` (4 MB)
  - `app/fonts/Lora.woff2`
  - The four `HUNTER_PrimaryLogo_*` files (they still say "Jack Hunter") and
    the three unused `HUNTER_Brandmark_*` colour variants
  - `public/guides/README.md`: served publicly and out of date
  - `public/jack-photo.jpg` (5 MB) and `public/tara-photo.jpg` (11 MB) once
    the new team photos are merged
  - Portal images at the public root (`lankin*`, `legacy*`): move them into
    `public/capital/`
  - Eight empty " 2" folders and `components/LogoStrip 2.tsx` (iCloud
    copies)
- [ ] Docs to archive:
  - `docs/CLAUDE.md`
  - `docs/HANDOFF.md`
  - `docs/HNC_LEGACY_DELETION_MANIFEST.md`
  - `docs/claude-code-phase1-prompt.md`
  - `docs/hunter-merged-site-build-spec.md`

  Also refresh the `docs/README.md` index.
- [ ] Packages nothing uses:
  - `@hookform/resolvers`
  - `react-hook-form`
  - `next-themes`
  - `sonner`
  - `posthog-node`
  - 15 duplicate `@radix-ui/*` entries (the code imports `radix-ui`)
- [ ] Branches that are merged or superseded:
  - Local: `backup/service-cards-clickable`, `redesign/capital-app-portal`,
    `yatirim-surface`.
  - Remote: `claude/ui-contrast-fixes`,
    `claude/funded-portfolio-view-q4771h`,
    `claude/gamified-asset-network-view-l3s567`,
    `claude/home-page-building-variation-11meju`,
    `claude/opportunity-invest-income-tqbo9r`, `social-post-kit`.
  - Decide separately on the unmerged `rebrand/equity-market`, which moves
    the investor portal into its own repo.

### Hard to maintain: give each thing one home
- [ ] One site-details file: the WhatsApp number (copied in six places),
  address, social links, guide links.
- [ ] One team list: names, titles, photos, languages, awards. It would feed
  the team section, the mortgage strip and the sign-offs.
- [ ] One shared WhatsApp icon instead of seven pasted copies.
- [ ] Split `lib/i18n/dictionaries.ts` (3,800+ lines) into public and portal
  parts.
- [ ] Use the locale-aware `Link` from `i18n/navigation`. Today every menu
  click goes through an extra redirect (`/mortgage` → `/en/mortgage`).
- [ ] Move the checkout out of iCloud Drive. That's what causes the " 2"
  copies and the slow git and build.
