import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { careerOpsRoot } from "@/lib/career-ops";
import { atomicWriteWithBackup } from "@/lib/core/safe-write";
import { expandTargetRoles } from "@/lib/role-expansion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Merge-safe writer for portals.yml's title_filter (a USER-LAYER file). Replaces
// ONLY title_filter.positive (the role keywords the free scanner matches), seeding
// from templates/portals.example.yml on first create, and PRESERVING tracked_companies
// + every other block. Atomic write, confirm-gated (setProfile/setPortals). This is
// what loads the very first home scan once the user confirms their target roles.

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export async function GET() {
  const root = careerOpsRoot();
  const file = path.join(root, "portals.yml");
  try {
    return Response.json({ ok: true, yaml: fs.readFileSync(file, "utf8") });
  } catch {
    try {
      const fallback = fs.readFileSync(path.join(root, "templates", "portals.example.yml"), "utf8");
      return Response.json({ ok: true, yaml: fallback });
    } catch {
      return Response.json({ ok: false, yaml: "" });
    }
  }
}

export async function POST(req: Request) {
  let body: { roles?: string[]; location?: string[] };
  try {
    body = (await req.json()) as { roles?: string[]; location?: string[] };
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const roles = expandTargetRoles((Array.isArray(body.roles) ? body.roles : []).map((r) => String(r).trim()).filter(Boolean));

  const root = careerOpsRoot();
  const file = path.join(root, "portals.yml");
  let doc: Record<string, unknown> = {};
  try {
    doc = (yaml.load(fs.readFileSync(file, "utf8")) as Record<string, unknown>) || {};
  } catch {
    try {
      doc = (yaml.load(fs.readFileSync(path.join(root, "templates", "portals.example.yml"), "utf8")) as Record<string, unknown>) || {};
    } catch {
      doc = {};
    }
  }

  const tf = isObj(doc.title_filter) ? { ...doc.title_filter } : {};
  tf.positive = roles; // replace ONLY the positive keywords; keep negative/etc.
  doc.title_filter = tf;
  if (Array.isArray(body.location)) {
    const lf = isObj(doc.location_filter) ? { ...doc.location_filter } : {};
    lf.allow = body.location.map((l) => String(l).trim()).filter(Boolean);
    doc.location_filter = lf;
  }

  try {
    atomicWriteWithBackup(file, yaml.dump(doc, { lineWidth: 100, noRefs: true }));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "write failed" }, { status: 500 });
  }
  return Response.json({ ok: true, roles: roles.length });
}

export async function PUT(req: Request) {
  let body: { yaml?: string };
  try {
    body = (await req.json()) as { yaml?: string };
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const raw = typeof body.yaml === "string" ? body.yaml : "";
  if (!raw.trim()) return Response.json({ error: "yaml required" }, { status: 400 });

  try {
    yaml.load(raw);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "invalid yaml" }, { status: 400 });
  }

  const root = careerOpsRoot();
  const file = path.join(root, "portals.yml");
  try {
    atomicWriteWithBackup(file, raw.endsWith("\n") ? raw : `${raw}\n`);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "write failed" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
