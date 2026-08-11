import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { spawn } from "node:child_process";
import { careerOpsRoot } from "@/lib/career-ops";
import { atomicWriteWithBackup } from "@/lib/core/safe-write";
import { expandTargetRoles } from "@/lib/role-expansion";
import { isObj, resolveActiveProfile, upsertProfile } from "@/lib/profile";
import { resolveCli } from "@/lib/clis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Merge-safe writer for config/profile.yml (a USER-LAYER file — DATA_CONTRACT:
// never clobber the user's archetypes/narrative/proof-points). On first create we
// seed from config/profile.example.yml; on an existing file we deep-merge ONLY the
// proposed keys, write atomically (temp + rename), and only ever via the confirm-
// gated setProfile action. The web orchestrates the real file — no parallel store.

type ProfilePatch = {
  profileName?: string;
  activateOnly?: boolean;
  name?: string;
  email?: string;
  location?: string;
  roles?: string[];
  compMin?: number;
  compMax?: number;
  currency?: string;
  remote?: string;
  country?: string;
  city?: string;
  timezone?: string;
  visaStatus?: string;
  authorizedIn?: string[];
  needsSponsorship?: boolean;
  outputLanguage?: string;
  modesDir?: string;
  defaultResume?: string;
  roleResumes?: string;
};

/** Deep-merge src onto dst (objects recurse; arrays/scalars replace). Non-mutating. */
function deepMerge(dst: unknown, src: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = isObj(dst) ? { ...dst } : {};
  for (const [k, v] of Object.entries(src)) {
    out[k] = isObj(v) ? deepMerge(out[k], v) : v;
  }
  return out;
}

function patchToProfile(p: ProfilePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const candidate: Record<string, unknown> = {};
  if (p.name) candidate.full_name = p.name;
  if (p.email) candidate.email = p.email;
  if (p.location) candidate.location = p.location;
  if (Object.keys(candidate).length) out.candidate = candidate;
  if (p.roles?.length) out.target_roles = { primary: expandTargetRoles(p.roles).slice(0, 6) };
  const comp: Record<string, unknown> = {};
  if (p.compMin && p.compMax) comp.target_range = `${p.compMin}-${p.compMax}`;
  if (p.currency) comp.currency = p.currency;
  if (p.remote) comp.location_flexibility = p.remote;
  if (Object.keys(comp).length) out.compensation = comp;
  const loc: Record<string, unknown> = {};
  if (p.country) loc.country = p.country;
  if (p.city) loc.city = p.city;
  if (p.timezone) loc.timezone = p.timezone;
  if (p.visaStatus) loc.visa_status = p.visaStatus;
  if (p.authorizedIn?.length) loc.authorized_in = p.authorizedIn;
  if (typeof p.needsSponsorship === "boolean") loc.needs_sponsorship = p.needsSponsorship;
  if (Object.keys(loc).length) out.location = loc;
  const lang: Record<string, unknown> = {};
  if (p.outputLanguage) lang.output = p.outputLanguage;
  if (p.modesDir) lang.modes_dir = p.modesDir;
  if (Object.keys(lang).length) out.language = lang;
  const resume: Record<string, unknown> = {};
  if (p.defaultResume) resume.default = p.defaultResume;
  if (p.roleResumes) {
    const variants = p.roleResumes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [match = "", file = ""] = line.split("|").map((s) => s.trim());
        return match && file ? { match, file } : null;
      })
      .filter((v): v is { match: string; file: string } => !!v);
    if (variants.length) resume.variants = variants;
  }
  if (Object.keys(resume).length) out.resumes = resume;
  // seniority intentionally not written (no canonical home in profile.yml);
  // archetypes/narrative live in modes/_profile.md — this writer never touches them.
  return out;
}

