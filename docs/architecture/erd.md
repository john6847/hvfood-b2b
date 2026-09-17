# Database ERD

Proposed target model; diagrams emphasize transactional relationships. All entities have UUID primary keys and creation/update timestamps. The full column and constraint definition is in [schema.sql](schema.sql). Tables are introduced incrementally, not all at once in Phase 1.

## Identity, companies and pricing

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : identifies
  PROFILES ||--o{ COMPANY_USERS : joins
  COMPANIES ||--o{ COMPANY_USERS : has
  PROFILES ||--o| STAFF_USERS : may_be
  STAFF_ROLES ||--o{ STAFF_USERS : assigned
  STAFF_ROLES ||--o{ STAFF_ROLE_PERMISSIONS : grants
  PERMISSIONS ||--o{ STAFF_ROLE_PERMISSIONS : defines
  COMPANIES ||--o| COMPANY_PRIVATE_DETAILS : protects
  COMPANIES ||--o| COMPANY_COMMERCE_POLICIES : configures
  COMPANIES ||--o{ COMPANY_ADDRESSES : uses
  COMPANY_ADDRESSES ||--o{ COMPANY_LOCATIONS : locates
  COMPANIES ||--o{ COMPANY_LOCATIONS : owns
  COMPANIES |o--o{ WHOLESALE_APPLICATIONS : approved_as
  COMPANIES ||--o{ COMPANY_INVITATIONS : invites
  COMPANIES ||--o{ TAX_EXEMPTIONS : substantiates
  PRICING_TIERS |o--o{ COMPANIES : assigned
  PRICING_TIERS |o--o{ PRICE_LISTS : prices
  COMPANIES ||--o{ COMPANY_PRICE_LISTS : selects
  PRICE_LISTS ||--o{ COMPANY_PRICE_LISTS : assigned
  PRICE_LISTS ||--o{ PRICE_LIST_ITEMS : contains
  PRODUCT_PACKAGING ||--o{ PRICE_LIST_ITEMS : priced
  PRICE_LIST_ITEMS ||--o{ QUANTITY_PRICE_BREAKS : discounts
  COMPANIES ||--o{ CUSTOMER_PRICE_OVERRIDES : negotiates
  PRODUCT_PACKAGING ||--o{ CUSTOMER_PRICE_OVERRIDES : priced
```

## Catalog, ordering and fulfillment

```mermaid
erDiagram
  PRODUCT_CATEGORIES |o--o{ PRODUCTS : classifies
  PRODUCTS ||--o{ PRODUCT_PACKAGING : sold_as
  PRODUCTS ||--o{ INVENTORY_BALANCES : stocked
  INVENTORY_LOCATIONS ||--o{ INVENTORY_BALANCES : stores
  COMPANIES ||--o{ CARTS : owns
  COMPANY_USERS ||--o{ CARTS : creates
  COMPANY_LOCATIONS |o--o{ CARTS : delivers_to
  CARTS ||--o{ CART_ITEMS : contains
  PRODUCT_PACKAGING ||--o{ CART_ITEMS : selects
  CARTS ||--o{ CHECKOUT_QUOTES : quoted
  CHECKOUT_QUOTES ||--o| ORDERS : accepted
  CARTS ||--o| ORDERS : converts
  COMPANIES ||--o{ ORDERS : buys
  ORDERS ||--|{ ORDER_ITEMS : snapshots
  PRODUCT_PACKAGING ||--o{ ORDER_ITEMS : identifies
  ORDERS ||--o{ ORDER_STATUS_HISTORY : records
  ORDER_ITEMS ||--o{ INVENTORY_RESERVATIONS : reserves
  INVENTORY_BALANCES ||--o{ INVENTORY_RESERVATIONS : allocates
  CARTS ||--o{ SHIPPING_RATES : estimates
  ORDERS ||--o{ SHIPMENTS : fulfills
  SHIPMENTS ||--o{ SHIPMENT_PACKAGES : packs
  SHIPMENTS ||--o{ SHIPMENT_ITEMS : carries
  ORDER_ITEMS ||--o{ SHIPMENT_ITEMS : portions
  ORDERS ||--o{ ORDER_DOCUMENTS : documents
  ORDERS ||--o{ ORDER_EXTERNAL_REFERENCES : maps
```

Order items must belong to the shipment's order; composite foreign keys enforce this. Order/cart/quote membership and location foreign keys include company ID. An order's commercial snapshot survives product edits; products are archived rather than deleted.

## Payments and asynchronous processing

```mermaid
erDiagram
  COMPANIES ||--o{ COMPANY_PAYMENT_ACCOUNTS : pays_with
  INTEGRATION_ACCOUNTS ||--o{ COMPANY_PAYMENT_ACCOUNTS : hosts
  COMPANY_PAYMENT_ACCOUNTS ||--o{ PAYMENT_METHODS : tokenizes
  COMPANY_PAYMENT_ACCOUNTS ||--o{ PAYMENTS : processes
  PAYMENT_METHODS |o--o{ PAYMENTS : funds
  ORDERS ||--o{ PAYMENTS : attempts
  PAYMENTS ||--o{ REFUNDS : credits
  PAYMENTS ||--o{ PAYMENT_DISPUTES : disputes
  INTEGRATION_ACCOUNTS ||--o{ INTEGRATION_EVENTS : receives
  INTEGRATION_ACCOUNTS ||--o{ SYNC_JOBS : synchronizes
  INTEGRATION_ACCOUNTS ||--o{ INTEGRATION_LOGS : logs
  INTEGRATION_EVENTS |o--o{ INTEGRATION_LOGS : traces
  SYNC_JOBS |o--o{ INTEGRATION_LOGS : traces
  OUTBOX_EVENTS ||--o{ NOTIFICATION_DELIVERIES : dispatches
  NOTIFICATION_TEMPLATES |o--o{ NOTIFICATION_DELIVERIES : formats
  COMPANIES ||--o{ IDEMPOTENCY_RECORDS : deduplicates
  PROFILES ||--o{ USER_PREFERENCES : customizes
  PROFILES |o--o{ AUDIT_LOGS : acts
  PROFILES |o--o{ SETTINGS : updates
```

`shipping_rules` and versioned `settings` govern calculations through snapshotted configurations. `outbox_events.aggregate_id` and `audit_logs.entity_id` are intentionally polymorphic identifiers; domain handlers validate them. They are not relational foreign keys. Provider event IDs are deduplicated per integration account, including its test/live mode.
