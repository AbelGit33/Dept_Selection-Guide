"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/35 hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface-3 text-ink border border-line hover:border-brand-400/60 hover:bg-surface-2",
  ghost: "text-ink-soft hover:text-ink hover:bg-surface-3",
  outline: "border border-line text-ink hover:border-brand-500 hover:bg-surface-2",
  danger: "bg-risk/12 text-risk border border-risk/35 hover:bg-risk/20",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 select-none",
        "disabled:opacity-45 disabled:pointer-events-none",
        "active:scale-[0.98] focus-visible:outline-2",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
});

/* --------------------------------------------------------------- Spinner */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------------------------------------------- Card */

export function Card({
  className,
  glass,
  sheen,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean; sheen?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-line",
        glass ? "glass ring-soft" : "bg-surface-2/60",
        sheen && "sheen",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 p-5 pb-3", className)}>
      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Badge */

type BadgeTone = "neutral" | "brand" | "ok" | "warn" | "risk" | "violet" | "cyan";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-ink-soft border-line",
  brand: "bg-brand-500/12 text-brand-700 dark:text-brand-300 border-brand-500/30",
  ok: "bg-ok/12 text-ok border-ok/30",
  warn: "bg-warn/14 text-warn border-warn/32",
  risk: "bg-risk/12 text-risk border-risk/32",
  violet: "bg-violet-accent/12 text-violet-accent border-violet-accent/30",
  cyan: "bg-cyan-accent/12 text-cyan-accent border-cyan-accent/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  mono,
  title,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  mono?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        mono && "font-mono tracking-tight",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Fields */

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-ink-soft uppercase">{label}</span>
        {hint ? <span className="text-[11px] text-ink-faint normal-case">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="block text-xs text-risk">{error}</span> : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputBase, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputBase, "min-h-24 resize-y leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputBase, "cursor-pointer appearance-none bg-linear-to-r from-transparent to-transparent pr-8", className)} {...props}>
      {children}
    </select>
  );
});

/* --------------------------------------------------------------- Slider */

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  leftHint,
  rightHint,
  tone = "brand",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  leftHint?: string;
  rightHint?: string;
  tone?: "brand" | "warn" | "ok";
}) {
  const pctPos = ((value - min) / (max - min)) * 100;
  const gradient =
    tone === "warn"
      ? "from-warn to-risk"
      : tone === "ok"
        ? "from-ok to-cyan-accent"
        : "from-brand-400 to-violet-accent";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-ink-soft uppercase">{label}</span>
        <span className="font-mono text-sm font-semibold text-ink tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-brand-500 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-brand-500 [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
        style={{
          backgroundImage: `linear-gradient(to right, var(--tw-gradient-from, ${tone === "warn" ? "var(--color-warn)" : "var(--color-brand-400)"}), ${tone === "warn" ? "var(--color-risk)" : "var(--color-violet-accent)"} ${pctPos}%, transparent ${pctPos}%)`,
          ["--tw-gradient-from" as string]: tone === "ok" ? "var(--color-ok)" : tone === "warn" ? "var(--color-warn)" : "var(--color-brand-400)",
          ["--tw-gradient-to" as string]: tone === "ok" ? "var(--color-cyan-accent)" : tone === "warn" ? "var(--color-risk)" : "var(--color-violet-accent)",
        }}
      />
      {leftHint || rightHint ? (
        <div className="flex justify-between text-[11px] text-ink-faint">
          <span>{leftHint}</span>
          <span>{rightHint}</span>
        </div>
      ) : null}
      <span className="sr-only">{gradient}</span>
    </div>
  );
}

/* ------------------------------------------------------------- Progress */

export function Progress({ value, max = 100, tone = "brand", className, label }: { value: number; max?: number; tone?: "brand" | "ok" | "warn" | "risk"; className?: string; label?: string }) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const tones = {
    brand: "from-brand-400 to-violet-accent",
    ok: "from-ok to-cyan-accent",
    warn: "from-warn to-risk",
    risk: "from-risk to-risk",
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div
        className={cn("h-full rounded-full bg-linear-to-r transition-[width] duration-700 ease-out", tones[tone])}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

/* -------------------------------------------------------------- Toggle */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-500" : "bg-surface-3 group-hover:bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}