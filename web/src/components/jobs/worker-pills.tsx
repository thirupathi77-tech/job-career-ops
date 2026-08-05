"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, History } from "lucide-react";
import { useJobs } from "@/components/jobs/job-store";
import { WorkerCard, pillTone, TONE } from "@/components/jobs/worker-card";
import { cn } from "@/lib/cn";

// Back-compat re-exports (app/jobs/page.tsx imports pillTone from here).
export { pillTone, TONE };

// Collapsed "worker" pills in the sidebar — each the shared <WorkerCard> wrapped
// in a Link to its detail. Same component the assistant chat renders inline.
export function WorkerPills() {
  const { jobs, removeJob, clearFinished } = useJobs();
  const pathname = usePathname();
  if (jobs.length === 0) return null;
  const running = jobs.filter((j) => j.status === "running").length;
  const finished = jobs.length - running;

  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Workers</span>
        {running > 0 && <span className="text-[10px] tabular-nums text-brand">{running} running</span>}
        <Link href="/jobs" className="ml-auto text-faint transition-colors hover:text-foreground" title="History" aria-label="Worker history">
          <History className="size-3.5" />
        </Link>
        {finished > 0 && (
          <button onClick={clearFinished} className="text-[10px] text-faint transition-colors hover:text-foreground" title="Clear finished">
            clear
          </button>
        )}
      </div>
      <ul className="space-y-1.5">
        {jobs.slice(0, 6).map((j) => {
          const active = pathname === `/jobs/${j.id}`;
          return (
            <li key={j.id}>
              <div
                className={cn(
                  "group relative rounded-lg border px-2.5 py-2 transition-colors",
                  active ? "border-brand/50 bg-brand-soft" : "border-border bg-surface/60 hover:bg-surface-hover",
                )}
              >
                <Link
                  href={`/jobs/${j.id}`}
                  aria-label={`Open worker ${j.title || j.id}`}
                  className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                />
                <WorkerCard
                  job={j}
                  variant="tray"
                  trailing={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeJob(j.id);
                      }}
                      type="button"
                      className="relative z-10 text-faint opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                      aria-label={`Dismiss worker ${j.title || j.id}`}
                    >
                      <X className="size-3" />
                    </button>
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
