import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rootScript } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const execFileAsync = promisify(execFile);

type Payload = {
  url?: string;
};

export async function POST(req: Request) {
  let body: Payload = {};
  try {
    body = (await req.json()) as Payload;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return Response.json({ error: "A valid posting URL (https://...) is required" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execFileAsync("node", [rootScript("browser-extract"), url, "--mode", "jd"], {
      maxBuffer: 2_000_000,
    });
    const parsed = JSON.parse(stdout || "{}");
    return Response.json({ ok: true, jd: parsed, stderr: stderr ? String(stderr).trim() : "" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "could not extract posting";
    return Response.json({ ok: false, error: msg.slice(0, 240) }, { status: 500 });
  }
}
