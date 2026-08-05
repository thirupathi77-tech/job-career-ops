import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot, rootScript } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Orchestrates the core's verify-portals.mjs (#1016) — the SAME ATS-slug
// validator the CLI uses. Catches the silent 404s that quietly drop a company
// from every future scan (= lost offers). We parse its console output; we do NOT
// reimplement the validation.
const STATUS: Record<string, "live" | "empty" | "broken" | "skipped"> = {
  "✅": "live",
  "🟡": "empty",
  "❌": "broken",
  "➖": "skipped",
};

export async function GET() {
  const root = careerOpsRoot();
  const verifyPortals = rootScript("verify-portals");
  if (!fs.existsSync(verifyPortals)) {
    return Response.json({ available: false, configured: false, companies: [] });
  }
  if (!fs.existsSync(path.join(root, "portals.yml"))) {
    return Response.json({ available: true, configured: false, companies: [] });
  }

  const result = await new Promise<{ output: string; error: string | null }>((resolve) => {
    execFile(
      "node",
      [verifyPortals],
      { cwd: root, timeout: 110_000, maxBuffer: 4 * 1024 * 1024 },
      (error, out, err) => resolve({ output: (out || "") + (err || ""), error: error ? (err || error.message || "Portal verification failed.").trim() : null }),
    );
  });

  if (result.error) {
    return Response.json({ available: true, configured: true, companies: [], error: result.error }, { status: 502 });
  }

  const companies: { name: string; status: string; detail: string }[] = [];
  for (const line of result.output.split("\n")) {
    const m = line.match(/^\s*(✅|🟡|❌|➖)\s+(.+?)\s+—\s+(.*)$/);
    if (m) companies.push({ name: m[2].trim(), status: STATUS[m[1]] ?? "unknown", detail: m[3].trim() });
  }
  return Response.json({ available: true, configured: true, companies });
}
