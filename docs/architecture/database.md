# Database design and authorization plan

Status: reviewable target schema, not an applied migration. Read with [blueprint.md](blueprint.md), [erd.md](erd.md), and [schema.sql](schema.sql).

## Schema conventions

The proposed SQL defines 55 tables, UUID primary keys, timestamps, foreign keys, checks, uniqueness constraints, lookup indexes and an initial deny-all RLS posture. Supabase's `auth.users` and `anon`/`authenticated` roles are prerequisites. It deliberately grants no customer access and installs no permissive policies. Phase-specific migrations must add tested policies and safe command functions before an application can use these tables.

Use USD and US addresses at launch. Currency and country CHECK constraints deliberately prevent accidental unsupported transactions. Expansion requires a migration plus tax, shipping, payment and rounding work; changing a UI dropdown alone cannot enable another market.

Canonical quantities use `numeric`, weights grams, dimensions millimeters and money integer cents. Display units belong to presentation/configuration; payment amounts never use binary floating-point arithmetic. Identifiers from providers remain text. The application must serialize bigint money safely and enforce Stripe's applicable amount limits before a payment attempt.

Names, descriptions and required identifiers have nonempty/length validation in Zod; SQL checks constrain structural and financial invariants. JSONB is reserved for immutable snapshots, typed configuration and provider events. It is not a substitute for relational company memberships, prices, order lines or shipping items. Each JSONB shape needs a versioned Zod schema, payload size limit and migration/compatibility strategy.

All foreign-key leading columns have indexes in the design, along with common operational searches. Migration implementation should remove redundant indexes and select text-search/trigram indexes based on actual queries. Normalize email case and SKU lookup consistently; preserve original display casing. Anonymous application submission must not disclose whether an email/company already exists.

## Table inventory

| Domain | Tables |
| --- | --- |
| Identity and staff | profiles, staff_roles, permissions, staff_role_permissions, staff_users |
| Companies and onboarding | companies, company_users, company_private_details, company_commerce_policies, company_addresses, company_locations, wholesale_applications, company_invitations, tax_exemptions |
| Catalog | product_categories, products, product_packaging |
| Pricing | pricing_tiers, price_lists, company_price_lists, price_list_items, quantity_price_breaks, customer_price_overrides |
| Inventory | inventory_locations, inventory_balances, inventory_reservations |
| Purchasing | carts, cart_items, checkout_quotes, orders, order_items, order_status_history, idempotency_records |
| Payments | company_payment_accounts, payment_methods, payments, refunds, payment_disputes |
| Shipping and documents | shipping_rules, shipping_rates, shipments, shipment_packages, shipment_items, order_documents, order_external_references |
| Integration processing | integration_accounts, integration_events, outbox_events, sync_jobs, integration_logs |
| Configuration and communication | audit_logs, settings, user_preferences, notification_templates, notification_deliveries |

## Planned RLS policy matrix

“Service command” means validated and permission-checked server logic, preferably a narrowly scoped transactional RPC. It never means blindly trusting a browser's company ID. Phase 1 policies are tested against actual Postgres; this document is a strategy, not a claim that policies already exist.

| Table group | Customer SELECT | Customer mutation | Staff / system |
| --- | --- | --- | --- |
| profiles | Own record | Own safe fields through service | Authorized account management |
| company_users | Own memberships; owner may read own company staff | Owner invitation/role service; preserve last owner | Accounts permission |
| companies | Active membership in that company | Owner can edit safe business details | Accounts permission for status/tier |
| addresses / locations | Same-company active members | Owner-only service | Accounts permission |
| applications / invitations | No raw table reads; safe own-status/token endpoint | Submission/acceptance service only | Application review permission |
| company_private_details | No | No | Accounts/finance as required |
| company_commerce_policies | No raw reads; safe capability summary | No | Finance/accounts permission |
| tax_exemptions | Safe company-scoped summary/document endpoint | Owner submission service | Finance review |
| products / packaging / categories | Authenticated member of approved company; active wholesale records | No | Catalog permission |
| all pricing tables | No; effective price API only | No | Pricing permission |
| carts / cart_items | Same-company active members | Owner/buyer service only | Assisted ordering permission |
| checkout_quotes / shipping_rates | Safe company quote API only | No | Pricing/shipping services |
| orders / order_items / documents | Same company; documents must be customer_visible | No raw writes; order commands only | Orders/finance/fulfillment permissions |
| order_status_history | Safe projection excluding internal_reason | No | Orders permission |
| shipments / shipment_packages / shipment_items | Safe company-scoped tracking endpoint; hide internal cost/label paths | No | Fulfillment permission |
| payments / payment methods / refunds / disputes | Safe company-scoped summary only | Checkout/refund command permissions | Finance permission / reconciliation worker |
| inventory | Availability summary only for approved company | No | Inventory/sync services |
| staff roles / permissions | No | No | Administrator only |
| integration / outbox / audit / idempotency | No | No | Restricted worker/admin services |
| settings / templates | Safe public brand projection if needed | No | Scoped settings permission |
| user_preferences | Own | Own validated preferences | No cross-user access without explicit need |
| notification_deliveries | No | No | Notification worker and support diagnostics |

