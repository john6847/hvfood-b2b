# Horizon Vert Foods wholesale portal

US-first wholesale commerce for approved company accounts: a buyer portal built for fast repeat ordering, a Shopify-style operations admin, and Stripe card and ACH payments. Shopify stays the retail storefront; this platform owns wholesale relationships, pricing, orders and fulfillment hand-off.

**Current stage: Phase 1 (foundation) implemented.** Identity, companies, row-level security, staff roles with MFA, brand tokens and both portal shells are in place and tested. Applications, catalog, pricing, ordering, payments and shipping arrive in the phases listed below.

## Repository layout

| Path | What it is |
| --- | --- |
| `src/` | Production Next.js application (App Router, TypeScript, Tailwind) |
| `supabase/` | Migrations, seed fixtures, pgTAP authorization tests, local config |
| `scripts/` | Operator scripts (administrator bootstrap) |
| `docs/architecture/` | Blueprint, ERD, target schema, RLS plan and per-phase notes |
| `web/` | Interactive design preview built before Phase 1 (separate toolchain, kept as the visual reference) |
| `idea.md` | Original brief and confirmed direction |

Start with the [architecture blueprint](docs/architecture/blueprint.md) and the [Phase 1 notes](docs/architecture/phase-1.md).

## Local development

Requirements: Node 22+, Docker, the Supabase CLI.

```bash
npm install
npm run db:start          # local Supabase: applies migrations and seed
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY from `supabase status`
npm run dev
```

Seeded sign-ins (password `Wholesale-Dev-2026`) are listed at the top of [`supabase/seed.sql`](supabase/seed.sql). Staff two-step verification is optional for now; a one-line migration makes it mandatory before launch. Emails sent locally land in Mailpit at http://127.0.0.1:54324.

## Checks

```bash
npm run check     # lint, typecheck, unit tests
npm run db:test   # pgTAP tests: two-company isolation, anonymous denial, MFA gating
npm run build
```

CI runs the same checks plus a diff of the generated database types. Regenerate them after any migration with `npm run db:types`.

## Creating the first administrator

Staff accounts are never created through signup. With the service role key available in the environment:

```bash
node --env-file=.env.local scripts/bootstrap-admin.ts you@company.com
```

The person receives an invitation email to set a password. They can enroll two-step verification at `/mfa`; it becomes mandatory once the switch is turned on.

## Security posture

- Every table has RLS enabled. Anonymous sessions hold no table grants.
- Customers read only their own profile, companies, memberships, addresses and locations. Pricing tier, private details and commerce policies are never customer-readable.
- Company owners can edit a whitelisted set of columns; status, tier and terms can only change through server commands with permission checks.
- Staff permissions come from database role mappings. MFA enforcement is a database switch (currently off) that both RLS and the app honor.
- The service role key is used only in server code after explicit permission checks, never as authorization on its own.

## Phases

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Blueprint, ERD, schema, RLS plan | Done |
| 1 | Next.js, Supabase, identity and company migrations, RLS, staff roles and MFA, brand tokens, portal shells | Done |
| 2 | Applications, review, invitations, activation, company setup | Next |
| 3 | Products, packaging, categories, catalog and search | |
| 4 | Price lists, tiers, quantity breaks, overrides, pricing engine | |
| 5 | Cart, quote, orders, Stripe card and ACH, history and reorder | |
| 6 | Shipping rules, ShipStation, partial fulfillment | |
| 7 | Shopify product and inventory sync | |
| 8 | Freight, LTL, C.H. Robinson interface | |
| 9 | Launch hardening | |
