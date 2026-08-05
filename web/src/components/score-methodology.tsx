import { ChevronDown } from "lucide-react";

// Transparent 100-point Job Fit estimate. This is VApplyIQ AI's assessment,
// never represented as an employer's private ATS score.

const DIMENSIONS: [string, string][] = [
  ["Required skills & experience · 35%", "evidence in your CV for the job's must-have requirements"],
  ["Responsibilities & domain · 20%", "similarity between your proven work and the role's actual scope"],
  ["Seniority alignment · 15%", "fit between your level and the role's expected ownership"],
  ["Keyword coverage · 10%", "job-description language supported by truthful resume evidence"],
  ["Location & work authorization · 10%", "location feasibility and sponsorship constraints"],
  ["Education or certifications · 5%", "required credentials explicitly supported by your CV"],
  ["Preferred qualifications · 5%", "evidence for the posting's optional advantages"],
];

const BLOCKS: [string, string][] = [
  ["A", "Plain-English summary of the role"],
  ["B", "A table of how your CV matches each requirement, plus the gaps"],
  ["C", "Strategy — how to position yourself for this role"],
  ["D", "Compensation research, comparing the offer to market rates"],
  ["E", "Personalization notes for your application"],
  ["F", "Interview prep — STAR stories tailored to this job"],
  ["G", "Posting legitimacy — a check that the listing is real, not a scam or ghost job"],
];

export function ScoreMethodology() {
  return (
    <details className="group mt-10 overflow-hidden rounded-2xl border border-border bg-surface/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-surface-hover">
        How VApplyIQ AI scored this — and why it&apos;s for <span className="text-landing">you</span>
        <ChevronDown className="ml-auto size-4 text-faint transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border px-5 py-4 text-sm">
        <p className="text-muted">
          Every role receives a <strong className="text-foreground">0–100 Job Fit Score</strong>. It is a transparent
          VApplyIQ AI estimate, not a score produced by an employer&apos;s ATS. <strong className="text-brand">80</strong> is
          the default apply line; explicit hard blockers can still override a high numeric match.
        </p>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Weighted dimensions</div>
          <ul className="space-y-1.5">
            {DIMENSIONS.map(([k, v]) => (
              <li key={k}>
                <span className="font-medium text-foreground">{k}</span> <span className="text-muted">— {v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">What each report block means</div>
          <ul className="space-y-2">
            {BLOCKS.map(([k, v]) => (
              <li key={k} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-brand-soft text-xs font-semibold text-brand">
                  {k}
                </span>
                <span className="text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-faint">The score supports prioritization; always review hard blockers and the evidence table before applying.</p>
      </div>
    </details>
  );
}
