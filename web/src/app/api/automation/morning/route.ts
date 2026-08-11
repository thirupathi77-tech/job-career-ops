import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { careerOpsRoot } from "@/lib/career-ops";
import { atomicWriteWithBackup } from "@/lib/core/safe-write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const execFileAsync = promisify(execFile);

function parseTime(value: unknown): { hour: number; minute: number } | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return { hour: Number.parseInt(match[1], 10), minute: Number.parseInt(match[2], 10) };
}

function parseWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "number" ? v : Number.NaN))
    .filter((v) => Number.isInteger(v) && v >= 1 && v <= 7);
}

function buildStartCalendarInterval(mode: string, hour: number, minute: number, weekdays: number[]): string {
  const entries: string[] = [];
  if (mode === "weekly" || mode === "twice_weekly" || mode === "thrice_weekly" || mode === "custom_weekdays") {
    const days = weekdays.length ? weekdays : [1];
    for (const day of days) {
      entries.push(`  <dict>
    <key>Weekday</key>
    <integer>${day}</integer>
    <key>Hour</key>
    <integer>${hour}</integer>
    <key>Minute</key>
    <integer>${minute}</integer>
  </dict>`);
    }
    return `<array>
${entries.join("\n")}
</array>`;
  }
  return `<dict>
    <key>Hour</key>
    <integer>${hour}</integer>
    <key>Minute</key>
    <integer>${minute}</integer>
  </dict>`;
}

function buildPlist(root: string, spec: { hour: number; minute: number; scheduleType: string; everyDays: number; weekdays: number[] }) {
  const plistPath = path.join(root, "automation", "io.career-ops.daily-refresh.plist");
  const logPath = path.join(root, "data", "daily-refresh.log");
  const useInterval = spec.scheduleType === "every_n_days";
  const intervalSeconds = Math.max(1, spec.everyDays) * 24 * 60 * 60;
  const calendar = buildStartCalendarInterval(spec.scheduleType, spec.hour, spec.minute, spec.weekdays);
  return {
    plistPath,
    content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.career-ops.daily-refresh</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${path.join(root, "automation", "daily-morning.sh")}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>CAREER_OPS_ROOT</key>
    <string>${root}</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${root}</string>
  ${useInterval ? `<key>StartInterval</key>
  <integer>${intervalSeconds}</integer>` : `<key>StartCalendarInterval</key>
  ${calendar}`}
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${logPath}</string>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
`,
  };
}

export async function GET() {
  const root = careerOpsRoot();
  const plistPath = path.join(root, "automation", "io.career-ops.daily-refresh.plist");
  const raw = fs.existsSync(plistPath) ? fs.readFileSync(plistPath, "utf8") : "";
  const hour = raw.match(/<key>Hour<\/key>\s*<integer>(\d+)<\/integer>/)?.[1] ?? "7";
  const minute = raw.match(/<key>Minute<\/key>\s*<integer>(\d+)<\/integer>/)?.[1] ?? "0";
  const interval = raw.match(/<key>StartInterval<\/key>\s*<integer>(\d+)<\/integer>/)?.[1];
  let loaded = false;
  let loadedLabel: string | null = null;
  try {
    const { stdout } = await execFileAsync("launchctl", ["list"], { timeout: 4_000 });
    const line = stdout.split(/\r?\n/).find((l) => /\bio\.career-ops\.daily-refresh\b/.test(l));
    if (line) {
      loaded = true;
      loadedLabel = line.trim();
    }
  } catch {
    // launchctl unavailable or unsupported in this environment; fall back to saved-only status.
  }
  return Response.json({
    ok: true,
    time: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
    scheduleType: interval ? "every_n_days" : "daily",
    loaded,
    loadedLabel,
    plistPath,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    time?: unknown;
    scheduleType?: unknown;
    everyDays?: unknown;
    weekdays?: unknown;
  } | null;
  const parsed = parseTime(body?.time);
  if (!parsed) {
    return Response.json({ error: "Provide a valid time in HH:MM format." }, { status: 400 });
  }
  const scheduleType = typeof body?.scheduleType === "string" ? body.scheduleType : "daily";
  const everyDays = typeof body?.everyDays === "number" && Number.isFinite(body.everyDays) ? Math.max(1, Math.floor(body.everyDays)) : 2;
  const weekdays = parseWeekdays(body?.weekdays);
  const root = careerOpsRoot();
  const { plistPath, content } = buildPlist(root, { hour: parsed.hour, minute: parsed.minute, scheduleType, everyDays, weekdays });
  atomicWriteWithBackup(plistPath, content);
  return Response.json({
    ok: true,
    time: `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`,
    scheduleType,
    everyDays,
    weekdays,
  });
}
