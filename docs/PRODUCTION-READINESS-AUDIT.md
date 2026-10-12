# NARATIVA Production Readiness Audit

**Audit date:** 2026-10-12  
**Repository:** `Yudi8377/NARATIVA`  
**Public site:** `https://yudi8377.github.io/NARATIVA/`  
**Supabase project:** `hdsqwkydgruyfbqqwhdk`

This is a source/configuration and live-schema audit. It is **not** a successful authenticated end-to-end production test: no test creator account/session was used, and the live core tables currently report zero rows.

## Executive summary

NARATIVA has a real Supabase project and a partial creator-to-reader persistence path. The path is implemented in code, but a full account-level save → publish → public-read test remains outstanding. Commerce is a catalog-metadata workspace, not yet a checkout/royalty/payment system. Admin Console now has a server-verified, read-only metrics foundation; it stays locked until an operator is explicitly assigned the platform_admin role. Moderation and other privileged actions remain disabled. Production media engines are not yet connected.

## Feature status matrix

| Area | Status | Evidence / limitation |
|---|---|---|
| Public reader and local library | **Working for included local/demo works** | Static catalogue and local comic/book assets are shipped with the site. |
| Creator Studio workspace UI | **Working in browser** | Seven specialized workspaces; photo adjustments/export happen locally. |
| Signed-out creator drafts | **Local-only** | Browser storage is not cross-device cloud persistence. |
| Signed-in draft save/versioning | **Implemented; needs account E2E** | `experiences.js` writes `books` and `book_versions` through Supabase. |
| Creator publication | **Implemented; needs account E2E** | Publishing updates `books.status` to `published`; reader query uses that status. RLS and reader rendering must be exercised with a real account and anonymous session. |
| Published works in Reader Space | **Partially connected** | Reader queries published rows and the latest canonical version. Current production table row count is zero, so no live creator work was available to verify. |
| Asset upload | **Implemented; needs permission test** | Creator uploads to private `narativa-assets` bucket and uses short-lived signed URLs. Test owner isolation and expiry. |
| AI Mentor | **Provider adapter deployed; secret status unverified** | Creator Studio now requires explicit per-request consent and calls a server-side, rate-limited OpenAI-compatible adapter. Without `NARATIVA_AI_API_KEY`, local tutorials remain available. |
| Story pipeline | **Active scaffold, not generative AI** | Edge Function `story-pipeline` returns deterministic scene segmentation and explicitly reports language/image/speech/video generation and persistence as false. |
| Commerce catalog | **Dedicated product catalog foundation** | This change separates product/listing metadata into `commerce_products` with owner-scoped RLS. Orders and royalty tables are server-write-only foundations; no checkout, payment settlement, or payout is implemented. |
| Etsy connector | **Backend deployed; connection not verified** | OAuth function exists, but successful OAuth depends on server secrets, registered callback and vendor authorization. Listing/order sync is not active. |
| WooCommerce connector | **Backend deployed; connection not verified** | Function and credential table exist; store connection and product/order sync still require real configuration and verification. |
| Other vendor cards | **UI/documentation only** | Cards open official documentation; they do not establish an active API connection. |
| Admin Console | **Read-only metrics foundation** | A JWT-verified Edge Function checks `platform_admin_roles`, returns aggregate metrics only, and logs access. No account is automatically granted admin; moderation and other privileged actions remain disabled. |
| Payments, royalties, disputes | **Not implemented** | No verified payment provider/settlement flow or royalty ledger in the current user journey. |
| AI image and speech | **Server adapter implemented; provider secret status unverified** | Creator Studio can request image or TTS generation, requires per-request consent, stores output in private Storage, and links it to the selected work. Successful live generation still needs a verified provider key and authenticated test. |\n| AI video, 3D mesh/rig, camera AR | **Not connected as production engines** | Video and 3D need provider-specific APIs/runtime; AR needs a camera runtime and compatible assets. The OpenAI Videos/Sora API is no longer an option after its 2026 deprecation. |

## Live backend findings

- Supabase project is active and the core tables exist, including `profiles`, `books`, `book_versions`, `book_assets`, reading progress, AI sessions/messages, and collective-intelligence tables.
- The Auth schema contains one account, while `books`, `book_versions`, and `book_assets` reported zero rows during this audit; that does not prove the save flow is broken, but means there is no existing live work to use as an end-to-end fixture.
- The live migration history now contains 12 entries. The two new additive backend migrations match the applied version identifiers, but the repository still does not contain the original core migrations. Full database recreation is therefore not yet reproducible from the repository. The core database schema therefore is not fully reproducible from the repository migration directory. **Fix migration-source parity before disaster recovery or another environment is attempted.**
- Supabase Auth is on the Free plan. Leaked-password protection is disabled, and Supabase documents this feature as available on Pro and above; it cannot be enabled on the current plan. Use strong password requirements and MFA where available, or upgrade if leaked-password screening is a release requirement.
- Advisor reported three connector credential/state tables with RLS enabled and no policies. These tables also revoke browser-role access and grant service-role access; that can be intentional for server-only secrets. Keep them inaccessible to browser roles and document the server-only design.
- Performance advisor initially reported unindexed foreign keys on Etsy OAuth state, admin roles, reports, and production job assets; additive migrations added those indexes. A follow-up migration now wraps the 32 existing direct `auth.uid()` policy calls in scalar subqueries, preserving predicates while addressing per-row re-evaluation. Re-run the advisor after that migration to confirm.

## Creator → reader path to verify

1. Sign in using a dedicated test creator account.
2. Create a uniquely titled short work and save as draft.
3. Confirm exactly one owned `books` row and a `book_versions` row are created.
4. Refresh Creator Studio and reopen the work; verify title, body, format and rights metadata.
5. Publish it and confirm `books.status = 'published'`.
6. Open Reader Space in a separate signed-out/private session; verify the published card appears and opens the same canonical body.
7. Verify an unpublished draft does not appear to anonymous readers.
8. Upload a private asset; verify another account cannot read it and that a signed URL expires.
9. Repeat update → save → publish to verify version numbers increment and duplicate slugs do not collide.

**Release gate:** do not mark this path “passed” until steps 1–9 have been executed against real authenticated sessions and recorded with non-sensitive evidence.

## Recommended work order

1. Add repeatable static contract checks to CI (this change).
2. Run the authenticated creator-to-reader test; fix any RLS, content shape, or reader errors found.
3. Bring live schema migration history back into version control and test restore/branch parity.
4. Build server-side admin role authorization before enabling moderation actions.
5. Complete Commerce catalog validation, then add orders/payment-provider webhooks and an auditable royalty ledger.
6. Connect production media providers through server-side functions, with per-user consent, quotas, budget caps and job status tracking.
7. Re-run security/performance advisors and the end-to-end suite before public monetization.

## Scope and safety

No production rows were inserted, deleted or changed by this audit. No secrets were requested or placed in the browser. The audit does not claim a successful real-account workflow test.
