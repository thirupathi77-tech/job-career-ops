export type ServerModelProvider = "openai" | "anthropic";

export function serverProviderForCli(cliId?: string | null): ServerModelProvider | null {
  const id = (cliId ?? "").toLowerCase();
  if (id === "claude") return "anthropic";
  if (id === "codex") return "openai";
  return null;
}

function apiKeyFor(provider: ServerModelProvider): string {
  return provider === "anthropic" ? (process.env.ANTHROPIC_API_KEY || "").trim() : (process.env.OPENAI_API_KEY || "").trim();
}

async function runOpenAI(prompt: string, system?: string): Promise<string | null> {
  const key = apiKeyFor("openai");
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: system ? [{ role: "system", content: [{ type: "input_text", text: system }] }, { role: "user", content: [{ type: "input_text", text: prompt }] }] : prompt,
      temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as any;
  const out = data?.output ?? [];
  const texts = out.flatMap((item: any) => item?.content ?? []).map((c: any) => c?.text).filter((t: any) => typeof t === "string");
  return texts.join("\n").trim() || null;
}

async function runAnthropic(prompt: string, system?: string): Promise<string | null> {
  const key = apiKeyFor("anthropic");
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      system,
      max_tokens: 4096,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as any;
  const content = Array.isArray(data?.content) ? data.content : [];
  return content.map((c: any) => c?.text).filter((t: any) => typeof t === "string").join("\n").trim() || null;
}

export async function runServerPrompt(cliId: string | undefined, prompt: string, system?: string): Promise<string | null> {
  const provider = serverProviderForCli(cliId);
  if (!provider) return null;
  if (provider === "openai") return await runOpenAI(prompt, system);
  return await runAnthropic(prompt, system);
}
