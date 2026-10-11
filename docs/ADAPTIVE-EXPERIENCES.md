# NARATIVA Adaptive Experiences Architecture

## Principle

NARATIVA uses one shared identity, asset model, rights/provenance model, and service layer, but provides different user experiences by goal and role. A role switch is a navigation/workspace choice; it never grants privileges by itself.

## Experience surfaces

| Surface | Primary audience | Main job | Release status |
|---|---|---|---|
| Public website | Visitors, creators, partners | Explain NARATIVA and route visitors to a suitable experience | Static public content |
| Reader Space | Readers and collectors | Discover, read, save, and continue stories | Preview UI; local-only sample content |
| Creator Studio | Writers, comic makers, visual/media creators | Draft work, organize assets, record rights | Local prototype; no cloud persistence |
| Commerce Center | Creators, publishers, sellers | Prepare catalog metadata and review distribution channels | Local catalog prototype; no vendor API active |
| Admin Console | Authorized platform operators | Governance, moderation, rights disputes, vendor health, audit | UI shell only; privileged operations disabled |
| Collective AI | Signed-in contributors | Manage personal agents/tasks and explicitly submit shared knowledge/skills | Supabase-backed foundation; tasks are queued, not executed |

## Shared design system

- Base palette: midnight navy `#10151d`, elevated panel `#171f29`, warm gold `#e7b875`, mint `#9de0c9`, cool blue `#9eb8ff`.
- Typography: DM Sans for interface/body, DM Mono for technical labels, Playfair Display for story/editorial headings.
- Layout: responsive desktop workspace with a compact context rail; mobile navigation wraps into a horizontal, non-sticky workspace selector.
- Motion: short state transitions only; reduced-motion preference disables animation and smooth scrolling.
- Accessibility: semantic anchors/buttons, visible focus, labels for inputs, status announcements, and responsive layouts.

## Data boundaries

- Reader bookmarks, Creator Studio drafts, and Commerce Center catalog entries are stored in local browser storage in this release. They are not cloud-synced and may be cleared by browser data deletion.
- Creator Studio saves authenticated works and version records to Supabase; publication is marked only after a version insert succeeds. Reader discovery queries published works. Account-level end-to-end authorization still requires real-browser testing.
- Private creator asset uploads use the `narativa-assets` bucket and `book_assets` metadata under owner-scoped paths. The browser first shows a local preview; uploading is a separate explicit action and requires an authenticated owner and a saved/open project. Metadata listing does not expose signed download URLs.
- The UI's visibility selector is not, by itself, an authorization boundary. Publication status is updated by the creator action, while database RLS remains the security boundary.
- Story pipeline submission requires explicit manuscript-processing consent in the Creator Studio. Treat pipeline output as draft material for human review.
- Vendor connector cards explain requirements. They do not initiate OAuth or publish listings.
- Admin page contains no privileged data and no admin mutation controls. Do not remove the gate until server-side role enforcement and protected routes are implemented.
- Collective AI sharing is explicit and separate from private work; network visibility must remain opt-in and verified-only.

## Next implementation gates

1. Add an authenticated user/workspace profile and server-side role checks.
2. Implement private asset storage with file type/size validation, malware scanning, metadata extraction, and retention controls.
3. Build persistent projects/assets and owner-scoped APIs with RLS/access tests.
4. Implement official commerce adapters individually; each must handle OAuth, scope, webhook verification, idempotency, retry, and audit.
5. Implement admin provisioning and protected governance APIs before exposing operational data.
6. Run real-browser keyboard, mobile, failure/retry, and cross-account authorization tests.
