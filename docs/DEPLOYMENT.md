# NARATIVA Website Deployment

## Current release

- Hosting: Hatchable
- Project: NARATIVA — One Story, Many Worlds
- URL: https://narativa-one-story.hatchable.site
- Current deployed version: v2
- GitHub source: `website/`
- Deploy status: live on hosting
- Public visibility: pending owner action; project is currently private by default

## Make the site accessible to everyone

1. Open the [NARATIVA project console](https://hatchable.com/console/projects/narativa-one-story).
2. Open **Settings**.
3. Change project visibility from **Personal/Private** to **Public** and save.
4. Open the base URL in a private/incognito browser window to confirm the sign-in wall is gone.

The time-limited stranger preview is for verification only and is not a permanent public URL.

## What currently works

- Responsive Indonesian-first product landing page.
- Story Universe, Living Library, format examples, principles, and phased roadmap.
- Browser-local Creator Studio scene outline. Text entered into the prototype is processed in the browser and is not submitted to an application API.
- Static assets are stored in the GitHub repository under `website/`.

## Not yet production-connected

- The Creator Studio is a deterministic drafting prototype, not an LLM-driven feature.
- The Supabase `story-pipeline` function is a separate backend foundation and is not wired into this frontend.
- No live image, speech, video, payment, user-account, or publishing workflow is connected yet.
- A production release still needs authenticated creator workspaces, manuscript persistence, private asset storage, reviewer roles, rights tracking, and tests for access policies.

## Release history

- v1: initial landing page and local Creator Studio.
- v2: portable relative asset paths for repository reuse.
