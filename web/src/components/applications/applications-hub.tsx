"use client";

import Link from "next/link";
import { CalendarClock, ListChecks } from "lucide-react";
import type { Application, InboxJob } from "@/lib/career-ops";
import { cn } from "@/lib/cn";
import { PipelineView } from "@/components/pipeline-view";
import { FollowupsView } from "@/components/followups/followups-view";

export function ApplicationsHub({ view, applications, inbox }: { view: "tracking" | "followups"; applications: Application[]; inbox: InboxJob[] }) {
  return (
    <div>
      <div className="mx-auto flex max-w-6xl gap-1 border-b border-border px-6 pt-5">
        <HubLink active={view === "tracking"} href="/applications" icon={ListChecks} label="Tracking" />
        <HubLink active={view === "followups"} href="/applications?view=followups" icon={CalendarClock} label="Follow-ups" />
      </div>
      {view === "followups" ? <FollowupsView /> : <PipelineView applications={applications} inbox={inbox} scope="applications" />}
    </div>
  );
}

function HubLink({ active, href, icon: Icon, label }: { active: boolean; href: string; icon: typeof ListChecks; label: string }) {
  return (
    <Link href={href} className={cn("-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium", active ? "border-brand text-foreground" : "border-transparent text-muted hover:text-foreground")}>
      <Icon className="size-4" /> {label}
    </Link>
  );
}
