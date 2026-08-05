"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const KEY = "career-ops:theme";
const DARK_THEME_COLOR = "#0b1120";
const LIGHT_THEME_COLOR = "#f6f8fb";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    sync();
    // There can be more than one toggle mounted (mobile header + drawer).
    // Keep every sun/moon icon synchronized when either control is used.
    window.addEventListener("themechange", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("themechange", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggle() {
    // Read the DOM rather than potentially stale component state. This also
    // makes rapid clicks and multiple mounted toggles deterministic.
    const next = !document.documentElement.classList.contains("dark");
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    // keep the browser chrome (Safari status bar / Dynamic Island) tinted to match
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    // let theme-reactive components (shaders) re-read
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn("text-muted", className)}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
