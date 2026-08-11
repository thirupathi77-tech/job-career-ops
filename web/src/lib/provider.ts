export type ProviderId = "default" | "anthropic" | "openai" | "google" | "kimi" | "openrouter";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  default: "Auto fallback",
  anthropic: "Claude / Anthropic",
  openai: "OpenAI",
  google: "Gemini / Google",
  kimi: "Kimi / Qwen",
  openrouter: "OpenRouter",
};

export const PROVIDER_TO_CLI: Record<ProviderId, string> = {
  default: "",
  anthropic: "claude",
  openai: "codex",
  google: "gemini",
  kimi: "qwen",
  openrouter: "opencode",
};

export function cliIdFromProvider(provider: string | null | undefined): string {
  const key = (provider ?? "").toLowerCase() as ProviderId;
  return PROVIDER_TO_CLI[key] ?? "";
}

function resolveFallbackCliId(installedCliIds: string[]): string {
  const preference = ["claude", "codex", "gemini", "qwen", "opencode", "copilot", "antigravity"];
  for (const preferred of preference) {
    if (installedCliIds.includes(preferred)) return preferred;
  }
  return installedCliIds[0] || "";
}

export function resolveProviderCliId(provider: string | null | undefined, installedCliIds: string[] = []): string {
  const direct = cliIdFromProvider(provider);
  if (direct && installedCliIds.includes(direct)) return direct;
  if ((provider ?? "").toLowerCase() === "default") return resolveFallbackCliId(installedCliIds);
  return resolveFallbackCliId(installedCliIds);
}
