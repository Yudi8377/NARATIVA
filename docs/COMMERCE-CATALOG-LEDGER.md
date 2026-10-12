# NARATIVA Commerce: Catalog and Royalty Ledger Foundation

## What is implemented

- `commerce_products` stores product/listing metadata separately from canonical story content.
- Creators can manage only products linked to their own books.
- Anonymous readers can read only active products whose source book is published.
- `commerce_orders`, `commerce_order_items`, and `royalty_ledger` are server-write-only foundations for future checkout, reconciliation, and creator earnings.
- Buyers can read only their own orders and their order items; creators can read only their own order items and royalty entries.
- Provider payment IDs have a unique partial index to support idempotent webhook reconciliation.
- The migration also adds missing FK indexes identified during the admin-schema security/performance review.

## What is not yet enabled

No checkout endpoint, payment provider, verified payment webhook, refunds, payout integration, tax calculation, or production royalty distribution is enabled by this schema alone. Do not treat a product record or a pending order as proof of payment. Only a trusted server workflow may create orders/items or write royalty rows after validating a provider event.

## Price convention

Amounts are stored as integer minor units in the currency recorded on each row. For IDR, the UI uses whole rupiah values. Currency conversion and tax treatment must be explicit; do not infer FX rates or tax from the product row.

## Security boundaries

- RLS is enabled on all commerce tables.
- Browser roles have no write access to orders, order items, or royalty ledger.
- The product table has owner-scoped write policies and public read only for active products attached to published books.
- Payment secrets and provider webhook signing secrets must remain server-side.
- The royalty ledger is not a substitute for legal terms, payout KYC, tax reporting, or dispute handling.
