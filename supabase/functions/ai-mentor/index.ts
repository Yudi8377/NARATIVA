import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_API_KEY = Deno.env.get("NARATIVA_AI_API_KEY") || "";
const AI_BASE_URL = Deno.env.get("NARATIVA_AI_BASE_URL") || "https://api.openai.com/v1/chat/completions";
const AI_MODEL = Deno.env.get("NARATIVA_AI_MODEL") || "gpt-4o-mini";
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
const allowedStudios = new Set(["writing", "comic", "video", "3d", "audio", "learning", "photo"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "authentication_required" }, 401);
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "authentication_invalid" }, 401);
  const user = authData.user;

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (payload.consent !== true) return json({ error: "consent_required" }, 403);

  const question = clean(payload.question, 2000);
  const studio = clean(payload.studio, 24);
  const context = payload.projectContext && typeof payload.projectContext === "object"
    ? payload.projectContext as Record<string, unknown>
    : {};
  const title = clean(context.title, 140);
  const goal = clean(context.goal, 400);
  const style = clean(context.style, 120);
  if (question.length < 3) return json({ error: "question_too_short" }, 400);
  if (!allowedStudios.has(studio)) return json({ error: "invalid_studio" }, 400);

  const { count, error: rateError } = await db.from("ai_mentor_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (rateError) return json({ error: "usage_check_unavailable" }, 503);
  if ((count ?? 0) >= 30) {
    await db.from("ai_mentor_usage").insert({ user_id: user.id, provider: "openai-compatible", model: AI_MODEL, status: "rate_limited", error_code: "hourly_user_limit" });
    return json({ error: "rate_limit_exceeded", message: "Batas AI Mentor adalah 30 permintaan per jam per akun." }, 429);
  }

  if (!AI_API_KEY) {
    await db.from("ai_mentor_usage").insert({ user_id: user.id, provider: "openai-compatible", model: AI_MODEL, status: "not_configured", error_code: "provider_secret_missing" });
    return json({ error: "provider_not_configured", message: "AI generatif belum dikonfigurasi pada server. Tutorial lokal tetap tersedia." }, 503);
  }

  const systemPrompt = [
    "Anda adalah AI Mentor NARATIVA, mentor produksi kreatif yang sabar dan praktis.",
    "Jawab dalam bahasa Indonesia kecuali pengguna meminta bahasa lain.",
    "Berikan langkah yang bisa dilakukan pemula, checklist singkat, dan satu langkah berikutnya.",
    "Jangan mengklaim bahwa video, audio, gambar, mesh 3D, atau AR sudah dibuat jika hanya memberi arahan.",
    "Jangan meminta atau mengungkap rahasia, token, kata sandi, atau data pribadi.",
    "Konteks proyek adalah metadata singkat, bukan naskah lengkap."
  ].join(" ");
  const userPrompt = [
    "Studio aktif: " + studio,
    title ? "Judul proyek: " + title : "",
    goal ? "Tujuan proyek: " + goal : "",
    style ? "Gaya/spesifikasi: " + style : "",
    "Pertanyaan: " + question
  ].filter(Boolean).join("\n");

  let response: Response;
  try {
    response = await fetch(AI_BASE_URL, {
      method: "POST",
      headers: { "Authorization": "Bearer " + AI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.5,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    await db.from("ai_mentor_usage").insert({ user_id: user.id, provider: "openai-compatible", model: AI_MODEL, status: "failed", error_code: "provider_unreachable" });
    return json({ error: "provider_unreachable", message: "Provider AI tidak dapat dijangkau. Coba lagi nanti." }, 502);
  }

  if (!response.ok) {
    await db.from("ai_mentor_usage").insert({ user_id: user.id, provider: "openai-compatible", model: AI_MODEL, status: "failed", error_code: "provider_http_" + response.status });
    return json({ error: "provider_request_failed", message: "Provider AI menolak permintaan. Periksa konfigurasi server." }, 502);
  }

  let result: Record<string, unknown>;
  try { result = await response.json(); } catch {
    await db.from("ai_mentor_usage").insert({ user_id: user.id, provider: "openai-compatible", model: AI_MODEL, status: "failed", error_code: "provider_invalid_json" });
    return json({ error: "provider_invalid_response" }, 502);
  }
  const choices = Array.isArray(result.choices) ? result.choices as Array<Record<string, unknown>> : [];
  const message = choices[0]?.message as Record<string, unknown> | undefined;
  const answer = clean(message?.content, 12000);
  if (!answer) {
    await db.from("ai_mentor_usage").insert({ user_id: user.id, provider: "openai-compatible", model: AI_MODEL, status: "failed", error_code: "empty_model_response" });
    return json({ error: "empty_model_response" }, 502);
  }
  const usage = result.usage && typeof result.usage === "object" ? result.usage as Record<string, unknown> : {};
  const inputTokens = Math.max(0, Math.floor(Number(usage.prompt_tokens) || 0));
  const outputTokens = Math.max(0, Math.floor(Number(usage.completion_tokens) || 0));
  const { error: auditError } = await db.from("ai_mentor_usage").insert({
    user_id: user.id,
    provider: "openai-compatible",
    model: AI_MODEL,
    status: "success",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
  if (auditError) return json({ error: "usage_audit_failed", message: "Jawaban tidak ditampilkan karena pencatatan penggunaan gagal." }, 503);
  return json({ ok: true, answer, model: AI_MODEL, usage: { inputTokens, outputTokens } });
});