function listProfiles(base: Record<string, unknown>): { name: string; active: boolean }[] {
  const profiles = isObj(base.profiles) ? base.profiles : {};
  const names = new Set<string>(["default"]);
  for (const key of Object.keys(profiles)) names.add(key);
  const active = typeof base.active_profile === "string" && base.active_profile.trim() ? base.active_profile.trim() : "default";
  return Array.from(names).sort((a, b) => a.localeCompare(b)).map((name) => ({ name, active: name === active }));
}

export async function GET() {
  const root = careerOpsRoot();
  const file = path.join(root, "config", "profile.yml");
  if (!fs.existsSync(file)) {
    return Response.json({ ok: true, activeProfile: "default", profiles: [{ name: "default", active: true }] });
  }
  let parsed: unknown;
  try {
    parsed = yaml.load(fs.readFileSync(file, "utf8"));
  } catch {
    return Response.json({ error: "config/profile.yml exists but is not valid YAML." }, { status: 409 });
  }
  const base = isObj(parsed) ? (parsed as Record<string, unknown>) : {};
  const active = resolveActiveProfile(base);
  return Response.json({
    ok: true,
    activeProfile: active.name,
    profiles: listProfiles(base),
    activeProfileData: active.data,
  });
}

export async function POST(req: Request) {
  let patch: ProfilePatch;
  try {
    patch = (await req.json()) as ProfilePatch;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const proposed = patchToProfile(patch);
  if (Object.keys(proposed).length === 0) return Response.json({ error: "nothing to write" }, { status: 400 });

  const root = careerOpsRoot();
  const file = path.join(root, "config", "profile.yml");
  let base: Record<string, unknown> = {};
  let seeded = false;
  // DATA-LOSS GUARD (maintainer, bug-class #649/#704/#920/#958): distinguish
  // "no profile yet" (safe to seed from the example) from "profile EXISTS but is
  // malformed" (NEVER overwrite — that would silently destroy the user's data).
  if (!fs.existsSync(file)) {
    try {
      base = (yaml.load(fs.readFileSync(path.join(root, "config", "profile.example.yml"), "utf8")) as Record<string, unknown>) || {};
      seeded = Object.keys(base).length > 0;
    } catch {
      base = {};
    }
  } else {
    let parsed: unknown;
    try {
      parsed = yaml.load(fs.readFileSync(file, "utf8"));
    } catch {
      return Response.json({ error: "config/profile.yml exists but is not valid YAML — refusing to overwrite it." }, { status: 409 });
    }
    base = isObj(parsed) ? (parsed as Record<string, unknown>) : {};
  }

  const profileName = typeof patch.profileName === "string" && patch.profileName.trim() ? patch.profileName.trim() : "default";
  const activateOnly = patch.activateOnly === true;
  let merged = profileName === "default"
    ? deepMerge(base, activateOnly ? {} : proposed)
    : upsertProfile(base, profileName, activateOnly ? {} : proposed);
  if (profileName !== "default" || activateOnly) {
    // Keep the current flat-profile view in sync with the active profile so older
    // readers continue to work, while preserving the named profiles map.
    const active = resolveActiveProfile(merged as Record<string, unknown>);
    const flat = deepMerge(merged, active.data);
    (flat as Record<string, unknown>).active_profile = profileName;
    merged = flat;
  }
  try {
    // Back up the prior profile before the first normalized write (yaml.dump
    // reformats — comments are not preserved; the .bak is the safety net).
    atomicWriteWithBackup(file, yaml.dump(merged, { lineWidth: 100, noRefs: true }));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "write failed" }, { status: 500 });
  }
  const activeAfter = resolveActiveProfile(merged as Record<string, unknown>);
  return Response.json({ ok: true, seeded, activeProfile: activeAfter.name, activeProfileData: activeAfter.data });
}

