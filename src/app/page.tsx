import Link from "next/link";
import { ArrowRight, Database, FileSearch, LineChart, Radar, ShieldCheck, Sparkles, Target, Workflow } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { Backdrop } from "@/components/chrome/theme";
import { getAllMarketData } from "@/lib/market/provider";
import { DEPARTMENT_INDEX } from "@/lib/data/departments";
import { CAREERS } from "@/lib/data/careers";
import { PHASES } from "@/lib/types";
import { compactNumber, cn, signedPct, usd } from "@/lib/utils";
import { FreshnessBadge } from "@/components/market/tiles";
import type { MarketSnapshot } from "@/lib/types";

export const revalidate = 3600;

/* ==================================================================== */

export default async function LandingPage() {
  let markets: Awaited<ReturnType<typeof getAllMarketData>> = [];
  let marketError = false;
  try {
    markets = await getAllMarketData();
  } catch {
    marketError = true;
  }

  const byId = new Map(markets.map((m) => [m.departmentId, m]));
  const totalCourses = DEPARTMENT_INDEX.reduce((s, d) => s + d.curriculum.filter((c) => c.required).length, 0);
  const liveCount = markets.filter((m) => m.snapshot.source === "live").length;
  const avgSalary = markets.length
    ? Math.round(markets.reduce((s, m) => s + m.snapshot.metrics.medianSalary, 0) / markets.length)
    : 0;

  const spotlight = DEPARTMENT_INDEX.map((d) => ({ dept: d, market: byId.get(d.id) }))
    .filter((x) => x.market)
    .slice(0, 6);

  return (
    <>
      <Backdrop />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="container-page pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/70 px-3.5 py-1.5 text-xs text-ink-soft backdrop-blur-sm">
              <Sparkles className="size-3.5 text-violet-accent" />
              Five-phase advisory engine · {DEPARTMENT_INDEX.length} departments · {totalCourses} prerequisites mapped
            </div>

            <h1 className="animate-fade-in mt-7 font-display text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.03] font-semibold tracking-tight text-balance-tight text-ink [animation-delay:80ms]">
              Choosing a major is{" "}
              <span className="text-aurora">an engineering problem.</span>
            </h1>

            <p className="animate-fade-in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft text-balance [animation-delay:160ms]">
              Feed it your transcript and what you actually want from a career. It audits every prerequisite against a real curriculum database, pulls live wage and
              employment data, and returns a ranked top three with the risks nobody mentions in the prospectus.
            </p>

            <div className="animate-fade-in mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:240ms]">
              <Link href="/advisor" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Start the five-phase assessment
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/departments" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Browse the catalogue
                </Button>
              </Link>
            </div>

            <p className="animate-fade-in mt-4 text-xs text-ink-faint [animation-delay:300ms]">
              No account. Grades are parsed and scored in your browser and never sent anywhere.
            </p>
          </div>

          {/* market ticker */}
          <div className="animate-fade-in mx-auto mt-16 max-w-6xl [animation-delay:380ms]">
            <Card glass className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-ok" />
                  </span>
                  <span className="text-sm font-medium text-ink">Labour-market feed</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {!marketError && markets.length ? (
                    <>
                      <FreshnessBadge snapshot={markets[0].snapshot} />
                      <span className="text-ink-faint">
                        {liveCount}/{markets.length} departments reading live BLS series
                      </span>
                    </>
                  ) : (
                    <span className="text-warn">Live feed unavailable — showing last published release</span>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden">
                <div className="animate-marquee flex w-max gap-3 px-5 py-4">
                  {[...spotlight, ...spotlight].map(({ dept, market }, i) => (
                    <Link
                      key={`${dept.id}-${i}`}
                      href={`/departments#${dept.id}`}
                      className="group w-64 shrink-0 rounded-xl border border-line bg-surface-2/70 p-3.5 transition-colors hover:border-brand-400/60 hover:bg-surface-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink">{dept.shortName}</span>
                        <span className="size-2 shrink-0 rounded-full" style={{ background: `oklch(0.7 0.16 ${dept.hue})` }} />
                      </div>
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div>
                          <div className="font-display text-lg leading-none font-semibold text-ink tabular-nums">
                            {usd(market!.snapshot.metrics.medianSalary, { compact: true })}
                          </div>
                          <div className="mt-1 text-[10px] text-ink-faint">{compactNumber(market!.snapshot.metrics.sampleSize)} national jobs</div>
                        </div>
                        <div
                          className={cn(
                            "font-mono text-xs font-semibold tabular-nums",
                            market!.snapshot.metrics.projectedGrowth >= 5 ? "text-ok" : market!.snapshot.metrics.projectedGrowth >= 0 ? "text-ink-soft" : "text-risk",
                          )}
                        >
                          {signedPct(market!.snapshot.metrics.projectedGrowth, 0)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[11px] text-ink-faint">
                <span>US Bureau of Labor Statistics · OEWS and Employment Projections</span>
                <span className="font-mono">
                  median across catalogue {usd(avgSalary, { compact: true })} · mean demand index{" "}
                  {markets.length ? Math.round(markets.reduce((s, m) => s + m.snapshot.metrics.demandIndex, 0) / markets.length) : "—"}/100
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- how it works */}
      <section className="container-page py-20">
        <div className="max-w-2xl">
          <SectionLabel>Workflow</SectionLabel>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold text-ink sm:text-4xl">
            Five phases, and you can see the reasoning at every step
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Each phase produces an artefact you can inspect, disagree with, and correct. Nothing is a black box: every score carries the sentence that produced it.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PHASES.map((phase, i) => (
            <li key={phase.id}>
              <Card glass className="group h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/50">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl leading-none font-semibold text-ink-faint transition-colors group-hover:text-brand-400">
                    {String(phase.id).padStart(2, "0")}
                  </span>
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink-faint">{phase.label}</span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{phase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{phase.blurb}</p>
                <div className="mt-4 h-0.5 w-8 rounded-full bg-linear-to-r from-brand-500 to-violet-accent transition-all duration-300 group-hover:w-16" style={{ transitionDelay: `${i * 20}ms` }} />
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------- features */}
      <section className="container-page py-10">
        <div className="grid gap-4 lg:grid-cols-3">
          <FeatureCard
            icon={FileSearch}
            title="Real prerequisite auditing"
            body="Every required course in the curriculum database is matched against your actual record, with minimum grades, hard gates and cumulative-GPA thresholds evaluated separately. You get a per-course verdict, not a vibe."
            span
          />
          <FeatureCard
            icon={Database}
            title="Live market intelligence"
            body="Wage distributions and employment levels are read from the BLS OEWS API with a 12-hour server cache. When BLS has no series for an occupation, the report says so instead of pretending it is fresh."
          />
          <FeatureCard
            icon={Radar}
            title="Seven-factor weighted scoring"
            body="Interest alignment, career alignment, academic fit, market viability, prerequisite readiness, workload fit and work-style fit — each with an adaptive weight derived from the priorities you actually set."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="FERPA-aware by architecture"
            body="Grades are parsed and scored entirely in your browser. No API request contains your transcript, because the endpoints have no field for one. The session lives in localStorage and can be wiped in one click."
          />
          <FeatureCard
            icon={Target}
            title="Blind-spot analysis"
            body="The report names what it did not measure — cost, commute, your weak subject, personality under deadline — instead of implying an exhaustive judgement it cannot make."
          />
          <FeatureCard
            icon={Workflow}
            title="Actionable next steps"
            body="Not a listicle. Each step names the person to contact, the timing, and the reason it matters, with your specific grades and thresholds woven into the explanation."
            span
          />
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="container-page py-24">
        <Card glass sheen className="relative overflow-hidden p-10 text-center sm:p-16">
          <div className="dot-bg absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="font-display text-3xl leading-tight font-semibold text-balance-tight text-ink sm:text-4xl">
              The most consequential choice of your degree, made with better inputs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Takes about six minutes. Ends with a ranked shortlist, a prerequisite gap list, a market read, and an honest account of where the model is
              uncertain.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/advisor">
                <Button size="lg">
                  Begin assessment
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/method">
                <Button size="lg" variant="ghost">
                  Read the method
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-ink-faint">
              <span className="flex items-center gap-1.5">
                <LineChart className="size-3" /> {CAREERS.length} career roles mapped
              </span>
              <span className="flex items-center gap-1.5">
                <FileSearch className="size-3" /> {totalCourses} prerequisites tracked
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3" /> Nothing leaves your device
              </span>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}

/* ==================================================================== */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-brand-500 uppercase">
      <span className="h-px w-6 bg-brand-500/50" />
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  span,
}: {
  icon: typeof Radar;
  title: string;
  body: string;
  span?: boolean;
}) {
  return (
    <Card glass className={cn("group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/50", span && "lg:col-span-2")}>
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500/18 to-violet-accent/18 text-brand-500 transition-transform duration-300 group-hover:scale-110">
          <Icon className="size-5" strokeWidth={2} />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
        </div>
      </div>
    </Card>
  );
}

export type { MarketSnapshot };