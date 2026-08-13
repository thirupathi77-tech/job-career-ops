import { Suspense } from "react";
import { pipelineSummary } from "@/lib/career-ops";
import { ApplicationsHub } from "@/components/applications/applications-hub";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = await searchParams;
  const { inbox, applications } = pipelineSummary();
  return (
    <Suspense>
      <ApplicationsHub view={params.view === "followups" ? "followups" : "tracking"} applications={applications} inbox={inbox} />
    </Suspense>
  );
}
