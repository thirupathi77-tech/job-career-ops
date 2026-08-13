import fs from "node:fs";
import { Suspense } from "react";
import { JobsHub } from "@/components/jobs/jobs-hub";
import { seedExploreFilters } from "@/lib/core/portals";
import { careerOpsRoot, pipelineSummary } from "@/lib/career-ops";
import { DEFAULT_FILTERS } from "@/lib/explore";

export const dynamic = "force-dynamic";

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ view?: string; tab?: string }> }) {
  const params = await searchParams;
  const { inbox, applications } = pipelineSummary();
  let seed: { filters: typeof DEFAULT_FILTERS; seededFrom: string[] } = { filters: DEFAULT_FILTERS, seededFrom: [] };
  try {
    seed = seedExploreFilters();
  } catch {
    /* bare checkout -> defaults */
  }
  let rootExists = false;
  try {
    rootExists = fs.existsSync(careerOpsRoot());
  } catch {
    /* ignore */
  }

  return (
    <Suspense>
      <JobsHub
        initialView={params.view === "discover" ? "discover" : "pipeline"}
        initialTab={params.tab?.toUpperCase() === "EVALUATED" ? "evaluated" : "inbox"}
        seed={seed}
        inbox={inbox}
        applications={applications}
        rootExists={rootExists}
      />
    </Suspense>
  );
}
