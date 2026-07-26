# Hunter Group — Merged Site Build Spec

**Folding Kredibaba into jackhunter.com as one Next.js site**

Prepared for Jack Hunter · Hunter Group Real Estate / Real Mortgage Associates

---

## 1. Decision summary

- **One domain, one app.** Everything lives in the existing Next.js (App Router) project at `jackhunter.com`. Kredibaba's standalone brand retires; its content becomes a section.
- **Mortgage is the hero.** The mortgage/borrowing side gets a top-level tab and the bulk of the attention, because that's where the volume and the Meta/WhatsApp funnel live.
- **Equity Market is consolidated** as the canonical Capital experience at `/hunter-group-capital`; legacy `/hunter-x-capital` URLs redirect there.
- **Two regulated identities stay walled.** Real estate (RE/MAX Hallmark, RECO) and mortgage (Real Mortgage Associates, FSRA) share a domain but never blur — separate disclosures, separate brokerage identity per service.
- **The kredibaba logged-in app is parked, not merged.** Dashboard/Documents/Properties/etc. are a separate future product, not part of this site.

This is a **content + feature port**, not a file copy: Hunter is Next.js (SSR), kredibaba is a Vite/React SPA. Components get re-implemented; the bilingual copy (i18n, ~1,165 lines TR/EN) moves over as data.

---

## 2. Merged route tree (what it looks like)

```
app/
├── layout.tsx                      ← global Nav + Footer (existing, extended)
├── page.tsx                        ← homepage (re-sequenced, see §3)
│
├── mortgage/                      ← NEW — the hero tab (ported from kredibaba)
│   ├── page.tsx                    ← rate-first landing + journey cards
│   ├── [intent]/page.tsx           ← one page per borrowing journey:
│   │                                  ev-almak · yenileme · tadilat ·
│   │                                  borc-toparlama · ev-degeri · heloc
│   ├── oranlar/page.tsx            ← permanent redirect to `/mortgage`
│   └── araclar/page.tsx            ← calculator hub (6 tools, anchored)
│
├── hunter-x-capital/
│   └── page.tsx                    ← SHRUNK to a lean single section
│
├── rehber/                         ← existing guide funnels + folded Learn content
│   ├── alici/  (+ /tesekkur)
│   └── satici/ (+ /tesekkur)
│
├── (legal)/                        ← NEW — ported from kredibaba
│   ├── gizlilik/page.tsx           ← Privacy
│   ├── kullanim-kosullari/page.tsx ← Terms
│   └── reklam-aciklamasi/page.tsx  ← Advertising / rate disclosure
│
└── api/
    └── lead-capture/route.ts       ← existing Resend handler (reused for Mortgage leads)
```

---

## 3. Navigation & homepage

**Current nav:** Hakkımızda · Hizmetler · Equity Market · Rehberler · İletişim

**New nav:**

```
Hakkımızda  ·  Hizmetler (Alım / Satım)  ·  FİNANSMAN  ·  Rehberler  ·  İletişim
```

Capital uses the canonical `/hunter-group-capital` route and remains separated from the consumer mortgage funnel. Mortgage remains the most prominent financing tab.

**Homepage section order (`app/page.tsx`):** the current single-page flow stays, with one insert and one demotion:

```
HomeHero → AboutSection → ServicesSection → [NEW] MortgageTeaser
→ CapitalTeaser (shrunk) → GuidesSection → PromiseSection → LogoStrip → ContactSection → Footer
```

`MortgageTeaser` is a new homepage block (service guidance + "see your options" CTA) that points into `/mortgage`.

---

## 4. The Mortgage tab — internal structure

Mirrors the IA already defined in `KREDIBABA_EXPERIENCE_PLAN.md`, kept as three clean layers so the borrow-vs-invest confusion never returns.

**Journeys (why they need financing)** → `/mortgage/[intent]`
- Ev almak istiyorum
- Ev kredimi yenilemek
- Tadilat için mortgage
- Borç ödemelerini rahatlatmak
- Ev değerinden yararlanmak (HELOC)
- Mortgage seçeneklerini incelemek

**Personas (who they are)** → cards within `/mortgage`, linking into the relevant journey
- İlk ev alıcıları · Ev sahipleri · Ev sahipleri / yatırımcılar · Şirket sahibi / serbest meslek · Kanada'ya yeni gelenler

**Tools (what supports the journey)** → `/mortgage/araclar`
- Ön onay (kept as a tool/step, never a standalone solution)
- Mortgage hesaplayıcı · Uygunluk hesaplayıcı · Kapanış masrafı · Tapu devir vergisi · Ödeme farkı

**Mortgage options** → `/mortgage` (file-specific educational guidance; no displayed rates)

---

## 5. Port / reuse / build matrix

