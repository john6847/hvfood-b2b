# Phase 1: foundation

Implemented September 17, 2026. Delivers the blueprint's Phase 1 row: Next.js, Supabase, minimal identity and company migrations, RLS, roles, brand tokens and the customer and admin shells.

## What exists

### Database (`supabase/migrations`)

| Migration | Contents |
| --- | --- |
| `000100_foundation` | `private` schema for helpers, `set_updated_at` and `bump_version` triggers, default function privileges revoked, session helpers (`current_user_id`, `session_is_mfa_verified`) |
| `000200_identity` | `profiles`, `staff_roles`, `permissions`, `staff_role_permissions`, `staff_users`; auth user triggers that mirror profiles; `is_staff`, `has_permission`; `current_staff_context()`; `bootstrap_administrator()` (service role only) |
| `000300_companies` | `pricing_tiers`, `companies`, `company_users`, `company_private_details`, `company_commerce_policies`, `company_addresses`, `company_locations`; last-owner protection trigger; `is_active_member`, `is_company_owner`, `is_approved_member` |
| `000400_policies` | Column grants and RLS policies for every table above; `current_memberships()` |
| `000500_reference_data` | Permission codes, five staff roles with explicit mappings, five pricing tiers |
| `000600_admin_projections` | `admin_companies()`, `admin_company_counts()`, `admin_staff_directory()`: permission-gated staff reads of columns customers cannot see |

Tables match the proposed `schema.sql` with three additions: nonempty checks on names and emails, US state and ZIP format checks on addresses, and `on delete cascade` from auth users to profiles.

### Authorization model as built

- **Column grants are the customer field whitelist.** `authenticated` can read `companies` without `pricing_tier_id`, and can update only `display_name`, `phone`, `website`, `email`. Nothing else on the table is writable through the session client, so status, tier and terms changes must go through server commands.
- **Row policies use SECURITY DEFINER helpers** in the `private` schema with an empty search path. They read membership and staff tables without recursion.
- **Staff require aal2.** `has_permission()` returns false unless the JWT carries `aal = aal2`, so a staff member who has not completed MFA sees nothing, even through direct API calls.
- **Staff-only columns are read through gated functions** (`admin_companies()` and friends) rather than wider grants, because a column grant cannot be scoped by role.

### Application (`src/`)

- `lib/env`: zod-validated environment. `lib/supabase`: session client (RLS on), browser client, admin client (`server-only`). `proxy.ts`: session refresh plus redirects, marked as a convenience, not the boundary.
- `modules/identity`: `service.ts` (verified user, memberships, active company, staff context, MFA state), `guards.ts` (page guards that redirect), `permissions.ts` (typed codes and admin navigation), `company-access.ts` (pure access rules, unit tested).
- Auth: password sign-in, sign-out (POST only), password reset via email link, PKCE callback, TOTP enrollment and challenge for staff, invitation placeholder route.
- Buyer shell: header with company switcher (cookie validated against memberships), dashboard that branches on approved, pending, suspended, rejected and no-company states, read-only account page for company, people, addresses and locations.
- Admin shell: permission-filtered left navigation, home with real company counts, customers list with URL-backed status filter, customer record page, settings with staff directory, placeholders for sections owned by later phases.
- Design tokens in `app/globals.css` carried over from the design preview: warm off-white surfaces, one orange primary, forest green for positive states, small radii, dense tables.

### Tests

- `supabase/tests/001_two_company_isolation.test.sql` (36 assertions): anonymous denial, owner and buyer scope, forged company ids on insert, cross-company updates filtered, pending and suspended handling, staff at aal1 blind, staff at aal2 scoped by permission, last-owner protection.
- `supabase/tests/002_admin_projections.test.sql` (7 assertions): projection functions refuse customers and unverified staff.
- Vitest: permissions and navigation, company access rules, money formatting, redirect target sanitizing.
- Browser walkthrough performed with Playwright against the local stack: anonymous redirect, approved owner dashboard and account, pending applicant limits, staff TOTP enrollment through to the admin customers pages.

## Decisions made in this phase

- **Production app lives at the repository root** with `src/`, matching the blueprint's folder structure. The design preview in `web/` keeps its own toolchain and is not deployed.
- **Public signup is off** in Supabase Auth. Accounts come from invitations (Phase 2) or operator bootstrap. Note for the CLI config: `[auth.email] enable_signup` must stay true because it controls the email provider, not self-registration.
- **Password policy**: 12 characters minimum with upper, lower and digit, enforced by Auth and mirrored in the update-password form.
- **Typeface**: the system sans-serif stack from the preview. A brand typeface has not been chosen; that is a design decision for the brand owner before launch.
- **Support contact details are placeholders** (`[SUPPORT EMAIL]`, `[SUPPORT PHONE]`) in `src/config/brand.ts` until operations supplies them.

## Not in this phase

Application form and review, invitations and activation, company editing, catalog, pricing, cart, orders, payments, shipping, integrations, notifications, audit log writes. Each has a placeholder that says which release fills it.

## Open items before Phase 2

- Confirm Supabase hosting project and deployment target; the CI workflow assumes a standard Next.js host and a Supabase project with migrations applied through the CLI.
- Confirm the transactional email sender for invitation and reset emails.
- Supply the logo asset and typeface choice so the wordmark component can be replaced.
