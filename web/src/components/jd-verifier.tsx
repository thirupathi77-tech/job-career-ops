"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";

type JdResult = {
  ok: boolean;
  jd?: { url?: string; title?: string; text?: string };
  error?: string;
  stderr?: string;
};

export function JdVerifier({ url }: { url?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JdResult | null>(null);

  if (!url) return null;

  const verify = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as JdResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Could not verify the posting." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={verify}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Verify with Playwright
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand"
        >
          Open posting <ExternalLink className="size-4" />
        </a>
      </div>

      {result?.error && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {result.error}
        </p>
      )}

      {result?.ok && result.jd && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-foreground">{result.jd.title || "Posting verified"}</p>
          <p className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted">
            {(result.jd.text || "").slice(0, 1200) || "No readable text captured."}
          </p>
        </div>
      )}
    </div>
  );
}
