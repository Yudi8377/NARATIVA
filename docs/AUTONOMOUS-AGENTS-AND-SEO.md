# NARATIVA — Autonomous Quality Agents & SEO Operating Model

## What runs autonomously

The GitHub Actions workflow \`.github/workflows/narativa-autonomous-agents.yml\` runs on relevant pushes, every six hours, and on manual dispatch. It creates a run artifact containing JSON and Markdown quality reports.

| Agent | Responsibilities |
|---|---|
| SEO & discoverability | Checks titles, descriptions, language, canonical metadata, Open Graph coverage, sitemap and robots alignment |
| Security & privacy | Scans public assets for common privileged-key patterns, internal workflow URLs, unsafe new-tab links, and admin crawl rules |
| Performance & resilience | Flags oversized HTML and render-blocking scripts |
| Accessibility | Flags images without alt text |
| Functional / regression | Checks core assets exist and runs existing production contract and JavaScript syntax checks |

## SEO baseline

- Maintain a single canonical host and a clean sitemap containing indexable public pages only.
- Keep admin and operational pages out of the sitemap and discourage crawlers from indexing them.
- Use distinct, human-readable titles and descriptions for each public page.
- Provide Open Graph metadata for sharing and structured data only when it truthfully describes the visible page.
- Keep internal source repositories, CI workflows, credentials, and operational notes out of public UI.
- Publish useful original work and creator pages only when the content is real, permissioned, and indexable.
- Do not use keyword stuffing, doorway pages, fake reviews, fabricated authorship, or automated mass-generated thin pages.

## Self-improvement loop

1. Every audit produces a timestamped artifact.
2. Compare findings across runs to identify recurring defects.
3. Prioritize by severity and user impact: security/privacy, broken journeys, speed, accessibility, then SEO refinements.
4. Implement a small reviewed patch and rerun tests before deployment.
5. Expand tests when a regression escapes detection.

The audit currently uses deterministic checks, not an LLM. It does not train or autonomously modify its own model. This is deliberate: stable, reproducible checks are safer for production. LLM-powered review can be added later behind an explicitly configured provider, with cost limits, redaction, and human-reviewed patches.

## Boundaries

This workflow is a static code/content audit, not a full penetration test, browser-based performance benchmark, external uptime monitor, or guarantee that all security issues are absent. It does not mutate production data, change access policies, publish code by itself, or make destructive database changes. A failed check should block confidence in a release and lead to a reviewed fix.
