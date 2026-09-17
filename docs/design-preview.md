# Wholesale design preview

Private preview: https://horizon-vert-wholesale.widzer-ridore-1.chatgpt.site

Implemented September 17, 2026 in `web/`. This is an interactive design artifact, separate from implementation of the production architecture.

## Design direction

Existing Horizon Vert orange identity, warm neutral backgrounds, compact product information, consistent case-based quantities and a restrained operations workspace. Public retail product photographs are sourced from https://horizonvertfoods.com; wholesale SKUs, prices, packaging, availability, customers and orders are illustrative.

The top preview bar switches between the buyer portal and admin workspace. Buyer interactions include product search/filtering, grid/list views, product detail, volume pricing, saved products, quick SKU ordering, reorder, cart, delivery selection, card/ACH checkout presentation and application preview. Admin interactions include order filtering/export, application review, product/price editing and order-minimum settings. Preview changes stay in memory and reset on refresh.

No live account creation, authentication, checkout, payment capture, shipping request or email sending is implemented. Full production authorization and tenant isolation remain subject to the approved architecture phases.

## Validation performed

- TypeScript check passed.
- Production design build passed.
- Local initial route returned HTTP 200.
- Fixture checks passed for product image existence, unique SKU values, integer-cent price formatting, and volume-price boundaries at 1, 9, 10 and 999 cases.
- Private deployment reported success.
- Browser visual and interactive QA was not performed: no browser was connected in this session. Responsive CSS and accessible dialog primitives are implemented, but this does not establish a completed accessibility audit.

The preview uses the Sites Vinext scaffold with Next.js App Router conventions. Production runtime choice and integration compatibility should be reviewed before moving backend commerce implementation into this frontend project.
