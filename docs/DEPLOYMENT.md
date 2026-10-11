# NARATIVA Deployment & Go-Live Checklist

## Current release state

- Hatchable project: [NARATIVA — One Story, Many Worlds](https://hatchable.com/console/projects/narativa-one-story)
- Hosted URL: https://narativa-one-story.hatchable.site
- Latest Hatchable deployment: **v5 — deployed**
- Hatchable visibility: **Personal / private**; anonymous visitors still see the platform sign-in wall. This owner-only setting must be changed in Hatchable Settings if that host is the public production origin.
- Public source repository: https://github.com/Yudi8377/NARATIVA
- **Public website:** https://yudi8377.github.io/NARATIVA/ — GitHub Pages workflow completed successfully; anonymous smoke tests returned HTTP 200 for the homepage, all four user spaces, and shared CSS/JS assets.
- Supabase project: `hdsqwkydgruyfbqqwhdk`.
- Collective backend: `collective-orchestrator` Edge Function v1, JWT verification enabled.
- Hatchable v5 dry run: passed with no errors or warnings.
- Hatchable preview smoke test: all new pages returned HTTP 200 through the temporary visitor preview; Hatchable's base origin still returns a sign-in wall because visibility remains private.
- GitHub Pages live-origin smoke test: `/`, `/spaces.html`, `/reader.html`, `/creator.html`, `/commerce.html`, `/admin.html`, `/experience.css`, `/experiences.js`, `/collective.css`, `/collective.js`, and `/vendor/supabase.js` returned HTTP 200.
- `robots.txt` and `sitemap.xml` are published; the admin shell is excluded from the sitemap and disallowed for crawlers.
- JavaScript syntax checks: `public/app.js`, `public/collective.js`, and `public/experiences.js` parsed successfully in the project runtime.

## Adaptive experience pages shipped in v5

- `website/index.html`: public brand website / story universe.
- `website/spaces.html`: role and workspace selector.
- `website/reader.html`: reader discovery, search/genre filters, reading preview, local saved list.
- `website/creator.html`: writing and comic workspaces, local draft saving, local file preview, rights/provenance fields.
- `website/commerce.html`: local catalog editor and honest vendor readiness statuses.
- `website/admin.html`: governance shell with privileged actions disabled until server-side authorization is implemented.
- `website/experience.css`, `website/experiences.js`: responsive styles and local browser interactions.
- `.github/workflows/pages.yml`: automatic static-site deployment workflow from the `website/` directory.

## Owner actions required for a public production launch

1. **Public origin is GitHub Pages:** https://yudi8377.github.io/NARATIVA/. The Hatchable host remains private; change visibility to Public in [Hatchable Settings](https://hatchable.com/console/projects/narativa-one-story) only if that host is also intended to be public.
2. In [Supabase Authentication URL Configuration](https://supabase.com/dashboard/project/hdsqwkydgruyfbqqwhdk/auth/url-configuration), set Site URL to `https://yudi8377.github.io/NARATIVA/` and add `https://yudi8377.github.io/NARATIVA/**` to Redirect URLs. This owner-side setting has not been changed or verified by this deployment.
3. Verify email confirmation settings and sender deliverability.
4. Before accepting shared knowledge/skills at scale, create an owner-controlled moderator identity and review process.
5. Before enabling Admin Console actions, implement and test server-side admin role provisioning, permission checks, audit records, and protected API routes.
6. Before calling commerce integration live, register official vendor apps and implement each vendor's approved OAuth/API and webhook contract.

## Post-deployment smoke tests

- Open the chosen public origin in a private/incognito window; confirm no hosting sign-in wall.
- Check `/`, `/spaces.html`, `/reader.html`, `/creator.html`, `/commerce.html`, and `/admin.html`.
- Verify mobile layout, keyboard navigation, reduced motion, page titles, and browser console.
- Reader: filter stories, open/close reading modal, save a story, and verify the saved list is local to that browser.
- Creator: switch between writing/comic modes, create outline, save a draft, and preview a selected image; confirm the UI says files are not uploaded.
- Commerce: add a catalog item and confirm vendor buttons never claim to have connected or published anything.
- Admin: confirm no privileged data or controls are exposed to an anonymous visitor.
- Collective AI: configure Supabase Auth Site URL/Redirect URLs, then test sign-up, email confirmation, sign-in/out, owner-scoped agent/task creation, and private/shared submission boundaries.
- Confirm the Creator Studio does not send manuscript text to the server unless a future feature explicitly discloses and obtains permission.

## Remaining production gaps

- Local reader, creator, and commerce state is not cloud-synced, backed up, or shared across devices.
- Asset upload is currently a local preview only; no production object storage or virus/file validation pipeline is connected.
- Autonomous AI agent execution and fan-out are not implemented.
- Model provider integration, model budget enforcement, retry/cancellation worker, and moderation review actions are not implemented.
- Vendor connector cards are not active API integrations.
- Admin Console is a UI shell; protected admin routes and role provisioning are not implemented.
- Automated browser E2E and cross-account authorization tests remain required.
- Supabase Auth URLs and permanent public hosting visibility must be verified by the owner.

A deployed version is not equivalent to a public, production-complete service. Do not advertise autonomous AI execution, live vendor integrations, cloud-synced creator workspaces, or active admin controls until their respective backend paths have been implemented and tested.
