import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MEDIA_API_KEY = Deno.env.get("NARATIVA_MEDIA_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "";
const IMAGE_MODEL = Deno.env.get("NARATIVA_IMAGE_MODEL") || "gpt-image-2.5-flare";
const SPEECH_MODEL = Deno.env.get("NARATIVA_SPEECH_MODEL") || "gpt-4o-mini-tts";
const SITE_ORIGIN = new URL(Deno.env.get("NARATIVA_SITE_URL") || "https://yudi8377.github.io/NARATIVA").origin;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function markFailed(jobId: string, errorCode: string) {
  await db.from("production_jobs").update({ status: "failed", error_code: errorCode, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "authentication_required" }, 401);
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "authentication_invalid" }, 401);
  const user = authData.user;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (body.consent !== true) return json({ error: "consent_required" }, 403);

  const capability = clean(body.capability, 24);
  if (!["image", "speech"].includes(capability)) {
    return json({ error: "engine_not_connected", message: "Engine video dan 3D memerlukan provider khusus yang belum dikonfigurasi." }, 501);
  }
  const bookId = clean(body.book_id, 64);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookId)) {
    return json({ error: "saved_project_required", message: "Simpan atau buka karya terlebih dahulu." }, 400);
  }
  const prompt = clean(body.prompt, capability === "speech" ? 4096 : 4000);
  if (prompt.length < 4) return json({ error: "prompt_too_short" }, 400);
  if (capability === "speech" && prompt.length > 4096) return json({ error: "speech_text_too_long" }, 400);

  const { data: book, error: bookError } = await db.from("books").select("id,title").eq("id", bookId).eq("owner_id", user.id).maybeSingle();
  if (bookError || !book) return json({ error: "owned_project_required" }, 404);

  const now = Date.now();
  const sinceHour = new Date(now - 60 * 60 * 1000).toISOString();
  const sinceDay = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const [{ count: hourlyCount, error: hourError }, { count: dailyCount, error: dayError }] = await Promise.all([
    db.from("production_jobs").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("capability", capability).gte("created_at", sinceHour),
    db.from("production_jobs").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("capability", capability).gte("created_at", sinceDay),
  ]);
  if (hourError || dayError) return json({ error: "usage_check_unavailable" }, 503);
  const hourLimit = capability === "image" ? 5 : 20;
  const dayLimit = capability === "image" ? 20 : 60;
  if ((hourlyCount ?? 0) >= hourLimit || (dailyCount ?? 0) >= dayLimit) {
    return json({ error: "rate_limit_exceeded", message: "Batas engine tercapai. Coba lagi nanti." }, 429);
  }

  const model = capability === "image" ? IMAGE_MODEL : SPEECH_MODEL;
  const { data: job, error: jobError } = await db.from("production_jobs").insert({
    owner_id: user.id, book_id: book.id, capability, status: "running",
    provider: "openai", model, prompt_hash: await sha256(prompt),
  }).select("id").single();
  if (jobError || !job) return json({ error: "job_create_failed" }, 503);

  if (!MEDIA_API_KEY) {
    await markFailed(job.id, "provider_secret_missing");
    return json({ error: "provider_not_configured", message: "Provider media belum dikonfigurasi di secret server. Tidak ada aset yang dibuat." }, 503);
  }

  let bytes: Uint8Array;
  let contentType: string;
  let extension: string;
  let usage: Record<string, unknown> = {};
  try {
    if (capability === "image") {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Authorization": "Bearer " + MEDIA_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1, size: "1024x1024", moderation: "auto" }),
        signal: AbortSignal.timeout(90000),
      });
      if (!response.ok) { await markFailed(job.id, "provider_http_" + response.status); return json({ error: "provider_request_failed", message: "Provider gambar menolak permintaan. Periksa konfigurasi dan kuota." }, 502); }
      const result = await response.json();
      const base64 = result?.data?.[0]?.b64_json;
      if (typeof base64 !== "string" || !base64) { await markFailed(job.id, "image_payload_missing"); return json({ error: "provider_invalid_response" }, 502); }
      bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      contentType = "image/png"; extension = "png";
      usage = result.usage && typeof result.usage === "object" ? result.usage : {};
    } else {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Authorization": "Bearer " + MEDIA_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: SPEECH_MODEL,
          input: prompt,
          voice: clean(body.voice, 24) || "coral",
          instructions: clean(body.instructions, 400) || "Bacakan dalam bahasa Indonesia dengan intonasi natural dan ekspresif. Suara ini dihasilkan AI, bukan manusia.",
          response_format: "mp3",
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (!response.ok) { await markFailed(job.id, "provider_http_" + response.status); return json({ error: "provider_request_failed", message: "Provider suara menolak permintaan. Periksa konfigurasi dan kuota." }, 502); }
      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength || buffer.byteLength > 20 * 1024 * 1024) { await markFailed(job.id, "audio_size_invalid"); return json({ error: "audio_size_invalid" }, 502); }
      bytes = new Uint8Array(buffer);
      contentType = "audio/mpeg"; extension = "mp3";
    }
  } catch {
    await markFailed(job.id, "provider_unreachable_or_invalid");
    return json({ error: "provider_unreachable", message: "Provider media tidak dapat dijangkau atau mengembalikan respons tidak valid." }, 502);
  }

  const path = user.id + "/" + book.id + "/" + job.id + "-ai-generated." + extension;
  const { error: uploadError } = await db.storage.from("narativa-assets").upload(path, bytes, {
    upsert: false, contentType, cacheControl: "3600",
  });
  if (uploadError) { await markFailed(job.id, "asset_storage_failed"); return json({ error: "asset_storage_failed", message: "Aset tidak berhasil disimpan ke penyimpanan privat." }, 503); }

  const assetType = capability === "image" ? "page_image" : "audio";
  const altText = capability === "image" ? "Ilustrasi hasil AI untuk " + book.title : "Narasi suara hasil AI untuk " + book.title;
  const { data: asset, error: assetError } = await db.from("book_assets").insert({
    book_id: book.id,
    asset_type: assetType,
    asset_url: path,
    alt_text: altText,
    created_by: user.id,
    rights_metadata: {
      owner_name: clean(body.owner_name, 120),
      license: clean(body.license, 100) || "Hak penuh di tangan kreator",
      ai_processing_allowed: true,
      provider: "OpenAI",
      ai_generated: true,
    },
    metadata: {
      storage_bucket: "narativa-assets",
      visibility: "private",
      mime_type: contentType,
      size_bytes: bytes.byteLength,
      generated_by: "production-engine",
      production_job_id: job.id,
      ai_generated: true,
    },
  }).select("id").single();
  if (assetError || !asset) {
    await db.storage.from("narativa-assets").remove([path]);
    await markFailed(job.id, "asset_metadata_failed");
    return json({ error: "asset_metadata_failed", message: "Aset dibuat tetapi metadata tidak berhasil dicatat; berkas dibersihkan." }, 503);
  }

  const { error: updateError } = await db.from("production_jobs").update({
    status: "succeeded", output_asset_id: asset.id, output_storage_path: path,
    output_content_type: contentType, usage, updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }).eq("id", job.id).eq("owner_id", user.id);
  if (updateError) return json({ error: "job_finalize_failed", message: "Aset tersimpan, tetapi status job belum dapat difinalisasi." }, 503);

  const { data: signed, error: signedError } = await db.storage.from("narativa-assets").createSignedUrl(path, 60);
  if (signedError || !signed?.signedUrl) return json({ error: "preview_unavailable", message: "Aset tersimpan privat; tautan pratinjau sementara gagal dibuat." }, 503);

  return json({
    ok: true,
    jobId: job.id,
    assetId: asset.id,
    capability,
    model,
    contentType,
    sizeBytes: bytes.byteLength,
    signedUrl: signed.signedUrl,
    signedUrlExpiresInSeconds: 60,
    notice: "Aset AI disimpan privat dan ditandai sebagai hasil AI. Tautan pratinjau berlaku 60 detik.",
  });
});
