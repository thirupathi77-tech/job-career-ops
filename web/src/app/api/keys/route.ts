import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasEnvKey(key: string): boolean {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

export async function GET() {
  const root = careerOpsRoot();
  const envLocal = path.join(root, "web", ".env.local");
  const rootEnvLocal = path.join(root, ".env.local");
  return Response.json({
    ok: true,
    openai: hasEnvKey("OPENAI_API_KEY"),
    anthropic: hasEnvKey("ANTHROPIC_API_KEY"),
    fallbackCli: hasEnvKey("OPENAI_API_KEY") || hasEnvKey("ANTHROPIC_API_KEY") ? "server-key" : "cli",
    envLocalExists: fs.existsSync(envLocal) || fs.existsSync(rootEnvLocal),
  });
}
