# AI Mentor Provider Adapter

## Architecture

The Creator Studio AI Mentor now has a server-side adapter for an OpenAI-compatible chat-completions API. The browser sends only the user's explicit question and short project metadata (studio, title, goal, style). It does not send the manuscript or uploaded assets.

Required Supabase Edge Function secrets:
- `NARATIVA_AI_API_KEY` — provider key; never expose it to the browser.
- `NARATIVA_AI_BASE_URL` — optional; defaults to `https://api.openai.com/v1/chat/completions`.
- `NARATIVA_AI_MODEL` — optional; defaults to `gpt-4o-mini`.

The adapter requires a valid Supabase session and explicit per-request consent, caps each question/context field, uses a 25-second timeout, and limits each account to 30 requests/hour. The server records provider, model, outcome and token counts in `ai_mentor_usage`; prompts and manuscript text are not stored in that table.

## Current live status

The Edge Function can be deployed without the provider key, but generative responses remain unavailable until `NARATIVA_AI_API_KEY` is configured in Supabase Edge Function secrets. When the secret is absent, the endpoint returns `provider_not_configured`; the Creator Studio continues to show built-in contextual guidance instead.

## Scope

This is the first generative integration: the AI Mentor. It does not render images, audio, video, 3D meshes or camera AR. Those require separate provider adapters, asynchronous job tracking, budget controls and verified provider webhooks/callbacks. Do not treat a text answer as completed media production.
