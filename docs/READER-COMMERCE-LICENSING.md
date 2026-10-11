# NARATIVA Reader: licensing, downloads, and creator revenue

## Product intent

The Reader is a first-party NARATIVA experience. A reader opens a published work inside the platform rather than being sent to a third-party reading destination. Content must be stored by NARATIVA or delivered through an explicitly authorized storage integration.

## Reader actions

- **Back / previous page:** move to the previous page or reading segment.
- **Continue / next page:** move to the next page or continue to the next work/chapter where available.
- **Full screen / half-screen:** switch between a compact modal and an immersive reading surface.
- **Exit:** close the reader and return to the catalogue.
- **Save:** save reading-list metadata on the current device in the prototype.
- **Download / license:** show whether the work is downloadable and under what rights. Only eligible demo assets with explicit CC BY 4.0 metadata currently allow a sample page download.

## Commercial model — production requirements

The prototype does not process payments and does not yet calculate or distribute revenue. Do not present the sample download as a completed monetization integration.

Before paid downloads or other paid access can go live, implement and test:

1. Creator onboarding, identity/ownership declaration, and explicit agreement to the creator contract.
2. Work-level rights and license fields: who may download, permitted uses, territories, duration, exclusivity, price, tax treatment, and whether offline copies are allowed.
3. Creator-defined or creator-approved price, platform fee, creator revenue share, refunds, chargebacks, and payout schedule.
4. Checkout/payment-provider integration with server-side verification and idempotent payment webhooks.
5. Entitlement records linking a successful order to the buyer, work/version, license, payment status, and receipt.
6. Protected downloads using short-lived signed URLs or authenticated delivery. Never place service-role credentials or private storage keys in browser code.
7. Audit events for publication, license changes, purchase, download, refunds, and payout calculations.
8. Copyright complaint, takedown, appeal, moderation, and dispute workflows.
9. Terms of Service, Creator Agreement, Privacy Notice, refund policy, and downloadable-license terms reviewed for applicable Indonesian law and any target markets.
10. Clear buyer disclosure before payment and an accessible order history / license receipt after payment.

## Suggested transparent settlement model

For each eligible order:

- Gross amount paid by buyer
- Less refunds and chargebacks (allocated under the published contract)
- Less payment-provider fees and applicable taxes as defined in the terms
- Remaining distributable amount split using the contractually agreed creator/platform percentages

The actual percentage, tax handling, payment provider, minimum payout threshold, and payout timing are intentionally **not set in this prototype**. Do not invent a rate or show a simulated balance as real money. Make these settings visible and versioned before accepting payments.

## Data model proposal

- `works`: creator ID, publication status, content type, storage path, rights status, default license.
- `work_versions`: immutable or versioned content references and metadata.
- `work_offers`: work/version, price, currency, license ID, territory, status.
- `license_terms`: permitted use, download rules, territory, duration, terms version.
- `orders` and `order_items`: buyer, offer, amount, currency, tax/fee breakdown, payment state.
- `entitlements`: buyer, purchased work/version, license, validity, revocation/refund state.
- `creator_ledger`: append-only entries for gross sales, fees, refunds, tax, platform share, creator share, adjustments, payout.
- `payouts`: creator, amount, destination reference, state, and audit metadata.
- `audit_events`: actor, action, work/order reference, timestamp, and relevant non-secret metadata.

Use database row-level security and server-side authorization. Never trust a price, creator ID, payment state, or revenue split submitted by the browser.

## Presentation prototype status

Implemented in the static reader:
- Responsive half-screen modal and full-screen reader toggle.
- Previous/next page controls, save, continue to next sample, and exit actions.
- Download action with a rights-aware explanation; only explicitly labeled demo pages may be downloaded.
- Honest notice that payment and revenue-sharing are not active yet.

Still required for production:
- Real account-bound creator upload/publishing and private media storage.
- Payment checkout, licensing enforcement, signed download delivery, ledger reconciliation, and payouts.
- Legal review, security tests, accessibility checks, and end-to-end purchase/refund testing.
