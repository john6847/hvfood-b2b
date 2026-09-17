# Horizon Vert Foods — B2B Wholesale Portal

## Confirmed direction — September 17, 2026

First refine the blueprint; do not implement Phase 1 yet.

* Launch for US buyers first, in USD.
* Use Stripe for credit cards and US ACH Direct Debit, subject to merchant-account eligibility.
* Keep the architecture modular and business rules configurable through admin.
* Build a Shopify-style admin experience and Uline-style purchasing efficiency with a modern UI.
* Treat account setup as company application, approval, verified activation and location setup.

The [architecture blueprint](docs/architecture/blueprint.md), [database ERD](docs/architecture/erd.md), [proposed schema](docs/architecture/schema.sql) and [RLS plan](docs/architecture/database.md) make these requirements concrete. These are design artifacts for review, not an implemented application. Where the original brief differs, this confirmed direction and the blueprint take precedence.

---

You are a senior staff-level full-stack engineer and product architect.

Build a production-ready B2B wholesale ordering platform for **Horizon Vert Foods**, an existing food brand that currently sells through:

* Shopify
* Etsy
* Amazon
* ShipStation

The new application will provide an authenticated wholesale portal where approved business customers can browse wholesale products, see wholesale pricing, order products in bulk, manage their company information, view order history, and eventually access freight/shipping workflows.

The application should feel like a modern, premium B2B commerce platform inspired by the usability and operational clarity of companies such as Uline, Faire, WebstaurantStore, and modern wholesale portals.

Do NOT make it look like an AI-generated SaaS dashboard.

The UI should feel:

* professional
* industrial but premium
* clean
* efficient
* trustworthy
* optimized for repeat wholesale purchasing
* desktop-first but fully responsive

---

# 1. CORE TECHNOLOGY

Use:

* Next.js
* TypeScript
* App Router
* React
* Tailwind CSS
* shadcn/ui where appropriate
* Supabase

  * PostgreSQL
  * Supabase Auth
  * Row Level Security
  * Storage where required
* Zod for validation
* React Hook Form where appropriate

Architecture must be modular and production-ready.

Use server-side logic for sensitive operations.

Never expose:

* Supabase service-role keys
* ShipStation API credentials
* Shopify Admin API credentials
* C.H. Robinson credentials
* other secrets

to the browser.

Use environment variables.

---

# 2. HIGH-LEVEL ARCHITECTURE

The application should be structured into these domains:

/auth
/customers
/companies
/catalog
/products
/pricing
/cart
/orders
/shipping
/admin
/integrations
/settings

Separate:

1. Customer-facing wholesale portal
2. Admin/operations portal
3. Integration layer

Do NOT tightly couple the UI directly to ShipStation, Shopify or C.H. Robinson.

Instead create internal service abstractions.

Example:

ShippingProvider
├── ShipStationProvider
└── CHRobinsonProvider

CommerceProvider
└── ShopifyProvider

This allows providers to be replaced later.

---

# 3. USER TYPES

Implement role-based authorization.

Roles:

### Admin

Full access.

Can:

* manage customers
* approve wholesale accounts
* manage companies
* manage products
* manage pricing
* manage inventory information
* manage shipping rules
* view all orders
* modify orders
* manage integrations
* view system logs
* configure freight rules

### Wholesale Customer

Can:

* log in
* view approved wholesale catalog
* see wholesale prices
* see quantity rules
* add products to cart
* place orders
* manage company profile
* manage shipping addresses
* view previous orders
* reorder previous orders
* view order status
* download invoices/documents when available

### Customer Staff

A company may have multiple users.

Allow company administrators to eventually invite additional employees.

Company users should only see their company's information and orders.

---

# 4. WHOLESALE ACCOUNT APPLICATION

Create a public:

/wholesale/apply

page.

The user submits:

* First name
* Last name
* Business name
* Email
* Phone
* Website
* Business type
* Business address
* City
* Province/state
* Postal/ZIP code
* Country
* Tax/business number
* Estimated monthly order volume
* Products interested in
* Additional notes

Account status:

PENDING
APPROVED
REJECTED
SUSPENDED

