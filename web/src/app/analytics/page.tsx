import Link from "next/link";
import { pipelineSummary } from "@/lib/career-ops";
import { canonStatus, scoreNum } from "@/lib/format";

export const dynamic = "force-dynamic";

const STAGES: { key: string; label: string }[] = [
  { key: "EVALUATED", label: "Evaluated" },
  { key: "APPLIED", label: "Applied" },
  { key: "RESPONDED", label: "Responded" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "HIRED", label: "Hired" },
  { key: "REJECTED", label: "Rejected" },
  { key: "DISCARDED", label: "Discarded" },
];

export default function Analytics() {
  const { applications } = pipelineSummary();
  const total = applications.length;

  const stageCounts = STAGES.map((s) => ({
    ...s,
    n: applications.filter((a) => canonStatus(a.status).includes(s.key)).length,
  }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.n));

  const scores = applications.map((a) => scoreNum(a.score)).filter((n) => !Number.isNaN(n));
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const buckets = [
    { label: "85 – 100", test: (n: number) => n >= 85 },
    { label: "70 – 84", test: (n: number) => n >= 70 && n < 85 },
    { label: "55 – 69", test: (n: number) => n >= 55 && n < 70 },
    { label: "0 – 54", test: (n: number) => n < 55 },
  ].map((b) => ({ label: b.label, n: scores.filter(b.test).length }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.n));

  const companyCounts = new Map<string, number>();
  for (const a of applications) if (a.company) companyCounts.set(a.company, (companyCounts.get(a.company) ?? 0) + 1);
  const topCompanies = [...companyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCompany = Math.max(1, ...topCompanies.map((c) => c[1]));

  const offers = stageCounts.find((s) => s.key === "OFFER")?.n ?? 0;
  const interviews = stageCounts.find((s) => s.key === "INTERVIEW")?.n ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl tracking-tight text-landing">Analytics</h1>
      <p className="mt-1 text-sm text-muted">Across {total} tracked evaluations.</p>

      {total === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
          <p className="font-display text-xl text-foreground">No application data yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Analytics will appear after you evaluate and track roles.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/jobs?view=discover" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-200">
              Discover roles
            </Link>
            <Link href="/jobs?view=pipeline" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-brand/40">
              Open jobs
            </Link>
          </div>
        </div>
      )}

      {/* headline stats */}
      {total > 0 && <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat value={total} label="evaluated" />
        <Stat value={avg ? Math.round(avg) : "—"} label="avg job fit" />
        <Stat
          value={interviews}
          label="interviews"
          hint={interviews === 0 ? "Interviews follow replies — keep follow-ups warm →" : undefined}
        />
        <Stat
          value={offers}
          label="offers"
          hint={offers === 0 ? "Offers follow interviews — keep the conversations going →" : undefined}
        />
      </div>}

      {total > 0 && <Section title="Pipeline by stage">
        {stageCounts.map((s) => (
          <Bar
            key={s.key}
            label={s.label}
            value={s.n}
            pct={(s.n / maxStage) * 100}
            total={total}
            tone={s.key === "OFFER" ? "positive" : "neutral"}
          />
        ))}
      </Section>}

      {total > 0 && <Section title="Job Fit distribution">
        {buckets.map((b) => (
          <Bar key={b.label} label={b.label} value={b.n} pct={(b.n / maxBucket) * 100} total={scores.length} />
        ))}
      </Section>}

      {total > 0 && <Section title="Top companies" id="companies">
        {topCompanies.map(([name, n]) => (
          <Bar key={name} label={name} value={n} pct={(n / maxCompany) * 100} />
        ))}
      </Section>}
    </div>
  );
}

function Stat({ value, label, hint }: { value: number | string; label: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-4">
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-faint">{label}</div>
      {hint && (
        <Link href="/" className="mt-2 block text-xs text-muted transition-colors hover:text-brand">
          {hint}
        </Link>
      )}
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-10 scroll-mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</h2>
      <div className="mt-4 space-y-2.5">{children}</div>
    </section>
  );
}

function Bar({
  label,
  value,
  pct,
  total,
  tone = "neutral",
}: {
  label: string;
  value: number;
  pct: number;
  total?: number;
  tone?: "neutral" | "positive";
}) {
  const share = total && total > 0 ? Math.round((value / total) * 100) : null;
  const fill =
    tone === "positive"
      ? "bg-gradient-to-r from-emerald-500/60 to-emerald-500/30"
      : "bg-gradient-to-r from-foreground/25 to-foreground/10";
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 truncate text-sm text-muted">{label}</div>
      <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface">
        <div
          className={`h-full rounded-md ${fill}`}
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <div className="w-20 shrink-0 text-right text-sm tabular-nums">
        {value}
        {share !== null && <span className="ml-1 text-xs text-faint">{share}%</span>}
      </div>
    </div>
  );
}
