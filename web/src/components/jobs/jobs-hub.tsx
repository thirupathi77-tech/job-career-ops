"use client";

import Link from "next/link";
import { Compass, ListChecks } from "lucide-react";
import type { Application, InboxJob } from "@/lib/career-ops";
import type { ExploreFilters } from "@/lib/explore";
import { cn } from "@/lib/cn";
import { ExplorerView } from "@/components/explore/explorer-view";
import { PipelineView } from "@/components/pipeline-view";

type View = "discover" | "pipeline";

export function JobsHub({
  initialView,
  initialTab,
  seed,
  inbox,
  applications,
  rootExists,
}: {
  initialView: View;
  initialTab: "inbox" | "evaluated";
  seed: { filters: ExploreFilters; seededFrom: string[] };
  inbox: InboxJob[];
  applications: Application[];
  rootExists: boolean;
}) {
  return (
    <div>
      <div className="mx-auto flex max-w-6xl gap-1 border-b border-border px-6 pt-5">
        <JobViewLink active={initialView === "discover"} href="/jobs?view=discover" icon={Compass} label="Discover" />
        <JobViewLink active={initialView === "pipeline" && initialTab === "inbox"} href="/jobs?view=pipeline" icon={ListChecks} label="Inbox & Shortlist" />
        <JobViewLink active={initialView === "pipeline" && initialTab === "evaluated"} href="/jobs?view=pipeline&tab=EVALUATED" icon={ListChecks} label="Evaluated" />
      </div>
      {initialView === "discover" ? (
        <ExplorerView seed={seed} inboxSnapshot={inbox} appsSnapshot={applications} rootExists={rootExists} />
      ) : (
        <PipelineView applications={applications} inbox={inbox} />
      )}
    </div>
  );
}

function JobViewLink({ active, href, icon: Icon, label }: { active: boolean; href: string; icon: typeof Compass; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-brand text-foreground" : "border-transparent text-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" /> {label}
    </Link>
  );
}
