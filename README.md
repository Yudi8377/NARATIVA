# NARATIVA — One Story, Many Worlds

NARATIVA is a creative-work universe: one creator identity and canonical asset catalog can support stories, comics, photography, illustration, audio, video, 3D/spatial work, and digital licensing or sales—while preserving rights, provenance, continuity, accessibility, and editorial review.

## Product principles

- **Experience per role:** readers, creators, publishers/sellers, and platform operators get different workflows.
- **Canon first:** adaptations reference approved manuscripts, universe facts, and source material.
- **Human review:** AI-assisted output remains a draft until reviewed and approved.
- **Rights and provenance:** track source, permission/license, contributor, derivative lineage, and publication status.
- **Privacy and safety:** private assets by default, role-based access, child-safety safeguards, and data minimization.
- **Provider adapters:** keep AI and commerce vendors replaceable; keep credentials server-side.
- **Cost controls:** asynchronous jobs, quotas, retries, cancellation, and usage tracking for expensive media generation.

## Current release

- Hatchable deployment: [NARATIVA v7](https://narativa-one-story.hatchable.site), including the adaptive experience pages and the explicit public email-confirmation redirect. **Hatchable visibility is still Personal/Private**, so anonymous visitors still encounter its sign-in wall until the owner changes that setting.
- Public source repository: [Yudi8377/NARATIVA](https://github.com/Yudi8377/NARATIVA).
- **Public website live:** https://yudi8377.github.io/NARATIVA/ — the GitHub Pages deployment workflow completed successfully and all role-specific pages/assets returned HTTP 200 in a live-origin smoke test.
- Backend: Supabase project `hdsqwkydgruyfbqqwhdk`.
- Collective Intelligence endpoint: `collective-orchestrator` v1 with JWT verification.
- Creator Studio saves authenticated works and versioned manuscripts to Supabase; published works appear in Reader. Local unauthenticated drafts remain in the browser.
- Creator asset files can be explicitly uploaded to a private Supabase Storage bucket after a creator signs in and opens/saves a project. Asset metadata is owner-scoped; a user-session upload and cross-account access test are still outstanding.

## Adaptive experiences

- `website/index.html` — public NARATIVA website and concept.
- `website/spaces.html` — experience router / choose a workspace.
- `website/reader.html` — reader discovery, filters, reading preview, and local saved list.
- `website/creator.html` — writing/comic workspace, local drafts, asset preview, and rights fields.
- `website/commerce.html` — local product catalog and vendor connector readiness status.
- `website/admin.html` — admin-console shell and governance checklist. Privileged actions are intentionally disabled until server-side role enforcement exists.
- `website/experience.css` and `website/experiences.js` — shared responsive visual system and interactions for the role-specific spaces.

See [Adaptive Experiences Architecture](docs/ADAPTIVE-EXPERIENCES.md) for the UI contracts and explicit release limitations. Public sitemap: https://yudi8377.github.io/NARATIVA/sitemap.xml.

## Collective Intelligence foundation

See [Collective Intelligence Engineering Blueprint](docs/COLLECTIVE-INTELLIGENCE.md) for the tables, endpoint, privacy boundaries, and phased next steps.

The collective backend currently **stores tasks but does not execute autonomous agents**. Shared knowledge/skills require review before discovery.

## Roadmap

1. **P0 — Foundation and security:** schema, RLS, reviewer workflow, private asset storage, and access tests.
2. **P1 — Adaptive experiences and Living Library:** catalog, manuscript versions, canon, rights, provenance, reader and creator journeys.
3. **P2 — Universal Creative Asset Engine:** images, documents, audio/video, and 3D/spatial metadata and storage.
4. **P3 — Creator Studio and Living Comics:** storyboard/panel editor, motion direction, dialogue, and audio plan.
5. **P4 — Commerce connectors:** official vendor APIs, OAuth, webhook sync, listing status, and revenue reconciliation where supported.
6. **P5 — AI media adapters and Knowledge Fabric:** provider abstraction, job queue, budgets, retries, cancellation, grounded retrieval, and canon-aware assistance.
7. **P6 — Living Page and XR:** expand into immersive formats after the core pipeline is reliable.

## Security status

- Core content tables and collective tables have RLS enabled.
- Collective tasks and agents are owner-scoped.
- Shared knowledge and skills are discoverable only after verification.
- Service-role and provider secrets must never be placed in browser code.
- Reader bookmarks and unauthenticated Creator Studio drafts remain **local browser data**. Authenticated creator works/versions and private asset metadata are cloud-backed. Commerce catalog metadata is stored on the creator's cloud book record, but vendor APIs and checkout are not active.
- Admin UI is a shell only; there is no admin role provisioning or privileged operation API yet.
- Commerce vendor cards are readiness indicators, not active connections. No listing or transaction is created by this release.
- Before production scale, add moderator roles, server-side approval, access tests, rate limits, retention/deletion controls, cost alerts, and child privacy/consent protections.

## Deployment

See [Go-Live Checklist](docs/DEPLOYMENT.md) for deployment status, public visibility, Supabase Auth URL configuration, and smoke tests.