export async function PUT(req: Request) {
  let body: { profileName?: string; roleTitle?: string; cliId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const profileName = typeof body.profileName === "string" && body.profileName.trim() ? body.profileName.trim() : "default";
  const roleTitle = typeof body.roleTitle === "string" && body.roleTitle.trim() ? body.roleTitle.trim() : "";
  const cliId = typeof body.cliId === "string" && body.cliId.trim() ? body.cliId.trim() : "";
  if (!roleTitle) return Response.json({ error: "roleTitle required" }, { status: 400 });
  const resolved = resolveCli(cliId || "claude");
  if (!resolved) return Response.json({ error: "No supported CLI found to generate the variant." }, { status: 404 });

  const root = careerOpsRoot();
  const cvFile = path.join(root, "cv.md");
  if (!fs.existsSync(cvFile)) return Response.json({ error: "cv.md missing" }, { status: 400 });
  const profilePath = path.join(root, "config", "profile.yml");
  let doc: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(fs.readFileSync(profilePath, "utf8"));
    doc = isObj(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    doc = {};
  }
  const resolvedProfile = resolveActiveProfile(doc);
  const activeDoc = resolvedProfile.data;
  const candidateName = typeof activeDoc.candidate === "object" && activeDoc.candidate && !Array.isArray(activeDoc.candidate)
    ? String((activeDoc.candidate as Record<string, unknown>).full_name ?? "candidate")
    : "candidate";
  const outDir = path.join(root, "output", "resume-variants");
  fs.mkdirSync(outDir, { recursive: true });
  const slug = `${profileName}-${roleTitle}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const variantPath = path.join(outDir, `${slug}.md`);
  const prompt = `Create a role-specific ATS-friendly resume variant for the role "${roleTitle}" using the user's real cv.md and active profile. Follow the same truthful, keyword-aligned style as career-ops job matching: keep only real facts, rewrite bullets toward the role, and optimize for ATS keyword coverage. Output ONLY markdown. The profile name is ${profileName}. The candidate is ${candidateName}.`;
  const child = spawn(resolved.binPath, resolved.spec.id === "claude" ? ["-p", `${prompt}\n\nRead this file: ${cvFile}`, "--output-format", "text", "--permission-mode", "acceptEdits", "--allowedTools", "Read,Glob,Grep", "--disallowedTools", "Write,Edit,Bash,NotebookEdit,Task"] : resolved.spec.args(prompt), { cwd: root, env: process.env });
  let out = "";
  let err = "";
  child.stdout.on("data", (d) => (out += d.toString()));
  child.stderr.on("data", (d) => (err += d.toString()));
  const code = await new Promise<number>((resolve) => child.on("close", resolve));
  if (code !== 0 && !out.trim()) return Response.json({ error: err.trim() || "resume generation failed" }, { status: 500 });
  const md = out.trim() || `# ${candidateName}\n\n## Role Focus\n${roleTitle}\n`;
  fs.writeFileSync(variantPath, md, "utf8");

  let base: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(fs.readFileSync(profilePath, "utf8"));
    base = isObj(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    base = {};
  }
  const profiles = isObj(base.profiles) ? { ...base.profiles } : {};
  const current = isObj(profiles[profileName]) ? { ...profiles[profileName] } : {};
  const resumes = isObj(current.resumes) ? { ...current.resumes } : {};
  resumes.default = resumes.default && typeof resumes.default === "string" ? resumes.default : "cv.md";
  const variants = Array.isArray(resumes.variants) ? [...resumes.variants] : [];
  const variantIndex = variants.findIndex((v) => isObj(v) && typeof v.match === "string" && v.match.toLowerCase() === roleTitle.toLowerCase());
  const rel = path.relative(root, variantPath).replace(/\\/g, "/");
  const nextVariant = { match: roleTitle, file: rel };
  if (variantIndex >= 0) variants[variantIndex] = nextVariant;
  else variants.push(nextVariant);
  current.resumes = { ...resumes, variants };
  profiles[profileName] = current;
  const nextDoc = { ...base, active_profile: profileName, profiles };
  atomicWriteWithBackup(profilePath, yaml.dump(nextDoc, { lineWidth: 100, noRefs: true }));
  return Response.json({ ok: true, file: rel, roleTitle, profileName });
}
