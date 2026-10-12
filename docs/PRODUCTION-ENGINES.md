# Private AI Image and Speech Engines

## Connected engine endpoints

The `production-engine` Edge Function is the server-side adapter for:
- **Image generation:** OpenAI Images API, default model `gpt-image-2.5-flare`.
- **Speech generation:** OpenAI Audio Speech API, default model `gpt-4o-mini-tts`.

Official API references:
- Images: https://developers.openai.com/api/docs/guides/image-generation/
- Text-to-speech: https://developers.openai.com/api/docs/guides/text-to-speech/

The API key is never sent to the browser. Configure `NARATIVA_MEDIA_API_KEY` or `OPENAI_API_KEY` as a Supabase Edge Function secret. Optional model overrides are `NARATIVA_IMAGE_MODEL` and `NARATIVA_SPEECH_MODEL`.

## Privacy and access controls

- Requires a valid Supabase session, a saved project owned by that account, and explicit per-request consent.
- Only the selected prompt/narration text is sent to the configured provider. The full manuscript and uploaded assets are not automatically attached.
- Prompts are hashed for job records; the raw prompt is not stored in `production_jobs`.
- Generated assets are stored in the private `narativa-assets` bucket and linked to the selected work in `book_assets`.
- Preview URLs expire after 60 seconds. The underlying asset remains private.
- Rate limits: up to 5 image jobs/hour and 20/day; up to 20 speech jobs/hour and 60/day per account.
- Every generated asset is marked `ai_generated` and identifies OpenAI as the provider.

## Not yet connected

- **Video generation:** no video provider is configured. The OpenAI Videos/Sora API was deprecated/removed in September 2026; do not build against it.
- **3D mesh generation:** needs a dedicated provider or self-hosted model/runtime and a compatible export/validation path.
- There is no monetary spend cap yet; request-rate limits reduce abuse but are not a substitute for provider billing limits and budget alerts. Configure provider-side budget/usage alerts before enabling broad public access.
- Provider secrets are not readable through this integration, so successful real generation must be verified with an authenticated test account once the key is configured.
