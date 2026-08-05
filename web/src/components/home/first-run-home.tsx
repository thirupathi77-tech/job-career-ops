"use client";

import { instrumentSerif } from "@/lib/fonts";
import { HeroGlow } from "@/components/hero-glow";
import { CvIngest } from "@/components/cv/cv-ingest";
import Link from "next/link";
import { Sparkles, Settings, Target } from "lucide-react";

// The first-run takeover: when cv.md is missing, the CV-upload hero IS the home.
// One input, value-coming framing (not a form), the same product chrome (HeroGlow
// + dot-bg) so it feels like the app, not a gate. The whole aha (CV → free matches
// → first score) flows from here.
export function FirstRunHome() {
  const kickoff = "Help me finish setting up VApplyIQ AI after I add my CV. Walk me through my target roles, salary, location, and scanner setup conversationally, and write the files for me. Do not ask me to edit YAML.";
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <section className="dot-bg relative overflow-hidden rounded-2xl border border-border bg-surface/40 px-7 py-10 md:px-10 md:py-12">
        <HeroGlow />
        {/* Readability scrim between the animated glow (z-0) and the copy (z-10):
            the glow still reads at the edges, but text always sits on a surface that
            clears WCAG AA contrast instead of washing out over a bright corner. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-surface/55 backdrop-blur-[2px] dark:bg-background/45" />
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="text-faint">//</span> local-first · your machine
          </p>
          <h1 className={`${instrumentSerif.className} mt-3 text-4xl leading-[1.05] text-landing md:text-5xl`}>
            Drop your CV. See who&apos;s hiring you in 60 seconds.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            No account. No setup. Your CV is parsed once on your own AI, then we scan the live job market for roles
            that fit you — <span className="text-foreground">that part&apos;s free</span>. You only spend tokens again
            when you choose to score a role.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-border bg-background/55 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand/15 text-brand">1</span>
                Start with your CV
              </div>
              <CvIngest />
            </div>
            <div className="space-y-3 rounded-2xl border border-border bg-background/55 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand/15 text-brand">2</span>
                Finish setup in the browser
              </div>
              <p className="text-sm leading-relaxed text-muted">
                Once your CV is in, the assistant can save your profile, seed your target roles, and prepare the scanner
                without you touching YAML.
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("co-assistant", { detail: { message: kickoff } }))}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200"
              >
                <Sparkles className="size-4" /> Finish setup with the assistant
              </button>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href="/config"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                >
                  <Settings className="size-4" /> Open config
                </Link>
                <Link
                  href="/portals"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                >
                  <Target className="size-4" /> Open portals
                </Link>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-surface/30 p-3 text-xs leading-relaxed text-muted">
                After that, you can paste a job URL, evaluate it, and get a first scored match. The app keeps the data
                local and writes the setup files for you.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
