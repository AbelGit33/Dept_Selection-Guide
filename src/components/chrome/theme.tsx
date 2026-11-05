"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Applies the persisted theme before paint to avoid a flash of the wrong mode. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("dsg-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} suppressHydrationWarning />;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem("dsg-theme", next);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative grid size-9 place-items-center rounded-xl border border-line bg-surface-2 text-ink-soft transition-colors hover:border-brand-400/60 hover:text-ink",
        className,
      )}
    >
      <span className="relative block size-4">
        <SunIcon className={cn("absolute inset-0 transition-all duration-300", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0")} />
        <MoonIcon className={cn("absolute inset-0 transition-all duration-300", theme === "dark" ? "-rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      </span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={cn("size-4", className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("size-4", className)}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

/** Ambient aurora + grid backdrop used across marketing surfaces. */
export function Backdrop({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  const blobs = [
    {
      position: "-top-1/4 -left-1/4 size-[46rem] blur-[110px]",
      hue: 275,
      alpha: 0.42,
      delay: "0s",
    },
    {
      position: "-top-1/3 right-1/5 size-[38rem] blur-[110px]",
      hue: 215,
      alpha: 0.34,
      delay: "-6s",
    },
    {
      position: "bottom-[-12rem] left-1/3 size-[42rem] blur-[120px]",
      hue: 330,
      alpha: 0.26,
      delay: "-12s",
    },
  ];

  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 grid-bg opacity-70" />
      {blobs.map((b) => (
        <div
          key={b.hue}
          className={cn("animate-aurora absolute rounded-full", b.position)}
          style={{
            background: `radial-gradient(circle, oklch(0.62 0.19 ${b.hue} / ${b.alpha}), transparent 68%)`,
            animationDelay: b.delay,
            opacity: intensity,
          }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-surface to-transparent" />
    </div>
  );
}