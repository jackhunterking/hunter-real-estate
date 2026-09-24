# Property workspace structure and launch

## Addresses and ownership

- `https://huntergroupremax.com`: public real estate website, owned by `hunter-real-estate` (Next.js).
- `https://app.huntergroupremax.com`: intended production address for Hunter Property Workspace, owned by `hunter-capital-deal-canvas` (Vite/React).
- `equitymarket.io`: separate funds portal. Its website links and authentication configuration are independent of this property workspace entry point.

The public website's Client Login button opens the workspace in the same tab. Signed-out visitors see the existing sign-in screen; signed-in members see their authorized workspaces. Both the sign-in screen and app header link back to the real estate website. Hunter Capital remains a workspace name; existing users, memberships, deals and documents are retained.

The two repositories and Vercel deployments remain separate. This integrates the app under the real estate domain without nesting a Vite app inside Next.js or moving database records. Canvas migrations and Edge Functions continue to be maintained in the canvas repository. The existing Hunter Platform Supabase project remains the backend. Shared Auth accounts do not automatically provide a shared cross-domain browser session.

## Code configuration

Website: `components/Nav.tsx` uses `lib/property-workspace.ts`, with `NEXT_PUBLIC_PROPERTY_WORKSPACE_URL` defaulting to `https://app.huntergroupremax.com`. The Client Login label is translated in all four website languages. `NEXT_PUBLIC_PORTAL_URL` continues to point to Equity Market.

Canvas: `src/lib/site.ts` defines the public website return URL. `src/i18n/strings.ts` defines the English/Turkish product name. The HTML entry point discourages indexing; access protection continues to come from authentication and database permissions.

## Remaining live configuration (not applied by these code changes)

1. In the canvas Vercel project's Settings > Domains, add `app.huntergroupremax.com`. Do not attach this subdomain to the public Next.js deployment.
2. At the domain's DNS provider, set the `app` record to the exact target supplied by Vercel. Wait for domain validation and HTTPS. Check existing records before replacing any.
3. Keep the canvas deployment's existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Build command: `npm run build`; output directory: `dist`.
4. In Supabase Authentication > URL Configuration, allow the exact production redirect `https://app.huntergroupremax.com/`. Current invite/reset code returns to the current origin and pathname, and the canvas runs at `/`. Retain existing portal destinations and the shared Site URL; do not overwrite the funds portal's email templates.
5. Deploy the canvas changes. Verify sign-in, sign-out, an invited account, password reset, an account without workspace access, and each applicable workspace role. A move to a different origin requires a fresh sign-in.
6. Set `NEXT_PUBLIC_PROPERTY_WORKSPACE_URL=https://app.huntergroupremax.com` in the website's production environment if overriding the default; deploy the website button after the subdomain works. Check desktop/mobile navigation in all four languages and the return link.
7. After validation, configure the old canvas Vercel address to redirect to the new app domain. Test old invite/reset links as well as ordinary navigation before retiring old redirect allow-list entries; auth links may include URL fragments.

Changing code does not create DNS records, attach a Vercel domain, or change Supabase settings. Do not treat the intended app address as live until the checks above pass.
