"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, KeyRound, TerminalSquare, Terminal, Loader2, CircleDashed, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { CadenceSettings } from "@/components/followups/cadence-settings";
import { Badge } from "@/components/ui/badge";
import { cliIdFromProvider, PROVIDER_LABELS, resolveProviderCliId, type ProviderId } from "@/lib/provider";

type Cli = {
  id: string;
  name: string;
  run: string;
  url: string;
  installed: boolean;
  path: string | null;
};

type ProfileSummary = {
  name: string;
  active: boolean;
};

type Mode = "cli" | "key" | "manual";
type ProfileTab = "basics" | "matching" | "prefills" | "language";
type ScheduleType = "daily" | "weekly" | "twice_weekly" | "thrice_weekly" | "every_n_days" | "custom_weekdays";

const PROVIDERS: ProviderId[] = ["default", "anthropic", "openai", "google", "kimi", "openrouter"];
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "SGD", "CHF"];
const REMOTE_OPTIONS = ["Remote preferred", "Hybrid", "On-site", "Open to all"];
const OUTPUT_LANGUAGE_OPTIONS = ["en", "de", "fr", "es", "pt", "ar", "ja", "hi"];
const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
];
const ROLE_SUGGESTIONS = [
  "Data Engineer",
  "Senior Data Engineer",
  "Staff Data Engineer",
  "Analytics Engineer",
  "ETL Developer",
  "Data Platform Engineer",
  "AI Engineer",
  "Senior AI Engineer",
  "ML Engineer",
  "Senior ML Engineer",
  "Platform Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Solutions Architect",
  "Research Engineer",
];
const WEEKDAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" },
];

const STORAGE_KEY = "career-ops:config";