| Piece | Kredibaba source | Target in Hunter | Action |
|---|---|---|---|
| Mortgage service teaser | `pages/Home.jsx` | `MortgageTeaser` + `/mortgage` | **Port** (re-implement in Next without rate data) |
| Mortgage option guidance | Mortgage landing and intent pages | `/mortgage` | **Keep** (no rate table) |
| Journeys | `pages/Solutions.jsx`, `SolutionDetail.jsx` | `/mortgage/[intent]` | **Port** |
| Calculators | `pages/Tools.jsx` | `/mortgage/araclar` | **Port** (see §6) |
| Bilingual copy | `i18n/tr.js`, `i18n/en.js` | Hunter i18n layer | **Migrate as data** |
| Learn articles | `pages/Learn.jsx` | `app/rehber/` | **Fold in** (one education hub) |
| About / Contact | `pages/About.jsx`, `Contact.jsx` | existing Hunter sections | **Reuse Hunter's** (drop kredibaba's) |
| Legal pages | `Privacy/Terms/AdvertisingDisclosure.jsx` | `app/(legal)/*` | **Port** (FSRA-critical) |
| Lead capture | kredibaba WhatsApp CTA | `api/lead-capture` + WhatsApp | **Reuse Hunter's** Resend route |
| Client portal | `src/app/pages/*`, Supabase auth | — | **Drop / park** (see §9) |

---

## 6. Calculator port checklist

Each becomes a section on `/mortgage/araclar` with its own anchor (e.g. `/mortgage/araclar#mortgage-hesaplayici`).

- [ ] Mortgage hesaplayıcı (payment calculator)
- [ ] Uygunluk hesaplayıcı (affordability / qualification)
- [ ] Kapanış masrafı (closing costs)
- [ ] Tapu devir vergisi (land transfer tax — confirm Ontario + Toronto MLTT logic)
- [ ] Ödeme farkı hesaplayıcı (payment-difference / scenario compare)
- [ ] Ön onay (pre-approval — treat as a step/tool, links into journeys)

Port note: these are pure client-side React in kredibaba; in Next they should be client components (`"use client"`) embedded in server-rendered pages so the page itself stays SEO-visible.

---

## 7. Rate system port (FSRA discipline)

- Do not publish current, sample, historical, or illustrative mortgage rates.
- Keep the `Güncelleniyor` ("updating") fallback — **never invent or interpolate a rate**.
- Keep the disclosure modal logic: rates are examples only, not guaranteed; approval depends on file/lender; borrower fees disclosed before commitment; mortgage activity is conducted through **Real Mortgage Associates** and Jack Hunter FSRA Licence **M26001258**.

---

## 8. Compliance walling — two identities, one domain

This is the part to get right before launch, not after.

The site now hosts **two separately regulated businesses**. Real estate brokerage (RE/MAX Hallmark, RECO/TRREB rules and franchise branding standards) and mortgage brokerage (Real Mortgage Associates, FSRA advertising/disclosure rules) cannot share disclosures or blur identity.

Practical rules for the build:
- **Per-service brokerage identity.** Real-estate sections carry the RE/MAX Hallmark identity; Mortgage carries the Real Mortgage Associates identity + FSRA licence. Don't let one brand label appear on the other's content.
- **Separate disclosure blocks.** Footer (and relevant pages) show both, clearly attributed to the right service — not merged into one generic statement.
- **No bleed in CTAs.** A mortgage-service CTA shouldn't sit inside a RE/MAX-branded block, and vice versa.
- **Investor content stays on its own page.** Equity Market "raise/partner" language lives only on its section, away from the consumer mortgage funnel (different regime again).

Action: a single review pass with **both** your RE/MAX brokerage and your RMA principal broker before public launch. (This is structural guidance, not legal advice.)

---

## 9. Drop / park list

Not part of this merge:

- `src/app/pages/Dashboard, Documents, Properties, Realtors, Referrals, Toolkit, PlanDetail, Profile`
- `src/app/AuthContext`, `ProtectedRoute`, `ThemeContext`, `demoStore`, `planWorkflow`
- `@supabase/supabase-js` auth wiring

These form a client portal — a separate product. If/when you want it, it ships as its own app at a subdomain (e.g. `app.jackhunter.com`), not inside the marketing site. Rule of thumb: **services become sections, products stay standalone.**

---

## 10. Build sequence (funnel-aligned)

Ordered so the highest-volume, revenue-driving piece ships first and your Meta → WhatsApp funnel has a landing target early.

1. **Phase 1 — Mortgage core.** Scaffold `/mortgage`, build service-oriented guidance and the journey pages `[intent]`, wire the WhatsApp/lead-capture CTA, and permanently redirect `/mortgage/oranlar` to `/mortgage`. Add the MortgageTeaser to the homepage and the nav item.
2. **Phase 2 — Tools.** Port the six calculators to `/mortgage/araclar`. These are lead magnets and SEO surface.
3. **Phase 3 — Fold + legalize.** Migrate Learn into `rehber/`, port the three legal pages, lock the FSRA disclosures and RMA licence fields.
4. **Phase 4 — Capital consolidation.** Keep `/hunter-group-capital` canonical and redirect legacy `/hunter-x-capital` URLs.
5. **Pre-launch — Compliance pass.** RE/MAX + RMA review of identity separation and disclosures.

---

*Resolved launch values: Real Mortgage Associates is the mortgage brokerage; Jack Hunter FSRA Licence is M26001258. Confirm broader franchise/domain standards separately if branding changes materially.*