Do not create `SELECT *` customer views for internal tables. RLS protects rows, not sensitive columns within an allowed row; safe projections and separate tables are essential. If a view exposes data, ensure invoker security and underlying grants/policies actually preserve intended isolation. Do not mark pricing services cacheable across companies.

## Transaction-level invariants to implement

SQL foreign keys and checks cannot enforce every commerce invariant. These are required transactional service/RPC responsibilities, not optional future hardening:

- Application approval locks the application, transitions it once and creates company/invitation/outbox atomically. Reapproval returns the existing result. Renewing an expired invitation revokes the old pending record before inserting another.
- Invitation acceptance locks the invitation, verifies token hash, expiration and verified email, creates membership and consumes it once. Owner removal cannot leave an active company without an owner.
- Company price-list assignments validate `scope = COMPANY` and matching currency. Volume-break thresholds must respect packaging increments; admin preview catches increasing or contradictory price breaks.
- Quote/order conversion verifies that the quote's cart equals the submitted cart, that both belong to the company, and that quote version, fingerprint and expiry match. Composite company foreign keys alone cannot prove that the same cart was quoted.
- Inventory reservations lock balances, check available units less active reservations and validate that the balance's product equals the order item's product. The schema stores exact base units; the service validates packaging conversions. Reservations are released/committed exactly once.
- Order creation inserts one or more lines, recalculates sums, allocates discounts/taxes consistently and checks the header totals. A header without lines must never commit. SQL line checks alone do not ensure header/line agreement.
- Order commercial fields (amounts, addresses, line snapshots, currency, quote/cart references, company and terms) become immutable after creation. The proposed SQL makes `order_items` immutable already; the Phase 5 migration also needs a field-specific order-header immutability trigger. Corrections create adjustments/refunds with audit history, not rewritten purchases.
- Payment methods must belong to the same payment account as their payment, not merely the same company. Provider objects must match integration mode, order metadata, amount and currency. Lock aggregate financial state when applying payments/refunds/disputes; never permit double charging after a successful attempt.
- Refund sum cannot exceed captured amount; concurrent refunds must serialize. Provider reconciliation prevents a late event from regressing state or creating duplicate financial effects.
- Shipment line quantities cannot exceed remaining quantities across noncancelled shipments. Package tracking may differ within one shipment; safe customer summaries include all packages.
- Pricing tier/status/credit updates, bulk actions, settings updates and privileged overrides require explicit permissions, optimistic version checks and an audit insert in the same transaction.
- Outbox and inbox consumers use leased claims with crash recovery. Event processing and local state updates commit together. External calls use stable idempotency keys and reconciliation after ambiguous failures.
- Category edits prevent indirect cycles, not just a category pointing to itself.

## Retention and immutable records

Archive products and companies rather than deleting referenced commercial data. Financial retention periods and personal-data erasure/anonymization rules need business/legal configuration before launch. Audit, order history, integration logs and order items are append-only in the proposed design. Controlled maintenance migrations may archive/purge eligible logs; ordinary staff/service operations may not update or delete them.

Keep audit before/after values to safe changed fields, not entire profiles, payment objects or credentials. Integration event payloads must have a retention policy and redact unnecessary personal information. Private order documents are authorized at download time; guessed paths are never permission.

## Implementation validation plan

1. Apply each migration to a clean local Supabase instance and a migration-upgrade fixture.
2. Seed two unrelated companies, approved/pending/suspended accounts, owner/buyer/viewer roles and limited staff roles.
3. Exercise SELECT and mutation permissions through real anonymous/authenticated clients, including forged foreign IDs.
4. Verify anonymous/pending/suspended catalog responses contain no prices in HTML, API JSON or preloaded state.
5. Exercise concurrent approval, invitation, order, reservation, payment and shipment operations.
6. Replay duplicate/out-of-order webhooks and worker crashes between local commit and remote response.
7. Validate backups/restores and log redaction before production.

Blueprint review validation: static reference/coverage checks performed on the proposed SQL. A local PostgreSQL execution attempt was blocked because the installed PostgreSQL binary depends on a missing ICU library. No database was created or changed. SQL execution, migration validation and RLS behavior tests therefore remain Phase 1/feature-phase work; this file must not be represented as production-tested.