New applicants cannot see wholesale pricing.

Admin receives the application inside the admin dashboard.

Admin can:

* approve
* reject
* suspend
* add notes
* assign pricing tier

When approved, the user receives an email allowing them to activate their account.

---

# 5. COMPANY MODEL

Do NOT model the system only around individual users.

Wholesale commerce is company-based.

A company should have:

* id
* legal_name
* display_name
* business_number
* tax_number
* email
* phone
* website
* billing_address
* shipping_addresses
* payment_terms
* credit_limit
* pricing_tier
* status
* notes
* created_at
* updated_at

A company can have multiple users.

A company can have multiple shipping locations.

Future-ready the schema for multiple branches/locations.

---

# 6. PRODUCT MODEL

Products should support wholesale-specific information independently from Shopify.

Product:

* id
* shopify_product_id
* shopify_variant_id
* sku
* name
* slug
* description
* image
* category
* active
* wholesale_enabled
* unit_type
* unit_weight
* unit_length
* unit_width
* unit_height
* case_quantity
* pallet_quantity
* minimum_order_quantity
* quantity_increment
* dimensions_unit
* weight_unit
* created_at
* updated_at

Examples:

Product sold by:

* individual unit
* case
* box
* bag
* pallet
* kilogram
* pound

The system must NOT assume every product is sold individually.

---

# 7. WHOLESALE PACKAGING

This is extremely important.

A product can have multiple packaging levels.

Example:

Haitian Coffee

1 unit = 12 oz
1 case = 12 units
1 pallet = 40 cases

Model packaging levels.

Example:

product_packaging

* id
* product_id
* name
* type
* quantity
* weight
* length
* width
* height
* sku
* barcode

Types:

UNIT
CASE
BOX
PALLET

The admin should be able to configure these.

---

# 8. WHOLESALE PRICING

Create flexible pricing tiers.

Example:

STANDARD
BRONZE
SILVER
GOLD
CUSTOM

Pricing should support:

* base wholesale price
* customer-specific price
* tier price
* quantity-based price

Example:

1–4 cases: $40/case
5–19 cases: $36/case
20–49 cases: $33/case
50+ cases: $30/case

The pricing engine should determine the applicable price automatically.

Do NOT hard-code pricing rules.

Create tables for:

pricing_tiers
price_lists
price_list_items
quantity_price_breaks
customer_price_overrides

The pricing engine should be deterministic and testable.

---

# 9. QUANTITY RULES

Products must support:

* minimum quantity
* maximum quantity
* quantity increment

Example:

Minimum: 5 cases
Maximum: 500 cases
Increment: 5

The UI should make this extremely obvious.

If increment = 5:

5
10
15
20
...

should be allowed.

3 should not be allowed.

Never rely only on frontend validation.

Validate quantity again server-side.

---

# 10. WHOLESALE CATALOG

Create:

/wholesale/catalog

Customers should see:

* categories
* search
* filters
* product cards
* SKU
* packaging
* wholesale price
* quantity breaks
* stock/availability
* case quantity
* weight

Example:

---

Horizon Vert Haitian Coffee
SKU: HV-COF-001

$32.00 / case

12 units / case

Volume pricing:
1–9 cases      $32
10–24 cases    $29
25+ cases      $26

[ - ]  10  [ + ]

## [ Add to Cart ]

Prices must NEVER be exposed to unauthenticated users.

---

# 11. PRODUCT PAGE

Create:

/wholesale/products/[slug]

Include:

* product image
* description
* SKU
* wholesale price
* price breaks
* case information
* packaging information
* dimensions
* weight
* minimum order
* quantity increment
* available quantity
* Add to Cart

Display:

"10 cases = $29/case"

rather than forcing the customer to calculate everything.

---

# 12. CART

Create a wholesale cart.

Cart must contain:

* products
* quantities
* unit price
* price break
* subtotal
* estimated shipping
* taxes
* total

Display packaging clearly.

Example:

Haitian Coffee
10 CASES
$29.00 / case
$290.00

Do not allow customers to accidentally order individual units when the product is case-based.

---

# 13. CHECKOUT

