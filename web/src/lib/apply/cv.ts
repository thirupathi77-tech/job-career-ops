import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot } from "@/lib/career-ops";
import { readProfileDoc, resolveActiveProfile, isObj } from "@/lib/profile";

/**
 * Locate the tailored CV PDF the real `pdf` mode wrote to output/ for a given
 * company (newest match wins). STRICT company match — never returns a CV tailored
 * for a different company (we'd rather attach nothing than the wrong CV). Mirrors
 * the matching in /api/cv-pdf so the "View tailored CV" link and the apply
 * file-upload always resolve to the SAME file. Returns an absolute path or null.
 */
export function resolveTailoredCv(company?: string): string | null {
  const c = (company ?? "").trim();
  if (!c) return null;
  const dir = path.join(careerOpsRoot(), "output");
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  } catch {
    return null;
  }
  // Token-extract instead of replace-then-trim: same slug, and no `-+$`-style
  // pattern that backtracks polynomially on adversarial input (CodeQL).
  const slug = (c.toLowerCase().match(/[a-z0-9]+/g) ?? []).join("-");
  const first = slug.split("-")[0];
  const matches = files.filter((f) => {
    const l = f.toLowerCase();
    return l.includes(slug) || (first.length > 2 && l.includes(first));
  });
  if (!matches.length) return null;
  matches.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs);
  return path.join(dir, matches[0]);
}

function resolveProfileResumePath(profilePath: string): string | null {
  const p = profilePath.trim();
  if (!p) return null;
  const abs = path.isAbsolute(p) ? p : path.join(careerOpsRoot(), p);
  try {
    return fs.existsSync(abs) ? abs : null;
  } catch {
    return null;
  }
}

function matchVariant(variants: unknown, title?: string): string | null {
  if (!Array.isArray(variants)) return null;
  const t = (title ?? "").toLowerCase();
  for (const item of variants) {
    if (!isObj(item)) continue;
    const match = typeof item.match === "string" ? item.match.trim().toLowerCase() : "";
    const file = typeof item.file === "string" ? item.file.trim() : "";
    if (match && file && t.includes(match.toLowerCase())) return file;
  }
  return null;
}

export function resolveProfileSelectedCv(title?: string, company?: string): string | null {
  const profile = resolveActiveProfile(readProfileDoc("config/profile.yml"));
  const root = profile.data;
  const resumes = isObj(root.resumes) ? root.resumes : {};
  const variant = matchVariant(resumes.variants, title ?? company);
  const chosen = variant || (typeof resumes.default === "string" ? resumes.default.trim() : "");
  const fromProfile = resolveProfileResumePath(chosen);
  if (fromProfile) return fromProfile;
  return resolveTailoredCv(company);
}

/**
 * Best-effort company name from an application form/page title. ATS titles look
 * like "Role - Region @ Company" (Ashby) or "Company — Role" / "Role at Company".
 * Used as a fallback when the apply flow was started by pasting a URL (no offer
 * context) rather than from a report's Apply button.
 */
export function companyFromTitle(title?: string): string {
  const t = (title ?? "").trim();
  if (!t) return "";
  const at = t.match(/@\s*([^|@]+?)\s*$/);
  if (at) return at[1].trim();
  const atWord = t.match(/\bat\s+([A-Z][\w&.\- ]+?)\s*$/);
  if (atWord) return atWord[1].trim();
  return "";
}
