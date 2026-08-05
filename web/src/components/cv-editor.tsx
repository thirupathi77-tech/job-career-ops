"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function CvEditor() {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [exists, setExists] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cv")
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load CV (${r.status}).`);
        return r.json();
      })
      .then((d) => {
        setContent(d.content ?? "");
        setExists(d.exists ?? false);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load CV."))
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setDirty(false);
        setExists(true);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || `Could not save CV (${res.status}).`);
      }
    } catch {
      setError("Could not save CV. Check that the local server can write cv.md.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-landing">CV editor</h1>
          <p className="mt-1 text-sm text-muted">
            Edit <code className="text-foreground">cv.md</code> with live preview.
            {!exists && loaded && <span className="ml-1 text-faint">No cv.md yet — start typing to create it.</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors max-sm:min-h-[44px]",
            dirty
              ? "bg-brand text-brand-foreground hover:bg-brand-200"
              : "border border-border bg-surface text-muted",
          )}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}

      {!loaded ? (
        <div className="mt-6 text-sm text-muted">Loading…</div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <textarea
            value={content}
            aria-label="CV markdown editor"
            onChange={(e) => {
              setContent(e.target.value);
              setDirty(true);
            }}
            spellCheck={false}
            placeholder="# Your Name&#10;&#10;## Summary&#10;..."
            className="min-h-[60vh] w-full resize-none rounded-2xl border border-border bg-surface/50 p-4 font-mono text-sm leading-relaxed outline-none transition-colors placeholder:text-faint focus:border-brand/40"
          />
          <article aria-label="CV preview" className="report-prose min-h-[60vh] overflow-auto rounded-2xl border border-border bg-surface/30 p-5">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-muted">Preview appears here.</p>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