Wholesale checkout should collect:

Customer/company information

Billing address

Shipping address

Contact information

Purchase order number

Special instructions

Shipping method

Payment method

For initial MVP support:

* Credit card through Stripe
* US ACH Direct Debit through Stripe, when enabled and eligible
* Purchase order number as a reference, not a payment method

Manual payment and approved NET terms are later, explicitly enabled company capabilities. ACH is asynchronous: a submitted checkout or successful browser redirect must never be treated as settled payment. Default prepaid fulfillment remains on hold until verified payment success. Stripe webhook processing must be authenticated, idempotent and safe against out-of-order events.

Track individual payment attempts separately, including bank verification, processing, failure and cancellation. Add PROCESSING and DISPUTED to the order's payment summary states. Refunds and disputes are separate records; do not rewrite historical order amounts.

Make payment methods configurable per customer.

Some wholesale customers may have:

NET 15
NET 30
NET 45

payment terms.

Do not assume every customer pays immediately.

---

# 14. ORDER MODEL

Orders must be first-class entities in our database.

Order:

* id
* order_number
* company_id
* user_id
* status
* payment_status
* fulfillment_status
* subtotal
* shipping_cost
* tax
* total
* currency
* billing_address
* shipping_address
* customer_po_number
* notes
* shipping_provider
* shipping_service
* tracking_number
* external_order_id
* created_at
* updated_at

Order items:

* order_id
* product_id
* sku
* product_name
* packaging_type
* quantity
* unit_price
* total
* weight
* dimensions

IMPORTANT:

Order items must store a snapshot of the product/pricing information at the time of purchase.

Do not rely on the current product price to reconstruct historical orders.

---

# 15. ORDER STATUS

Create:

PENDING
CONFIRMED
PROCESSING
READY_TO_SHIP
SHIPPED
DELIVERED
CANCELLED
ON_HOLD

Payment:

UNPAID
AUTHORIZED
PAID
PARTIALLY_PAID
REFUNDED
PARTIALLY_REFUNDED

Fulfillment:

UNFULFILLED
PARTIALLY_FULFILLED
FULFILLED

---

# 16. ADMIN DASHBOARD

Create:

/admin

Dashboard should show:

* today's orders
* pending wholesale applications
* orders requiring fulfillment
* total wholesale sales
* active wholesale customers
* low-stock products
* recent orders
* shipping issues
* integration status

Use useful operational metrics.

Avoid unnecessary analytics for the MVP.

---

# 17. ADMIN PRODUCT MANAGEMENT

Admin can:

* create product
* edit product
* archive product
* configure wholesale availability
* configure SKU
* configure packaging
* configure weight
* configure dimensions
* configure MOQ
* configure quantity increments
* configure price tiers
* configure volume discounts

Product editing should be extremely simple.

---

# 18. WEIGHT MANAGEMENT

Weight is extremely important for wholesale shipping.

Every product/package should support:

weight_value
weight_unit

Supported:

LB
OZ
KG
G

Normalize internally to grams.

When calculating shipping, always use normalized weight.

Example:

10 cases × 8.5 lb = 85 lb

The system should calculate:

* total product weight
* total shipment weight
* number of packages
* pallet requirements

---

# 19. SHIPPING ENGINE

Create an internal shipping abstraction.

Example:

interface ShippingProvider {
getRates(...)
createShipment(...)
getShipment(...)
getTracking(...)
cancelShipment(...)
}

Initial provider:

ShipStation

Future provider:

C.H. Robinson

The application should NOT depend directly on ShipStation throughout the codebase.

Only the provider implementation should know ShipStation API details.

---

# 20. SHIPSTATION INTEGRATION

Create a server-side ShipStation integration.

Support:

* create shipment/order
* retrieve shipment
* retrieve rates
* create label when appropriate
* tracking
* carrier
* service
* package information
* shipment weight
* shipment dimensions

Store:

* external shipment ID
* tracking number
* carrier
* service
* label URL if available
* shipping cost

Use the current ShipStation API architecture rather than assuming old V1 behavior.

