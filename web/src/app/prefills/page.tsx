import { CheckSquare } from "lucide-react";
import { ApplyView } from "@/components/apply-view";
import { ApplyBackdropMount } from "@/components/apply/apply-backdrop-mount";

export const dynamic = "force-dynamic";

export default function PrefillsPage() {
  return (
    <div className="relative min-h-screen">
      <ApplyBackdropMount />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-3">
          <CheckSquare className="size-6 text-brand" />
          <h1 className="font-display text-2xl tracking-tight text-landing">Prefills</h1>
        </div>
        <p className="mt-1.5 max-w-xl text-sm text-muted">
          Approve a job first, then let VApplyIQ AI prefill the form and flag any sign-in or sensitive fields before you
          submit.
        </p>
        <div className="mt-6">
          <ApplyView />
        </div>
      </div>
    </div>
  );
}
