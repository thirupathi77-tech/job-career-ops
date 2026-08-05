import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { careerOpsRoot } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Localhost logo proxy + on-disk cache, FOREVER per key. To stay offline-safe we
// do not reach out to third-party favicon services. Instead, each company gets a
// deterministic generated monogram on first request, then that PNG is cached.

const DOMAIN_RE = /^[a-z0-9.-]{1,253}\.[a-z]{2,}$/i;

function cacheDir(): string {
  return path.join(careerOpsRoot(), ".career-ops-web", "logo-cache");
}

function initials(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9]+/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function colorFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 72% 46%)`;
}

function svgMonogram(label: string, key: string): Buffer {
  const bg = colorFor(key);
  const fg = "#ffffff";
  const text = initials(label);
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${safe}">
    <rect width="64" height="64" rx="16" fill="${bg}"/>
    <text x="32" y="39" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${fg}">${safe}</text>
  </svg>`;
  return Buffer.from(svg);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const domain = (sp.get("domain") ?? "").trim().toLowerCase();
  const company = (sp.get("company") ?? "").trim();

  let key: string;
  let label: string;
  if (domain) {
    if (!DOMAIN_RE.test(domain) || domain.includes("..")) return new Response("bad domain", { status: 400 });
    key = domain.replace(/[^a-z0-9.-]/g, "_");
    label = domain;
  } else if (company) {
    const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (!slug) return new Response("bad company", { status: 400 });
    key = `co_${slug}`;
    label = company;
  } else {
    return new Response("need domain or company", { status: 400 });
  }

  // `key` is already sanitized above, but enforce containment anyway: a cache
  // path must never resolve outside the cache dir (defense in depth).
  const file = path.resolve(cacheDir(), `${key}.svg`);
  if (!file.startsWith(path.resolve(cacheDir()) + path.sep)) return new Response("bad key", { status: 400 });

  // 1) serve from disk cache forever (hit, or empty sentinel = known miss)
  try {
    const buf = await fs.readFile(file);
    if (buf.byteLength > 0) {
      return new Response(new Uint8Array(buf), { status: 200, headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=604800" } });
    }
    return new Response("no logo", { status: 404 });
  } catch {
    /* not cached yet → resolve below */
  }

  // 2) generate once: deterministic monogram, then cache forever
  const bytes = svgMonogram(label, key);

  try {
    await fs.mkdir(cacheDir(), { recursive: true });
    await fs.writeFile(file, bytes);
  } catch {
    /* best-effort */
  }

  return new Response(new Uint8Array(bytes), { status: 200, headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=604800" } });
}