ShipStation's current V2 API uses shipments as the core shipping object and supports shipment creation, rates, labels and tracking.

Keep the integration behind a service layer.

---

# 21. SHOPIFY INTEGRATION

The existing Horizon Vert Foods Shopify store remains the main retail storefront.

Do not replace Shopify.

Use Shopify as a source for:

* products
* variants
* SKUs
* images
* descriptions
* inventory where appropriate

Store Shopify IDs locally.

Build synchronization jobs.

Example:

Shopify
↓
Sync Service
↓
Supabase
↓
Wholesale Portal

Do not make the wholesale application blindly query Shopify for every request.

Cache/store the necessary wholesale product data locally.

---

# 22. IMPORTANT: DO NOT CREATE DUPLICATE PRODUCT DATA UNNECESSARILY

Shopify should remain the source of truth for retail product information where practical.

Supabase should become the source of truth for:

* wholesale pricing
* wholesale customer relationships
* wholesale packaging rules
* wholesale quantity rules
* wholesale orders
* wholesale permissions
* wholesale-specific configuration

Document which system owns each field.

---

# 23. ETSY + AMAZON

Do not directly integrate Etsy and Amazon into the wholesale application during MVP.

Those channels already flow through ShipStation.

The wholesale system should simply create/submit wholesale fulfillment data into the fulfillment ecosystem.

Keep the architecture open for future marketplace synchronization.

---

# 24. C.H. ROBINSON

Create a future-ready:

CHRobinsonProvider

but DO NOT make the entire application depend on it.

The provider should eventually support:

* freight quote
* shipment booking
* carrier selection
* tracking
* shipment status
* documents
* freight reference

Credentials must be stored securely.

If C.H. Robinson API access is unavailable or requires customer-specific onboarding, implement the interface and mock provider first.

Never fake live API functionality.

---

# 25. SHIPPING LOGIC

Create configurable shipping methods:

PARCEL
LTL
FREIGHT
LOCAL_PICKUP

Rules may depend on:

* total weight
* number of cases
* pallet count
* destination
* product category
* order value

Example:

< 150 lb → Parcel

150–500 lb → LTL

> 500 lb → Freight

These are examples only.

Make all thresholds configurable from admin.

---

# 26. FREIGHT

For freight orders, collect:

* freight class
* NMFC where applicable
* pallet count
* pallet dimensions
* total weight
* liftgate requirement
* residential delivery
* appointment required
* dock available

Do not hard-code these values.

Admin should be able to configure defaults.

---

# 27. CUSTOMER DASHBOARD

Create:

/wholesale/dashboard

Show:

Welcome back, [Company]

Quick actions:

[Shop Products]
[Reorder]
[View Orders]
[Account]

Recent orders:

Order #HV-10023
March 12
$1,482.00
Shipped

Order #HV-10011
February 28
$927.00
Delivered

---

# 28. REORDER

This is important for wholesale.

Every previous order should have:

[Reorder]

Clicking Reorder should:

1. retrieve the previous order
2. verify products are still active
3. verify pricing
4. verify quantity rules
5. add valid items to cart
6. flag unavailable items

Never blindly recreate an old order.

---

# 29. SEARCH

Wholesale buyers should be able to search by:

* product name
* SKU
* barcode
* category

Make SKU search extremely fast.

Wholesale customers often know SKUs better than product names.

---

# 30. ADMIN CUSTOMER MANAGEMENT

Admin can see:

Company

Contact

Status

Pricing tier

Total orders

Total revenue

Last order

Payment terms

Credit limit

Shipping addresses

Orders

Notes

Actions:

Approve
Suspend
Edit
View orders
Change pricing tier

---

# 31. DATABASE

Create a proper relational PostgreSQL schema.

At minimum:

profiles
companies
company_users
company_addresses
wholesale_applications

products
product_packaging
product_categories

pricing_tiers
price_lists
price_list_items
quantity_price_breaks
customer_price_overrides

carts
cart_items

orders
order_items
order_status_history

shipments
shipment_items
shipping_rates

integration_accounts
integration_logs
sync_jobs

audit_logs

Use UUID primary keys.

Use timestamps.

Use foreign keys.

