# NARATIVA Deployment & Go-Live Checklist

## Current release state

- Hatchable project: [NARATIVA — One Story, Many Worlds](https://hatchable.com/console/projects/narativa-one-story)
- Hosted URL: https://narativa-one-story.hatchable.site
- Latest Hatchable deployment: **v7 — deployed**
- Hatchable visibility: **Personal / private**; anonymous visitors still see the platform sign-in wall. This owner-only setting must be changed in Hatchable Settings if that host is the public production origin.
- Public source repository: https://github.com/Yudi8377/NARATIVA
- **Public website:** https://yudi8377.github.io/NARATIVA/ — GitHub Pages workflow completed successfully; anonymous smoke tests returned HTTP 200 for the homepage, all four user spaces, and shared CSS/JS assets.
- Supabase project: `hdsqwkydgruyfbqqwhdk`.
- Collective backend: `collective-orchestrator` Edge Function v1, JWT verification enabled.
- Hatchable v7 dry run: passed with no errors or warnings.
- Hatchable preview smoke test: all new pages returned HTTP 200 through the temporary visitor preview; Hatchable's base origin still returns a sign-in wall because visibility remains private.
- GitHub Pages live-origin smoke test: `/`, `/spaces.html`, `/reader.html`, `/creator.html`, `/commerce.html`, `/admin.html`, `/experience.css`, `/experiences.js`, `/collective.css`, `/collective.js`, and `/vendor/supabase.js` returned HTTP 200.
- `robots.txt` and `sitemap.xml` are published; the admin shell is excluded from the sitemap and disallowed for crawlers.
- JavaScript syntax checks: `public/app.js`, `public/collective.js`, and `public/experiences.js` parsed successfully in the project runtime.

## Adaptive experience pages shipped in v5; email redirect fix shipped in v7

- `website/index.html`: public brand website / story universe.
- `website/spaces.html`: role and workspace selector.
- `website/reader.html`: reader discovery, search/genre filters, reading preview, local saved list.
- `website/creator.html`: writing and comic workspaces, authenticated cloud work/version saving, explicit publish action, private asset upload, and rights/provenance fields.
- `website/commerce.html`: local catalog editor and honest vendor readiness statuses.
- `website/admin.html`: governance shell with privileged actions disabled until server-side authorization is implemented.
- `website/experience.css`, `website/experiences.js`: responsive styles and local browser interactions.
- `.github/workflows/pages.yml`: automatic static-site deployment workflow from the `website/` directory.

## Owner actions required for a public production launch

1. **Public origin is GitHub Pages:** https://yudi8377.github.io/NARATIVA/. The Hatchable host remains private; change visibility to Public in [Hatchable Settings](https://hatchable.com/console/projects/narativa-one-story) only if that host is also intended to be public.
2. In [Supabase Authentication URL Configuration](https://supabase.com/dashboard/project/hdsqwkydgruyfbqqwhdk/auth/url-configuration), set Site URL to `https://yudi8377.github.io/NARATIVA/` and add `https://yudi8377.github.io/NARATIVA/**` to Redirect URLs. The sign-up code now explicitly requests `https://yudi8377.github.io/NARATIVA/#collective` as the confirmation callback, but Supabase's allow-list and email template still need to be checked in the dashboard.
3. If the email link itself still contains `localhost`, open Supabase Authentication → Email Templates → Confirm signup. Use `{{ .ConfirmationURL }}` for the confirmation link (not a hard-coded localhost URL or `{{ .SiteURL }}` as the link target). Keep the production callback allow-listed. Then register a fresh test account and confirm the final URL remains on `yudi8377.github.io`.
4. Enable Supabase Auth leaked-password protection (the current security advisor reports it disabled): [password security guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
5. Verify email confirmation settings and sender deliverability with a fresh test registration. The live public client uses the configured publishable key, the Auth settings endpoint responds, the collective table is reachable, and the orchestrator correctly rejects unauthenticated requests; this does not replace a full sign-up/email-confirmation/sign-in test.
5. Before accepting shared knowledge/skills at scale, create an owner-controlled moderator identity and review process.
6. Before enabling Admin Console actions, implement and test server-side admin role provisioning, permission checks, audit records, and protected API routes.
7. Before calling commerce integration live, register official vendor apps and implement each vendor's approved OAuth/API and webhook contract.

## Post-deployment smoke tests

- Open the chosen public origin in a private/incognito window; confirm no hosting sign-in wall.
- Check `/`, `/spaces.html`, `/reader.html`, `/creator.html`, `/commerce.html`, and `/admin.html`.
- Verify mobile layout, keyboard navigation, reduced motion, page titles, and browser console.
- Reader: filter stories, open/close reading modal, save a story, and verify the saved list is local to that browser.
- Creator: switch between writing/comic modes, verify storyboard submission is blocked until processing consent is checked, save a version, reopen it, upload a small test file, and confirm the asset metadata is visible only to its owner.
- Commerce: add a catalog item and confirm vendor buttons never claim to have connected or published anything.
- Admin: confirm no privileged data or controls are exposed to an anonymous visitor.
- Collective AI: configure Supabase Auth Site URL/Redirect URLs, then test sign-up, email confirmation, sign-in/out, owner-scoped agent/task creation, and private/shared submission boundaries.
- Confirm the Creator Studio does not send manuscript text to the server unless a future feature explicitly discloses and obtains permission.

## Remaining production gaps

- Reader bookmarks and unauthenticated creator drafts remain local and are not synchronized. Authenticated creator works, versions, and asset metadata are cloud-backed.
- Private asset uploads use Supabase Storage and owner-folder RLS, but malware scanning, content validation beyond MIME/size constraints, media processing, and signed-download UX are not implemented.
- Autonomous AI agent execution and fan-out are not implemented.
- Model provider integration, model budget enforcement, retry/cancellation worker, and moderation review actions are not implemented.
- Vendor connector cards are not active API integrations.
- Admin Console is a UI shell; protected admin routes and role provisioning are not implemented.
- Automated browser E2E and cross-account authorization tests remain required.
- Supabase Auth URLs and permanent public hosting visibility must be verified by the owner.

A deployed version is not equivalent to a public, production-complete service. Do not advertise autonomous AI execution, live vendor integrations, cloud-synced creator workspaces, or active admin controls until their respective backend paths have been implemented and tested.
