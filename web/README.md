# Horizon Vert Foods — interactive design preview

A US-first wholesale buyer portal and operations admin design. Built with the Sites scaffold (Vinext / Next.js App Router conventions, React, TypeScript, Tailwind, shadcn/Base UI).

This is a design implementation, not the production commerce backend. All account data, packaging, SKU, wholesale prices, inventory and orders are fixtures. Public product photographs come from Horizon Vert Foods' existing retail catalog. No authentication, payment collection, fulfillment submission or application email is connected. Preview state lives in memory and resets on refresh.

## Explore

- Search and filter the catalog; switch grid/list views.
- Open product details and change case quantities to see volume pricing.
- Save products, enter SKUs in Quick order, add to cart, and review checkout.
- Reorder sample purchases and explore account/application screens.
- Switch to Admin workspace to review sample orders/applications, edit product pricing and change the order minimum. Product and minimum changes carry back to the buyer preview within the same session.

## Local development

`npm install` then `npm run dev`. `npm run build` produces the Sites Worker build. `npx tsc --noEmit` checks TypeScript.

## Design structure

- `app/globals.css`: shared theme tokens, responsive layouts and component treatments.
- `components/commerce`: buyer shell, admin workspace and reusable purchasing components.
- `modules/catalog`: explicitly marked sample catalog and order fixtures.
- `components/ui`: scaffolded accessible interaction primitives.

Production architecture and implementation gates remain documented in `../docs/architecture`. The preview does not apply those database migrations or claim production authorization/security is implemented.