export function ConfigForm() {
  const [mode, setMode] = useState<Mode>("cli");
  const [clis, setClis] = useState<Cli[] | null>(null);
  const [cliId, setCliId] = useState<string>("");
  const [provider, setProvider] = useState<ProviderId>("default");
  const [logos, setLogos] = useState(true);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([{ name: "default", active: true }]);
  const [activeProfile, setActiveProfile] = useState("default");
  const [profileName, setProfileName] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [workStyle, setWorkStyle] = useState("");
  const [relocation, setRelocation] = useState("");
  const [jobSearchLocation, setJobSearchLocation] = useState("");
  const [roles, setRoles] = useState("");
  const [compMin, setCompMin] = useState("");
  const [compMax, setCompMax] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [remote, setRemote] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [authorizedIn, setAuthorizedIn] = useState("");
  const [needsSponsorship, setNeedsSponsorship] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState("en");
  const [modesDir, setModesDir] = useState("");
  const [defaultResume, setDefaultResume] = useState("");
  const [roleResumes, setRoleResumes] = useState("");
  const [variantRoleTitle, setVariantRoleTitle] = useState("");
  const [variantStatus, setVariantStatus] = useState("");
  const [portalsYaml, setPortalsYaml] = useState("");
  const [portalsBusy, setPortalsBusy] = useState(false);
  const [portalsStatus, setPortalsStatus] = useState("");
  const [keyStatus, setKeyStatus] = useState<{ openai: boolean; anthropic: boolean; fallbackCli: string; envLocalExists: boolean } | null>(null);
  const [morningTime, setMorningTime] = useState("07:00");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
  const [everyDays, setEveryDays] = useState("2");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 5]);
  const [morningStatus, setMorningStatus] = useState("");
  const [morningBusy, setMorningBusy] = useState(false);
  const [morningPlistPath, setMorningPlistPath] = useState("");
  const [profileTab, setProfileTab] = useState<ProfileTab>("basics");
  const [roleQuery, setRoleQuery] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function syncProfileForm(data: unknown) {
    const obj = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
    const candidate = obj.candidate && typeof obj.candidate === "object" && !Array.isArray(obj.candidate) ? (obj.candidate as Record<string, unknown>) : {};
    const targetRoles = obj.target_roles && typeof obj.target_roles === "object" && !Array.isArray(obj.target_roles)
      ? (obj.target_roles as Record<string, unknown>)
      : {};
    const compensation = obj.compensation && typeof obj.compensation === "object" && !Array.isArray(obj.compensation)
      ? (obj.compensation as Record<string, unknown>)
      : {};
    setFullName(typeof candidate.full_name === "string" ? candidate.full_name : "");
    setPreferredName(typeof candidate.preferred_name === "string" ? candidate.preferred_name : "");
    setPronouns(typeof candidate.pronouns === "string" ? candidate.pronouns : "");
    setEmail(typeof candidate.email === "string" ? candidate.email : "");
    setPhone(typeof candidate.phone === "string" ? candidate.phone : "");
    setLinkedin(typeof candidate.linkedin === "string" ? candidate.linkedin : "");
    setGithub(typeof candidate.github === "string" ? candidate.github : "");
    setPortfolio(typeof candidate.portfolio === "string" ? candidate.portfolio : "");
    setLocation(typeof candidate.location === "string" ? candidate.location : "");
    setAddress(typeof candidate.address === "string" ? candidate.address : "");
    setStreetAddress(typeof candidate.street_address === "string" ? candidate.street_address : "");
    setAddressLine2(typeof candidate.address_line2 === "string" ? candidate.address_line2 : "");
    setZipCode(typeof candidate.postal_code === "string" ? candidate.postal_code : "");
    setCurrentCompany(typeof candidate.current_company === "string" ? candidate.current_company : "");
    setCurrentTitle(typeof candidate.current_title === "string" ? candidate.current_title : "");
    setWorkStyle(typeof obj.work_style === "string" ? obj.work_style : "");
    setRoles(Array.isArray(targetRoles.primary) ? targetRoles.primary.filter((v): v is string => typeof v === "string").join("\n") : "");
    const range = typeof compensation.target_range === "string" ? compensation.target_range : "";
    const [min = "", max = ""] = range.split("-").map((v) => v.trim());
    setCompMin(min);
    setCompMax(max);
    setCurrency(typeof compensation.currency === "string" ? compensation.currency : "USD");
    setRemote(typeof compensation.location_flexibility === "string" ? compensation.location_flexibility : "");
    const loc = obj.location && typeof obj.location === "object" && !Array.isArray(obj.location) ? (obj.location as Record<string, unknown>) : {};
    setCountry(typeof loc.country === "string" ? loc.country : "");
    setCity(typeof loc.city === "string" ? loc.city : "");
    setTimezone(typeof loc.timezone === "string" ? loc.timezone : "");
    setVisaStatus(typeof loc.visa_status === "string" ? loc.visa_status : "");
    setAuthorizedIn(Array.isArray(loc.authorized_in) ? loc.authorized_in.filter((v): v is string => typeof v === "string").join("\n") : "");
    setNeedsSponsorship(typeof loc.needs_sponsorship === "boolean" ? loc.needs_sponsorship : false);
    setRelocation(typeof loc.relocation === "string" ? loc.relocation : "");
    setJobSearchLocation(typeof loc.job_search_location === "string" ? loc.job_search_location : "");
    const lang = obj.language && typeof obj.language === "object" && !Array.isArray(obj.language) ? (obj.language as Record<string, unknown>) : {};
    setOutputLanguage(typeof lang.output === "string" ? lang.output : "en");
    setModesDir(typeof lang.modes_dir === "string" ? lang.modes_dir : "");
    const resumes = obj.resumes && typeof obj.resumes === "object" && !Array.isArray(obj.resumes) ? (obj.resumes as Record<string, unknown>) : {};
    setDefaultResume(typeof resumes.default === "string" ? resumes.default : "");
    setRoleResumes(Array.isArray(resumes.variants)
      ? resumes.variants
          .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v))
          .map((v) => `${typeof v.match === "string" ? v.match : ""}|${typeof v.file === "string" ? v.file : ""}`)
          .filter((line) => line !== "|")
          .join("\n")
      : "");
  }

  // Load saved prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        // key/manual are not wired yet (nothing reads them) → never restore into
        // those dead panels; only the Installed-CLI path is functional.
        if (v.mode === "cli") setMode("cli");
        if (v.cliId) setCliId(v.cliId);
        if (v.provider) {
          setProvider(v.provider);
          if (!v.cliId) setCliId(cliIdFromProvider(v.provider));
        }
        if (typeof v.logos === "boolean") setLogos(v.logos);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Detect installed CLIs
  useEffect(() => {
    fetch("/api/clis")
      .then((r) => {
        if (!r.ok) throw new Error(`CLI detection failed (${r.status}).`);
        return r.json();
      })
      .then((d) => {
        const list: Cli[] = d.clis ?? [];
        setClis(list);
        // auto-select the provider-mapped CLI if available, else the first installed
        const preferred = resolveProviderCliId(provider, list.filter((c) => c.installed).map((c) => c.id));
        setCliId((prev) => prev || list.find((c) => c.id === preferred && c.installed)?.id || list.find((c) => c.installed)?.id || "");
      })
      .catch((e) => {
        setClis([]);
        setError(e instanceof Error ? e.message : "Could not detect installed AI tools.");
      });
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error(`Profile load failed (${r.status}).`);
        return r.json();
      })
      .then((d) => {
        const nextProfiles = Array.isArray(d.profiles) ? d.profiles : [];
        setProfiles(nextProfiles.length ? nextProfiles : [{ name: "default", active: true }]);
        setActiveProfile(typeof d.activeProfile === "string" && d.activeProfile ? d.activeProfile : "default");
        syncProfileForm(d.activeProfileData);
      })
      .catch(() => {
        setProfiles([{ name: "default", active: true }]);
        setActiveProfile("default");
        syncProfileForm({});
      });
  }, []);

  useEffect(() => {
    fetch("/api/portals")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d === "object" && typeof (d as Record<string, unknown>).yaml === "string") {
          setPortalsYaml(String((d as Record<string, unknown>).yaml));
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || typeof d !== "object") return;
        setKeyStatus({
          openai: !!(d as Record<string, unknown>).openai,
          anthropic: !!(d as Record<string, unknown>).anthropic,
          fallbackCli: typeof (d as Record<string, unknown>).fallbackCli === "string" ? String((d as Record<string, unknown>).fallbackCli) : "cli",
          envLocalExists: !!(d as Record<string, unknown>).envLocalExists,
        });
      })
      .catch(() => {
        setKeyStatus(null);
    });
  }, []);

  useEffect(() => {
    fetch("/api/automation/morning")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d === "object" && typeof (d as Record<string, unknown>).time === "string") {
          setMorningTime(String((d as Record<string, unknown>).time));
          if (typeof (d as Record<string, unknown>).scheduleType === "string") {
            setScheduleType((d as Record<string, unknown>).scheduleType as ScheduleType);
          }
          setMorningPlistPath(typeof (d as Record<string, unknown>).plistPath === "string" ? String((d as Record<string, unknown>).plistPath) : "");
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  function save() {
    setError("");
    try {
      const installedCliIds = (clis ?? []).filter((c) => c.installed).map((c) => c.id);
      const nextCliId = resolveProviderCliId(provider, installedCliIds) || cliId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, cliId: nextCliId, provider, logos }));
      window.dispatchEvent(new CustomEvent("career-ops:config-change"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Could not save configuration in this browser.");
    }
  }

  async function saveProfile() {
    setError("");
    setProfileBusy(true);
    try {
      const roleList = roles
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: Record<string, unknown> = {
        profileName: activeProfile,
        name: fullName.trim(),
        preferredName: preferredName.trim(),
        pronouns: pronouns.trim(),
        email: email.trim(),
        phone: phone.trim(),
        linkedin: linkedin.trim(),
        github: github.trim(),
        portfolio: portfolio.trim(),
        location: location.trim(),
        address: address.trim(),
        streetAddress: streetAddress.trim(),
        addressLine2: addressLine2.trim(),
        postalCode: zipCode.trim(),
        currentCompany: currentCompany.trim(),
        currentTitle: currentTitle.trim(),
        workStyle: workStyle.trim(),
        relocation: relocation.trim(),
        jobSearchLocation: jobSearchLocation.trim(),
        roles: roleList,
        currency: currency.trim(),
        remote: remote.trim(),
        country: country.trim(),
        city: city.trim(),
        timezone: timezone.trim(),
        visaStatus: visaStatus.trim(),
        authorizedIn: authorizedIn
          .split(/\r?\n|,/)
          .map((s) => s.trim())
          .filter(Boolean),
        needsSponsorship,
        outputLanguage: outputLanguage.trim(),
        modesDir: modesDir.trim(),
        defaultResume: defaultResume.trim(),
        roleResumes: roleResumes.trim(),
        aiProvider: provider,
        aiCliId: resolveProviderCliId(provider, (clis ?? []).filter((c) => c.installed).map((c) => c.id)) || cliId,
      };
      const min = Number(compMin);
      const max = Number(compMax);
      if (Number.isFinite(min) && min > 0) payload.compMin = min;
      if (Number.isFinite(max) && max > 0) payload.compMax = max;
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? `Could not save profile (${r.status}).`);
      }
      const portalsRes = await fetch("/api/portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles: roleList,
          location: location
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!portalsRes.ok) {
        const d = (await portalsRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? `Could not save portals (${portalsRes.status}).`);
      }
      setProfiles((curr) =>
        curr.map((p) => (p.name === activeProfile ? { ...p, active: true } : { ...p, active: false })),
      );
      window.dispatchEvent(new CustomEvent("career-ops:config-change"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function activateProfile(nextProfile: string) {
    setError("");
    setProfileBusy(true);
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileName: nextProfile, activateOnly: true }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? `Could not activate profile (${r.status}).`);
      }
      const d = (await r.json().catch(() => null)) as { activeProfile?: string; activeProfileData?: unknown } | null;
      setActiveProfile(typeof d?.activeProfile === "string" ? d.activeProfile : nextProfile);
      syncProfileForm(d?.activeProfileData);
      setProfiles((curr) =>
        curr.some((p) => p.name === nextProfile)
          ? curr.map((p) => ({ ...p, active: p.name === nextProfile }))
          : [...curr.map((p) => ({ ...p, active: p.name === nextProfile })), { name: nextProfile, active: true }],
      );
      window.dispatchEvent(new CustomEvent("career-ops:config-change"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not activate profile.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function createProfile() {
    const nextProfile = profileName.trim();
    if (!nextProfile) return;
    await activateProfile(nextProfile);
    setProfileName("");
  }

  async function generateVariant() {
    const roleTitle = variantRoleTitle.trim();
    if (!roleTitle) return;
    setError("");
    setVariantStatus("Generating resume variant...");
    try {
      const r = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileName: activeProfile, roleTitle }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? `Could not generate variant (${r.status}).`);
      }
      const d = (await r.json().catch(() => null)) as { file?: string } | null;
      setVariantStatus(d?.file ? `Saved ${d.file}` : "Variant saved");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.dispatchEvent(new CustomEvent("career-ops:config-change"));
    } catch (e) {
      setVariantStatus("");
      setError(e instanceof Error ? e.message : "Could not generate resume variant.");
    }
  }

  async function savePortalsYaml() {
    setError("");
    setPortalsBusy(true);
    setPortalsStatus("");
    try {
      const r = await fetch("/api/portals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: portalsYaml }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? `Could not save portals (${r.status}).`);
      }
      setPortalsStatus("Portals saved.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.dispatchEvent(new CustomEvent("career-ops:config-change"));
    } catch (e) {
      setPortalsStatus("");
      setError(e instanceof Error ? e.message : "Could not save portals.");
    } finally {
      setPortalsBusy(false);
    }
  }

  const roleSuggestionMatches = (() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return ROLE_SUGGESTIONS.slice(0, 6);
    return ROLE_SUGGESTIONS.filter((role) => role.toLowerCase().includes(q)).slice(0, 6);
  })();

  function appendRoleSuggestion(role: string) {
    const current = roles.trim();
    const lines = current ? current.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
    if (!lines.some((line) => line.toLowerCase() === role.toLowerCase())) {
      lines.push(role);
    }
    setRoles(lines.join("\n"));
    setRoleQuery("");
  }

  function describeNextRun(time: string): string {
    const match = time.trim().match(/^(\d{2}):(\d{2})$/);
    if (!match) return time;
    const hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const diffMinutes = Math.max(1, Math.round((next.getTime() - now.getTime()) / 60000));
    if (diffMinutes < 60) return `${time} (in about ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"})`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (mins === 0) return `${time} (in about ${hours} hour${hours === 1 ? "" : "s"})`;
    return `${time} (in about ${hours} hour${hours === 1 ? "" : "s"} ${mins} minute${mins === 1 ? "" : "s"})`;
  }

  async function saveMorningSchedule() {
    setError("");
    setMorningBusy(true);
    setMorningStatus("");
    try {
      const r = await fetch("/api/automation/morning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: morningTime,
          scheduleType,
          everyDays: Number.parseInt(everyDays, 10) || 2,
          weekdays: selectedWeekdays,
        }),
      });
      const d = (await r.json().catch(() => null)) as { error?: string; time?: string } | null;
      if (!r.ok) {
        throw new Error(d?.error ?? `Could not update morning schedule (${r.status}).`);
      }
      setMorningTime(d?.time ?? morningTime);
      setMorningStatus(`Daily schedule set to run at ${describeNextRun(d?.time ?? morningTime)}.`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setMorningStatus("");
      setError(e instanceof Error ? e.message : "Could not update morning schedule.");
    } finally {
      setMorningBusy(false);
    }
  }

  const installed = clis?.filter((c) => c.installed) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl tracking-tight text-landing">Config</h1>
      <p className="mt-1 text-sm text-muted">
        Run VApplyIQ AI on your own AI, right on your computer. Your CV and data never leave your machine.
      </p>

      <section className="mt-8 rounded-2xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Profile</label>
            <p className="mt-1 text-sm text-muted">
              Switch the active targeting profile for different resumes, role families, or locations.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            Active: <span className="font-medium text-foreground">{activeProfile}</span>
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <button
                key={profile.name}
                type="button"
                onClick={() => activateProfile(profile.name)}
                disabled={profileBusy || profile.active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors max-sm:min-h-[44px]",
                  profile.active
                    ? "border-brand/50 bg-brand-soft text-foreground"
                    : "border-border bg-surface/60 text-muted hover:bg-surface-hover hover:text-foreground",
                  profileBusy && "opacity-70",
                )}
              >
                {profile.active ? <Check className="size-4" /> : <ChevronDown className="size-4" />}
                {profile.name}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Create a new profile name"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
            />
            <button
              type="button"
              onClick={createProfile}
              disabled={profileBusy || !profileName.trim()}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60 max-sm:min-h-[44px]"
            >
              {profileBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Add and activate
            </button>
          </div>
          <p className="text-xs text-faint">
            This activates the profile immediately and keeps the current app UI in sync with that choice.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Secret Status</label>
            <p className="mt-1 text-sm text-muted">Server-side keys stay hidden. CLI remains the fallback when keys are missing.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {keyStatus?.openai ? <Badge tone="good">OpenAI key found</Badge> : <Badge tone="muted">OpenAI key missing</Badge>}
            {keyStatus?.anthropic ? <Badge tone="good">Claude key found</Badge> : <Badge tone="muted">Claude key missing</Badge>}
            <Badge tone={keyStatus?.fallbackCli === "server-key" ? "good" : "warn"}>
              {keyStatus?.fallbackCli === "server-key" ? "Server key active" : "CLI fallback active"}
            </Badge>
            {keyStatus?.envLocalExists ? <Badge tone="info">.env.local detected</Badge> : <Badge tone="bad">.env.local not found</Badge>}
          </div>
        </div>
        <p className="mt-3 text-xs text-faint">
          The web app only reads the presence of keys on the server. It never exposes the secret value in the browser.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Morning Schedule</label>
            <p className="mt-1 text-sm text-muted">
              Set the daily refresh time from the UI. This updates the local launchd plist used by the morning pipeline.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Run at</label>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand/50"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Schedule type</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand/50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="twice_weekly">Twice weekly</option>
              <option value="thrice_weekly">Thrice weekly</option>
              <option value="every_n_days">Every 2 days</option>
              <option value="custom_weekdays">Custom weekdays</option>
            </select>
          </div>
          <button
            type="button"
            onClick={saveMorningSchedule}
            disabled={morningBusy || !morningTime}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60 max-sm:min-h-[44px]"
          >
            {morningBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save schedule
          </button>
        </div>
        {scheduleType === "every_n_days" ? (
          <div className="mt-3 max-w-xs">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Every N days</label>
            <input
              type="number"
              min={2}
              value={everyDays}
              onChange={(e) => setEveryDays(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand/50"
            />
          </div>
        ) : null}
        {(scheduleType === "weekly" || scheduleType === "twice_weekly" || scheduleType === "thrice_weekly" || scheduleType === "custom_weekdays") ? (
          <div className="mt-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Weekdays</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = selectedWeekdays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      setSelectedWeekdays((curr) =>
                        curr.includes(day.id) ? curr.filter((d) => d !== day.id) : [...curr, day.id].sort(),
                      );
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      active ? "border-brand/50 bg-brand-soft text-foreground" : "border-border bg-surface/60 text-muted hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-faint">
              {scheduleType === "weekly" ? "Pick one day." : scheduleType === "twice_weekly" ? "Pick two days." : scheduleType === "thrice_weekly" ? "Pick three days." : "Pick any days you want."}
            </p>
          </div>
        ) : null}
        <p className="mt-2 text-xs text-faint">
          The saved schedule is read back from the plist whenever you reopen the app.
        </p>
        <div className="mt-3 rounded-xl border border-border bg-surface/30 p-3 text-xs text-muted">
          <p className="font-medium text-foreground">Saved schedule</p>
          {morningPlistPath ? <p className="mt-1 text-faint">Plist: automation/io.career-ops.daily-refresh.plist</p> : null}
        </div>
        {morningStatus && <p className="mt-2 text-xs text-emerald-500">{morningStatus}</p>}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Profile</label>
            <p className="mt-1 text-sm text-muted">
              Edit the active profile for <span className="font-medium text-foreground">{activeProfile}</span>.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <TabButton active={profileTab === "basics"} onClick={() => setProfileTab("basics")} label="Basics" />
            <TabButton active={profileTab === "matching"} onClick={() => setProfileTab("matching")} label="Matching" />
            <TabButton active={profileTab === "prefills"} onClick={() => setProfileTab("prefills")} label="Prefills" />
            <TabButton active={profileTab === "language"} onClick={() => setProfileTab("language")} label="Language" />
          </div>

          <div className="mt-4 rounded-xl border border-border bg-surface/30 p-4">
            {profileTab === "basics" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" required value={fullName} onChange={setFullName} placeholder="Jane Smith" />
                <Field label="Preferred name" value={preferredName} onChange={setPreferredName} placeholder="Jane" />
                <Field label="Pronouns" value={pronouns} onChange={setPronouns} placeholder="she/her" />
                <Field label="Email" required value={email} onChange={setEmail} placeholder="jane@example.com" />
                <Field label="Phone" required value={phone} onChange={setPhone} placeholder="+1 555 123 4567" />
                <Field label="LinkedIn" required value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/you" />
                <Field label="GitHub" value={github} onChange={setGithub} placeholder="https://github.com/you" />
                <Field label="Portfolio" value={portfolio} onChange={setPortfolio} placeholder="https://your-site.com" />
                <Field label="Location" required value={location} onChange={setLocation} placeholder="San Francisco, CA" />
                <Field label="Address" value={address} onChange={setAddress} placeholder="City, State" />
                <Field label="Street address" value={streetAddress} onChange={setStreetAddress} placeholder="123 Main St" />
                <Field label="Address line 2" value={addressLine2} onChange={setAddressLine2} placeholder="Apt 4B" />
                <Field label="Zip code" required value={zipCode} onChange={setZipCode} placeholder="94105" />
                <Field label="Current company" value={currentCompany} onChange={setCurrentCompany} placeholder="Acme Inc." />
                <Field label="Current title" required value={currentTitle} onChange={setCurrentTitle} placeholder="Senior Data Engineer" />
                <SelectField label="Work style" required value={workStyle} onChange={setWorkStyle} options={["Remote", "Hybrid", "On-site", "Flexible"]} placeholder="Remote" />
                <SelectField label="Relocation" required value={relocation} onChange={setRelocation} options={["Open to relocate", "Not open to relocate", "Willing if needed"]} placeholder="Open to relocate" />
                <Field label="Job search location" value={jobSearchLocation} onChange={setJobSearchLocation} placeholder="United States" />
                <SelectField label="Remote preference" value={remote} onChange={setRemote} options={REMOTE_OPTIONS} placeholder="Remote preferred" />
                <Field label="Comp min" value={compMin} onChange={setCompMin} placeholder="120000" />
                <Field label="Comp max" value={compMax} onChange={setCompMax} placeholder="180000" />
                <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} placeholder="USD" />
                <Field label="Default resume" value={defaultResume} onChange={setDefaultResume} placeholder="cv-person-1.pdf" />
              </div>
            )}

            {profileTab === "matching" && (
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Target roles</label>
                  <input
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    placeholder="Search roles, e.g. Data"
                    className="mb-2 w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
                  />
                  <textarea
                    value={roles}
                    onChange={(e) => setRoles(e.target.value)}
                    placeholder={"Senior AI Engineer\nStaff ML Engineer"}
                    rows={4}
                    className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
                  />
                  <p className="mt-1 text-xs text-faint">One role per line or comma-separated. These seed matching and search.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roleSuggestionMatches.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => appendRoleSuggestion(role)}
                        className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  {roleQuery.trim() && roleSuggestionMatches.length === 0 ? (
                    <p className="mt-2 text-xs text-faint">No close matches. Try a broader term.</p>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Role resume variants</label>
                    <textarea
                      value={roleResumes}
                      onChange={(e) => setRoleResumes(e.target.value)}
                      placeholder={"Data Engineer|cv-person-1-data.pdf\nETL Developer|cv-person-1-etl.pdf"}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
                    />
                    <p className="mt-1 text-xs text-faint">Use `role title|relative-or-absolute-pdf-path` one per line.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/30 p-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Generate variant</label>
                    <p className="mb-2 text-xs text-faint">
                      Create a new resume variant from the active profile for an accepted role, then register it automatically.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={variantRoleTitle}
                        onChange={(e) => setVariantRoleTitle(e.target.value)}
                        placeholder="Senior Data Engineer"
                        className="min-w-0 flex-1 rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
                      />
                      <button
                        type="button"
                        onClick={generateVariant}
                        disabled={!variantRoleTitle.trim()}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60 max-sm:min-h-[44px]"
                      >
                        Create role variant
                      </button>
                    </div>
                    {variantStatus && <p className="mt-2 text-xs text-faint">{variantStatus}</p>}
                  </div>
                </div>
              </div>
            )}

            {profileTab === "prefills" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Country" required value={country} onChange={setCountry} placeholder="United States" />
                <Field label="City" value={city} onChange={setCity} placeholder="San Francisco" />
                <SelectField label="Timezone" value={timezone} onChange={setTimezone} options={TIMEZONE_OPTIONS} placeholder="America/Chicago" />
                <Field label="Visa status" value={visaStatus} onChange={setVisaStatus} placeholder="No sponsorship needed" />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Authorized in
                  </label>
                  <textarea
                    value={authorizedIn}
                    onChange={(e) => setAuthorizedIn(e.target.value)}
                    placeholder={"United States\nCanada"}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
                  />
                  <p className="mt-1 text-xs text-faint">Countries/regions where you already have work authorization.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNeedsSponsorship((v) => !v)}
                  role="switch"
                  aria-checked={needsSponsorship}
                  className="sm:col-span-2 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/50 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">Needs sponsorship</span>
                    <span className="mt-0.5 block text-xs text-faint">
                      Turn this on if you need employer sponsorship outside your authorized countries.
                    </span>
                  </span>
                  <span
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      needsSponsorship ? "bg-brand" : "bg-surface-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                        needsSponsorship ? "translate-x-[1.375rem]" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>
            )}

            {profileTab === "language" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Output language" required value={outputLanguage} onChange={setOutputLanguage} options={OUTPUT_LANGUAGE_OPTIONS} placeholder="en" />
                <Field label="Modes dir" value={modesDir} onChange={setModesDir} placeholder="modes/de" />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveProfile}
            disabled={profileBusy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200 disabled:cursor-not-allowed disabled:opacity-60 max-sm:min-h-[44px]"
          >
            {profileBusy ? <Loader2 className="size-4 animate-spin" /> : null}
            Save active profile
          </button>
          <span className="text-xs text-faint">This writes to `config/profile.yml` only for the selected profile.</span>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Portals</label>
            <p className="mt-1 text-sm text-muted">
              Edit the full <span className="font-mono text-foreground">portals.yml</span> used by the scanner. This is
              the source of truth for title, location, salary, visa, and company targets.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <textarea
            value={portalsYaml}
            onChange={(e) => setPortalsYaml(e.target.value)}
            rows={22}
            className="w-full rounded-xl border border-border bg-surface/60 px-4 py-3 font-mono text-xs outline-none transition-colors placeholder:text-faint focus:border-brand/50"
            placeholder="# Paste portals.yml here"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={savePortalsYaml}
            disabled={portalsBusy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200 disabled:cursor-not-allowed disabled:opacity-60 max-sm:min-h-[44px]"
          >
            {portalsBusy ? <Loader2 className="size-4 animate-spin" /> : null}
            Save portals
          </button>
          <span className="text-xs text-faint">This writes directly to `portals.yml`.</span>
        </div>
        {portalsStatus && <p className="mt-2 text-xs text-emerald-500">{portalsStatus}</p>}
      </section>

      {/* Engine mode */}
      <label className="mt-8 mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        AI Engine
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <ModeCard
          active={mode === "cli"}
          onClick={() => setMode("cli")}
          icon={Terminal}
          title="Use an AI tool you have"
          hint="Recommended"
        />
        <ModeCard
          active={mode === "key"}
          onClick={() => setMode("key")}
          icon={KeyRound}
          title="Paste an AI key"
          hint="Use hidden server keys"
        />
        <ModeCard
          active={mode === "manual"}
          onClick={() => setMode("manual")}
          icon={TerminalSquare}
          title="No setup needed"
          hint="Coming soon"
          disabled
        />
      </div>

      <div className="mt-6">
        {mode === "cli" && (
          <div>
            <p className="mb-1 text-sm text-muted">
              VApplyIQ AI uses an AI tool you already have — signed in, your own usage, nothing to paste.
            </p>
            <p className="mb-3 text-xs text-faint">Works with Claude Code, Codex, OpenCode and more — free ones work great.</p>
            {clis === null ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Checking what&apos;s on your computer…
              </div>
            ) : installed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/30 p-4 text-sm text-muted">
                No AI tool yet? Free options like <span className="text-foreground">OpenCode</span> with Qwen or GLM work great.{" "}
                <a href="https://career-ops.org/docs/free-ai-engine" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand hover:underline">
                  Get one free <ExternalLink className="size-3" />
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {clis.map((c) => {
                  const selected = c.id === cliId;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                        selected
                          ? "border-brand/50 bg-brand-soft"
                          : c.installed
                            ? "border-border bg-surface/50"
                            : "border-border/60 bg-surface/20",
                      )}
                    >
                      {c.installed ? (
                        <Check className="size-4 shrink-0 text-emerald-400" />
                      ) : (
                        <CircleDashed className="size-4 shrink-0 text-faint" />
                      )}
                      <button
                        type="button"
                        disabled={!c.installed}
                        onClick={() => setCliId(c.id)}
                        className={cn(
                          "flex flex-1 items-center gap-2 text-left max-sm:min-h-[44px]",
                          c.installed ? "" : "cursor-default",
                        )}
                      >
                        <span
                          className={cn(
                            "font-medium",
                            selected ? "text-foreground" : c.installed ? "" : "text-muted",
                          )}
                        >
                          {c.name}
                        </span>
                        <span className="font-mono text-xs text-faint">{c.run}</span>
                      </button>
                      {c.installed ? (
                        <span className="hidden max-w-[40%] shrink-0 truncate text-xs text-faint sm:block">
                          {c.path}
                        </span>
                      ) : (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center justify-center gap-1 text-xs text-brand hover:underline max-sm:min-h-[44px]"
                        >
                          Install <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
                {installed.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-surface/30 p-4 text-xs text-muted">
                    No supported CLI found on your PATH. Install one (e.g. Claude Code, Gemini CLI, OpenCode) to get started.
                  </p>
                )}
                <p className="mt-2 text-[11px] leading-relaxed text-faint">
                  Best on <span className="text-muted">Claude Code</span> (live progress, the agentic apply + AI search,
                  reliable evaluation persistence). Other CLIs work for the core flows with reduced features.
                </p>
              </div>
            )}
          </div>
        )}

        {mode === "key" && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Provider
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setProvider(p);
                      const nextCli = resolveProviderCliId(p, (clis ?? []).filter((c) => c.installed).map((c) => c.id));
                      if (nextCli) setCliId(nextCli);
                    }}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                      provider === p
                        ? "border-brand/50 bg-brand-soft text-foreground"
                        : "border-border bg-surface/50 text-muted hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    {PROVIDER_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Server-side key
              </label>
              <p className="mb-2 text-xs text-faint">
                Keep the secret hidden in <code className="rounded bg-surface-hover px-1 py-0.5 font-mono">web/.env.local</code>.
              </p>
              <div className="rounded-xl border border-dashed border-border bg-surface/30 px-4 py-3 text-sm text-muted">
                Add one of these, then restart the web app:
                <div className="mt-2 font-mono text-xs leading-6 text-foreground">
                  OPENAI_API_KEY=...
                  <br />
                  ANTHROPIC_API_KEY=...
                </div>
                <p className="mt-2 text-xs text-faint">
                  The app prefers the hidden server key when present. If not set, it falls back to the installed CLI.
                </p>
              </div>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 p-4 text-sm text-muted">
            The easiest way in — no keys, nothing to set up. On the roadmap.
          </div>
        )}
      </div>

      {/* Appearance / privacy */}
      <label className="mt-8 mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Appearance
      </label>
      <button
        type="button"
        onClick={() => setLogos((v) => !v)}
        role="switch"
        aria-checked={logos}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-surface/50 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">Company logos</span>
          <span className="mt-0.5 block text-xs text-faint">
            Show each company&apos;s real logo. Fetched once through your local server and cached on
            disk — only the employer domain is sent to a third party. Off = colored monograms only.
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            logos ? "bg-brand" : "bg-surface-hover",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
              logos ? "translate-x-[1.375rem]" : "translate-x-0.5",
            )}
          />
        </span>
      </button>

      <CadenceSettings />

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200 max-sm:min-h-[44px]"
        >
          {saved ? <Check className="size-4" /> : null}
          {saved ? "Saved" : "Save config"}
        </button>
        <span className="text-xs text-faint">Local-first · on our roadmap</span>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  hint,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-border bg-surface/30 opacity-55"
          : active
            ? "border-brand/50 bg-brand-soft"
            : "border-border bg-surface/50 hover:bg-surface-hover",
      )}
    >
      <Icon className={cn("size-4", active && !disabled ? "text-brand" : "text-muted")} />
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-faint">{hint}</span>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-colors max-sm:min-h-[44px]",
        active
          ? "border-brand/50 bg-brand-soft text-foreground"
          : "border-border bg-surface/60 text-muted hover:bg-surface-hover hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
      />
    </div>
  );
}

function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand/50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
