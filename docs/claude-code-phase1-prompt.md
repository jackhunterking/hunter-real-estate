# Claude Code — Phase 1 kickoff prompt

Paste everything below into Claude Code once you're inside this repo.

---

Read `CLAUDE.md` and `hunter-merged-site-build-spec.md` first, then implement **Phase 1 only: the Mortgage core.** Do not start later phases.

Scope for this phase:

1. Create a new route `app/mortgage/page.tsx` — a Turkish-first landing page with:
   - a service-first hero explaining what shapes a borrower's mortgage options,
   - journey cards linking to the six intents below,
   - a persona row (İlk ev alıcıları, Ev sahipleri, yatırımcılar, şirket sahibi/serbest meslek, Kanada'ya yeni gelenler),
   - a primary WhatsApp / lead-capture CTA wired to the existing `app/api/lead-capture` route.

2. Create `app/mortgage/[intent]/page.tsx` handling these intents:
   `ev-almak`, `yenileme`, `tadilat`, `borc-toparlama`, `ev-degeri`, `heloc`.

3. Add a `MortgageTeaser` section component and insert it into `app/page.tsx` after `ServicesSection`.

4. Add a **Mortgage** item to the main nav in `components/Nav.tsx`, using the existing `t.*` i18n pattern.

Constraints (from CLAUDE.md): reuse existing components, styling tokens, and the lead-capture API; keep RE/MAX and RMA identities separate; manual rates only; Turkish-first via i18n; do not touch the parked Kredibaba portal.

Show me a short plan before writing code, then build it. When done, run `npm run dev` and tell me which URLs to open to review.