Use indexes for:

* SKU
* Shopify product ID
* Shopify variant ID
* company ID
* order number
* email
* status
* created_at

---

# 32. SUPABASE SECURITY

Use Supabase Auth.

Use Row Level Security.

Customers must ONLY be able to access:

* their profile
* their company
* their company's users
* their company's addresses
* their company's orders
* their company's cart

Customers must NEVER be able to query:

* other companies
* other customers
* admin data
* integration credentials
* internal pricing configuration they aren't entitled to see

Admins can access everything according to role.

Do not rely solely on frontend authorization.

Implement authorization at the database/server level.

---

# 33. AUDIT LOG

Every important administrative action should be logged.

Example:

Admin John changed:

Product: Haitian Coffee

Wholesale price:
$30 → $28

Timestamp:
2026-09-17 14:23

Store:

* user
* action
* entity
* entity_id
* previous_value
* new_value
* timestamp

---

# 34. INTEGRATION LOGS

Create integration logging.

Example:

ShipStation
CREATE_SHIPMENT
SUCCESS

External ID:
xxxx

timestamp

If API fails:

Store:

* provider
* endpoint/action
* status
* error
* request ID if available
* timestamp

Never store secrets.

---

# 35. UI DESIGN

Design direction:

Think:

Uline

* modern Shopify
* premium food distributor
* clean B2B procurement portal

Avoid:

* excessive rounded cards
* giant gradients
* fake glassmorphism
* unnecessary animations
* generic AI dashboard aesthetics
* excessive purple/blue SaaS styling

The UI should feel like a serious business application.

Use clear typography.

Use tables heavily where appropriate.

Wholesale buyers value information density.

---

# 36. RESPONSIVE DESIGN

Desktop:

Primary experience.

Tablet:

Fully supported.

Mobile:

Functional for:

* browsing
* reordering
* checking orders
* account management

Do not attempt to make complex admin tables artificially beautiful on mobile.

Use horizontal scrolling or responsive table transformations where appropriate.

---

# 37. NOTIFICATIONS

Prepare notification architecture.

Events:

WHOLESALE_APPLICATION_RECEIVED
WHOLESALE_ACCOUNT_APPROVED
ORDER_CREATED
ORDER_CONFIRMED
ORDER_SHIPPED
ORDER_DELIVERED
ORDER_CANCELLED
PAYMENT_RECEIVED
SHIPPING_EXCEPTION

Initially create email notification interfaces.

Do not tightly couple the application to one email provider.

---

# 38. ENVIRONMENT VARIABLES

Create:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

SHOPIFY_STORE_DOMAIN
SHOPIFY_ADMIN_ACCESS_TOKEN
SHOPIFY_STOREFRONT_ACCESS_TOKEN

SHIPSTATION_API_KEY

CHROBINSON_CLIENT_ID
CHROBINSON_CLIENT_SECRET

EMAIL_PROVIDER_API_KEY

Never commit `.env`.

Create `.env.example`.

---

# 39. API STRUCTURE

Use clean server-side routes/actions.

Examples:

/api/wholesale/applications
/api/wholesale/products
/api/wholesale/cart
/api/wholesale/orders
/api/admin/customers
/api/admin/products
/api/admin/pricing
/api/shipping/rates
/api/shipping/create
/api/integrations/shopify/sync
/api/integrations/shipstation/webhook

Validate every request.

Use Zod.

Return consistent errors.

---

# 40. WEBHOOK ARCHITECTURE

Prepare webhook handling for:

Shopify
ShipStation
future shipping providers

Webhook handlers must:

* verify authenticity
* be idempotent
* log events
* safely retry
* avoid duplicate orders/shipments

Create an event/integration_events table.

Use an idempotency key.

---

# 41. IDEMPOTENCY

This is critical.

If ShipStation sends the same webhook twice, do NOT create two shipments.

If a customer double-clicks "Place Order", do NOT create two orders.

Use idempotency keys for:

* order creation
* shipment creation
* webhook processing
* payment events

---

# 42. ADMIN SETTINGS

Create:

/admin/settings

Sections:

