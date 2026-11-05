"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, ShieldCheck, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/chrome/theme";
import { useAdvisor, onHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/primitives";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [resume, setResume] = useState<number | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => onHydrated(() => setResume(useAdvisor.getState().maxPhaseReached)), []);

  const links = [
    { href: "/", label: "Overview" },
    { href: "/method", label: "Method" },
    { href: "/departments", label: "Departments" },
  ];

  return (
    <header className="no-print sticky top-0 z-50 border-b border-line/70 bg-surface/72 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-105">
            <Compass className="size-5" strokeWidth={2.2} />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-[15px] font-semibold tracking-tight text-ink">Dept Selection Guide</span>
            <span className="mt-0.5 text-[10px] tracking-widest text-ink-faint uppercase">Academic advising engine</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {l.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-linear-to-r from-transparent via-brand-500 to-transparent" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10px] text-ink-faint lg:flex">
            <ShieldCheck className="size-3" />
            FERPA-aware · stays on device
          </span>
          <ThemeToggle />
          <Link href="/advisor" className="hidden sm:block">
            <Button size="sm">{resume && resume > 1 ? "Resume session" : "Start advising"}</Button>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-xl border border-line bg-surface-2 text-ink-soft md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface-2/95 backdrop-blur-xl md:hidden">
          <nav className="container-page flex flex-col py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface-3 hover:text-ink">
                {l.label}
              </Link>
            ))}
            <Link href="/advisor" className="mt-2">
              <Button size="sm" className="w-full">
                Start advising
              </Button>
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-line">
      <div className="container-page py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-violet-600 text-white">
                <Compass className="size-4" />
              </span>
              <span className="font-display text-sm font-semibold text-ink">Dept Selection Guide</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              A decision-support tool for university students. It ranks departments against your recorded work and published labour-market data. It does not replace an
              academic adviser, and it makes no promises about admission, graduation, licensure or employment.
            </p>
          </div>

          <div className="grid gap-8 text-sm sm:grid-cols-3">
            <div>
              <h4 className="mb-2.5 text-[11px] font-semibold tracking-widest text-ink-faint uppercase">Explore</h4>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/advisor" className="text-ink-soft hover:text-ink">Advisory process</Link>
                </li>
                <li>
                  <Link href="/departments" className="text-ink-soft hover:text-ink">Department catalogue</Link>
                </li>
                <li>
                  <Link href="/method" className="text-ink-soft hover:text-ink">Scoring method</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2.5 text-[11px] font-semibold tracking-widest text-ink-faint uppercase">Data</h4>
              <ul className="space-y-1.5 text-ink-soft">
                <li>US BLS Occupational Employment and Wage Statistics</li>
                <li>BLS Employment Projections</li>
                <li>Curriculum prerequisite reference dataset</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2.5 text-[11px] font-semibold tracking-widest text-ink-faint uppercase">Privacy</h4>
              <ul className="space-y-1.5 text-ink-soft">
                <li>Grades never leave your browser</li>
                <li>No account, no tracking, no analytics</li>
                <li>Clear your session at any time</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center">
          <p>Figures are probabilistic estimates from published data, not guarantees. Verify every load-bearing claim with a person.</p>
          <p className="flex items-center gap-1.5">
            Built for students, not institutions.
          </p>
        </div>
      </div>
    </footer>
  );
}