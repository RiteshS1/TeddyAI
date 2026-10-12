export type ProviderId = "groq" | "gemini" | "anthropic";

export interface LlmResult {
  text: string;
  provider: ProviderId;
  model: string;
  /** True only when the visitor's own key produced this answer. */
  viaByo?: boolean;
}

export interface ByoKey {
  provider: ProviderId;
  key: string;
}

const TIMEOUT_MS = 45_000;

async function post(url: string, init: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function groq(system: string, user: string, key: string): Promise<LlmResult> {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const j = await post("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      // gpt-oss spends tokens on reasoning before it writes, so leave generous room.
      max_tokens: 8000,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  return { text: j.choices?.[0]?.message?.content ?? "", provider: "groq", model };
}

async function gemini(system: string, user: string, key: string): Promise<LlmResult> {
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const j = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" },
      }),
    },
  );
  const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  return { text, provider: "gemini", model };
}

async function anthropic(system: string, user: string, key: string): Promise<LlmResult> {
  const model = "claude-sonnet-5-5";
  const j = await post("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const text = (j.content ?? []).map((b: { text?: string }) => b.text ?? "").join("");
  return { text, provider: "anthropic", model };
}

const IMPL = { groq, gemini, anthropic } as const;

/**
 * Order: user's own key (if given) -> Groq -> Gemini. Keys come from server env, never the client.
 * Returns the first successful result, plus a list of what failed (for the UI note).
 */
export async function complete(
  system: string,
  user: string,
  byo?: ByoKey,
): Promise<{ result?: LlmResult; errors: string[] }> {
  const chain: { id: ProviderId; key: string; byo?: boolean }[] = [];
  if (byo?.key && byo.provider in IMPL) chain.push({ id: byo.provider, key: byo.key, byo: true });
  if (process.env.GROQ_API_KEY) chain.push({ id: "groq", key: process.env.GROQ_API_KEY });
  if (process.env.GEMINI_API_KEY) chain.push({ id: "gemini", key: process.env.GEMINI_API_KEY });

  const errors: string[] = [];
  if (chain.length === 0) errors.push("no provider keys configured");
  for (const p of chain) {
    try {
      const r = await IMPL[p.id](system, user, p.key);
      if (r.text.trim()) return { result: { ...r, viaByo: Boolean(p.byo) }, errors };
      errors.push(`${p.id}: empty response`);
    } catch (e) {
      const msg = (e as Error).message.replace(/org_[a-z0-9]+/gi, "org").replace(/\s+/g, " ").slice(0, 110);
      errors.push(`${p.byo ? "your " : ""}${p.id}: ${msg}`);
    }
  }
  return { errors };
}
