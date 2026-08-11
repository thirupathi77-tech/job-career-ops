import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { careerOpsRoot } from "@/lib/career-ops";

export type ProfileDoc = Record<string, unknown> & {
  active_profile?: string;
  profiles?: Record<string, unknown>;
};

export function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function readProfileDoc(rel = "config/profile.yml"): ProfileDoc | null {
  try {
    const parsed = yaml.load(fs.readFileSync(path.join(careerOpsRoot(), rel), "utf8"));
    return isObj(parsed) ? (parsed as ProfileDoc) : null;
  } catch {
    return null;
  }
}

export function resolveActiveProfile(doc: ProfileDoc | null | undefined): { name: string; data: Record<string, unknown> } {
  const base = isObj(doc) ? { ...doc } : {};
  const profiles = isObj(base.profiles) ? base.profiles : {};
  const activeName = typeof base.active_profile === "string" && base.active_profile.trim() ? base.active_profile.trim() : "default";
  const activeData = isObj(profiles[activeName]) ? profiles[activeName] : {};
  const root = { ...base };
  delete root.profiles;
  delete root.active_profile;
  return { name: activeName, data: { ...root, ...activeData } };
}

export function upsertProfile(doc: ProfileDoc | null | undefined, name: string, patch: Record<string, unknown>): ProfileDoc {
  const base = isObj(doc) ? { ...doc } : {};
  const profiles = isObj(base.profiles) ? { ...base.profiles } : {};
  const current = isObj(profiles[name]) ? { ...profiles[name] } : {};
  profiles[name] = { ...current, ...patch };
  return { ...base, active_profile: name, profiles };
}

export function profileString(doc: Record<string, unknown>, key: string): string {
  return typeof doc[key] === "string" && doc[key].trim() ? doc[key].trim() : "";
}

export function profileBool(doc: Record<string, unknown>, key: string): boolean | undefined {
  return typeof doc[key] === "boolean" ? doc[key] : undefined;
}

export function profileStringList(doc: Record<string, unknown>, key: string): string[] {
  return Array.isArray(doc[key]) ? doc[key].filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim()) : [];
}
