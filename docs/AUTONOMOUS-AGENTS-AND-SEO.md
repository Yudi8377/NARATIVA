# NARATIVA — Autonomous Quality Agents & SEO Operating Model

## What runs autonomously

The GitHub Actions workflow \`.github/workflows/narativa-autonomous-agents.yml\` runs on relevant pushes, every six hours, and on manual dispatch. It creates a run artifact containing JSON and Markdown quality reports.

| Agent | Responsibilities |
|---|---|
| SEO & discoverability | Checks titles, descriptions, language, canonical metadata, Open Graph coverage, sitemap and robots alignment |
| Security & privacy | Scans public assets for common privileged-key patterns, internal workflow URLs, unsafe new-tab links, and admin crawl rules |
| Performance & resilience | Flags oversized HTML and render-blocking scripts |
| Accessibility | Flags images without alt text |
| Functional / regression | Checks core assets exist, runs JavaScript syntax checks and existing production contract tests |
| Site integrity | Checks local HTML/CSS/JS references, titles, descriptions and sitemap-to-file mappings |
| Supabase security contracts | Checks selected Edge Function authentication patterns and production-job RLS/grants |
| Live health monitor | Every six hours probes key public journeys, retries transient errors, records HTTP status and response latency |

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

The static workflow also runs internal-link/sitemap smoke tests and selected Supabase security contract checks. A separate scheduled workflow probes the deployed public site every six hours and stores a health/latency report. These jobs can detect common regressions but cannot prove the absence of vulnerabilities or guarantee a service-level objective.

The audit currently uses deterministic checks, not an LLM. It does not train or autonomously modify its own model. This is deliberate: stable, reproducible checks are safer for production. LLM-powered review can be added later behind an explicitly configured provider, with cost limits, redaction, and human-reviewed patches.

## Boundaries

The static workflow is not a full penetration test or browser-based performance benchmark. The live monitor checks HTTP availability and basic HTML responses, not interactive browser behavior, real user Core Web Vitals, or database correctness. It does not mutate production data, change access policies, publish code by itself, or make destructive database changes. A failed check should block confidence in a release and lead to a reviewed fix.
