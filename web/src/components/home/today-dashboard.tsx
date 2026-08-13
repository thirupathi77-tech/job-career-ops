"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CircleHelp, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { instrumentSerif } from "@/lib/fonts";
import { HeroGlow } from "@/components/hero-glow";
import type { Application, InboxJob } from "@/lib/career-ops";
import type { DiscoveredOffer } from "@/lib/explore";
import { FollowUpCard, type FollowUp } from "@/components/home/follow-up-card";
import { DecisionCard } from "@/components/home/decision-card";
import { QuickEvaluate } from "@/components/quick-evaluate";

// The retention "Job Queue": a dual-loop action queue (the maintainer's
// "N new matches this week · M follow-ups due"). SUPPLY loop = fresh free-scan
// matches (zero tokens, /api/whats-new); DEMAND loop = follow-ups due
// (/api/followups). Each item one-tap actionable. Home stays a VIEW over the
// canonical files — every action dispatches a real registry action / route.
export function TodayDashboard({
  applications,
  inbox,
  inBetween,
}: {
  applications: Application[];
  inbox: InboxJob[];
  inBetween: boolean;
}) {
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [overdue, setOverdue] = useState(0);
  const [fresh, setFresh] = useState<DiscoveredOffer[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(true);
  const [lastDiscoveryDay, setLastDiscoveryDay] = useState<string | null>(null);
  const router = useRouter();
  const dateLabel = useMemo(() => new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }), []);
  const discoveryDue = lastDiscoveryDay !== todayKey;

  const refetch = useCallback(async () => {
    setLoadingQueues(true);
    await Promise.allSettled([
      fetch("/api/followups")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        setFollowups(Array.isArray(d.entries) ? d.entries : []);
        setOverdue(d.metadata?.overdue ?? d.entries?.length ?? 0);
      })
      .catch(() => {}),
      fetch("/api/whats-new")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        setFresh(Array.isArray(d.offers) ? d.offers : []);
        setLastDiscoveryDay(todayKey);
        try {
          localStorage.setItem("career-ops:last-discovery-day", todayKey);
        } catch {
          /* ignore */
        }
      })
      .catch(() => {}),
    ]);
    setLoadingQueues(false);
  }, [todayKey]);

  useEffect(() => {
    try {
      setLastDiscoveryDay(localStorage.getItem("career-ops:last-discovery-day"));
    } catch {
      setLastDiscoveryDay(null);
    }
    refetch();
    // A worker (evaluate/pdf) just wrote a real tracker row — refresh the server
    // snapshot (applications/inbox props) + the client loops so the freshly-scored
    // role appears in "Awaiting your decision" without a manual reload.
    const onDone = () => {
      router.refresh();
      refetch();
    };
    window.addEventListener("co-job-done", onDone);
    return () => window.removeEventListener("co-job-done", onDone);
  }, [refetch, router]);

  // Awaiting decision: scored (Evaluated) but no terminal status yet.
  const awaiting = useMemo(
    () => applications.filter((a) => /^evaluat/i.test(a.status)).slice(0, 6),
    [applications],
  );

  const newThisWeek = fresh.length;
  const allClear = !loadingQueues && newThisWeek === 0 && overdue === 0 && awaiting.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 max-sm:pb-24">
      {discoveryDue && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium text-foreground">Discovery is due today.</p>
            <p className="text-muted">Run a free scan before using the pipeline so you work from the newest matches.</p>
          </div>
          <Link href="/jobs?view=discover" className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-text">
            Run discovery
          </Link>
        </div>
      )}
      <section className="dot-bg relative overflow-hidden rounded-2xl border border-border bg-surface/40 px-7 py-10 md:px-10 md:py-12">
        <HeroGlow />
        {/* Readability scrim between the animated glow (z-0) and the copy (z-10). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-surface/55 backdrop-blur-[2px] dark:bg-background/45" />
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="text-faint">//</span> job queue · <span className="tabular-nums">{dateLabel}</span>
          </p>
          <h1 className={`${instrumentSerif.className} mt-3 text-4xl leading-[1.05] text-landing md:text-5xl`}>
            {loadingQueues ? (
              <>Loading today&apos;s priorities…</>
            ) : allClear ? (
              <>You&apos;re all caught up.</>
            ) : (
              <>
                {newThisWeek > 0 && (
                  <>
                    <span className="text-brand tabular-nums">{newThisWeek}</span> new match{newThisWeek === 1 ? "" : "es"} this week
                  </>
                )}
                {newThisWeek > 0 && overdue > 0 && <span className="text-faint"> · </span>}
                {overdue > 0 && (
                  <>
                    <span className="text-brand tabular-nums">{overdue}</span> follow-up{overdue === 1 ? "" : "s"} due
                  </>
                )}
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted">
            {loadingQueues ? "Checking new matches and follow-ups…" : discoveryDue ? "Run discovery first, then work the pipeline from fresh matches." : allClear ? "I'll keep scanning the market in the background and surface anything that fits." : "Your action queue for today — discovery and follow-ups, in one place."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/jobs?view=discover" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition hover:bg-brand-200 max-sm:min-h-[44px]">
              Find new roles <ArrowRight className="size-4" />
            </Link>
            <Link href="/jobs?view=pipeline" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-brand/40 hover:text-brand max-sm:min-h-[44px]">
              Open pipeline
            </Link>
          </div>
          {inBetween && <QuickEvaluate />}
        </div>
      </section>

      {/* A. Follow-ups due (demand loop) */}
      {followups.length > 0 && (
        <Section icon={Bell} title="Follow-ups due" hint="Keep your applications alive — a nudge beats silence">
          <div className="grid gap-2.5">
            {followups.map((f) => (
              <FollowUpCard key={`${f.num}-${f.company}`} followup={f} onLogged={() => setOverdue((n) => Math.max(0, n - 1))} />
            ))}
          </div>
        </Section>
      )}

      {/* B. Awaiting your decision */}
      {awaiting.length > 0 && (
        <Section icon={CircleHelp} title="Awaiting your decision" hint="Scored — apply or skip">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {awaiting.map((a) => (
              <DecisionCard key={a.n} app={a} />
            ))}
          </div>
        </Section>
      )}

      {allClear && (
        <div className="mt-8 rounded-2xl border border-border bg-surface/30 px-6 py-10 text-center">
          <Sparkles className="mx-auto size-6 text-brand" />
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Nothing needs you right now. Run a <Link href="/jobs?view=discover" className="text-brand hover:underline">free scan</Link> to surface this week&apos;s roles, or check your <Link href="/jobs?view=pipeline" className="text-brand hover:underline">jobs inbox</Link>.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, hint, children }: { icon: React.ComponentType<{ className?: string }>; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-brand" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2>
        <span className="text-xs text-faint">· {hint}</span>
      </div>
      {children}
    </section>
  );
}