Company
Wholesale
Pricing
Shipping
Integrations
Notifications
Users
Security

Admin should be able to configure:

* default pricing tier
* order minimum
* shipping thresholds
* package defaults
* payment terms
* freight rules

---

# 43. DEVELOPMENT APPROACH

DO NOT build the entire application in one giant implementation.

Build in phases.

### PHASE 1

Foundation:

* Next.js
* Supabase
* authentication
* database
* RLS
* roles
* admin layout
* customer layout

### PHASE 2

Wholesale customers:

* applications
* approval
* companies
* company users
* addresses

### PHASE 3

Products:

* products
* packaging
* categories
* wholesale catalog
* product detail

### PHASE 4

Pricing:

* pricing tiers
* quantity breaks
* customer overrides
* pricing engine

### PHASE 5

Cart + Orders:

* cart
* checkout
* orders
* order history
* reorder
* Stripe card and ACH payments
* payment attempts, verified webhooks, refunds and disputes
* payment-dependent fulfillment holds

### PHASE 6

Shipping:

* shipping engine
* weight calculations
* ShipStation integration
* rates
* shipment creation
* tracking

### PHASE 7

Shopify:

* product sync
* inventory sync
* order synchronization where appropriate

### PHASE 8

Freight:

* LTL
* pallets
* freight rules
* C.H. Robinson provider interface

### PHASE 9

Production hardening:

* security
* RLS audit
* rate limiting
* logging
* error handling
* idempotency
* webhook verification
* tests
* monitoring

---

# 44. TESTING

Write tests for:

Pricing engine

Quantity rules

Company authorization

Cart calculations

Order creation

Shipping weight calculation

Reorder logic

Webhook idempotency

Admin permissions

RLS policies

Example pricing test:

Product:

$40 base

10+ → $35

25+ → $32

Test:

quantity 1 → $40
quantity 9 → $40
quantity 10 → $35
quantity 24 → $35
quantity 25 → $32

---

# 45. IMPORTANT BUSINESS RULE

Never expose wholesale prices to anonymous users.

Anonymous users should see:

"Wholesale pricing available to approved customers."

with:

[Apply for Wholesale]

Logged-in approved customers see pricing.

Pending customers do not.

Suspended customers do not.

---

# 46. SOURCE OF TRUTH

Document this explicitly in the codebase:

SHOPIFY:
Retail product/catalog information.

SUPABASE:
Wholesale customers
Wholesale pricing
Wholesale rules
Wholesale orders
Wholesale configuration

SHIPSTATION:
Shipping/fulfillment infrastructure.

C.H. ROBINSON:
Future freight provider.

---

# 47. DELIVERABLES

Before considering the project complete, generate:

1. Architecture documentation
2. Database schema
3. Supabase migrations
4. RLS policies
5. Seed data
6. Authentication
7. Customer portal
8. Admin portal
9. Wholesale catalog
10. Pricing engine
11. Cart
12. Checkout
13. Orders
14. Reorder
15. Shipping abstraction
16. ShipStation integration
17. Shopify synchronization
18. C.H. Robinson provider interface
19. Webhook architecture
20. Audit logging
21. Integration logging
22. Tests
23. README
24. `.env.example`

---

# 48. DEVELOPMENT RULE

Before implementing a feature:

1. Explain the data model.
2. Explain the business rules.
3. Explain the security implications.
4. Implement the database migration.
5. Implement server-side logic.
6. Implement authorization.
7. Implement UI.
8. Write tests.
9. Verify edge cases.

Do not create fake integrations.

Do not create fake API responses and pretend they are production-ready.

When an external API requires credentials or access that is unavailable, create a clean provider abstraction and a clearly marked mock/test implementation.

---

# 49. FIRST TASK

Do NOT immediately build the entire application.

First produce:

1. System architecture
2. Database ERD
3. Complete database schema
4. RLS strategy
5. Role/permission model
6. Pricing model
7. Shipping model
8. Integration architecture
9. Folder structure
10. Phase-by-phase implementation plan

Then wait for approval before implementing Phase 1.

The goal is a production-quality B2B wholesale platform, not a prototype.
