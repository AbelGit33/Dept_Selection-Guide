import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Backdrop } from "@/components/chrome/theme";
import { Badge, Card } from "@/components/ui/primitives";
import { MetricTile, ProvenanceNote } from "@/components/market/tiles";
import { InterestBars, SalaryBand } from "@/components/viz/charts";
import { DEPARTMENT_INDEX } from "@/lib/data/departments";
import { rolesForDepartment } from "@/lib/data/careers";
import { getAllMarketData } from "@/lib/market/provider";
import { departmentInterestVector } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Departments · Dept Selection Guide",
  description: "All 20 departments with curriculum, careers and labour market context side by side.",
};

export const revalidate = 43_200;

export default async function DepartmentsPage() {
  const market = await getAllMarketData();
  const snapshots = new Map(market.map((m) => [m.departmentId, m.snapshot]));

  return (
    <div className="relative">
      <Backdrop />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Badge tone="neutral">{DEPARTMENT_INDEX.length} departments</Badge>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink">Department directory</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
          Every department in the database with the courses it requires, the roles it feeds, and the published statistics for those roles — so you can compare
          them on equal terms before you commit to anything.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {DEPARTMENT_INDEX.map((d) => {
            const snap = snapshots.get(d.id);
            const roles = rolesForDepartment(d.careerIds);
            return (
              <Card key={d.id} glass className="flex flex-col p-5">
                <div className="flex items-start gap-4">
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-xl font-display text-base font-semibold"
                    style={{ background: `oklch(0.7 0.15 ${d.hue} / 0.16)`, color: `oklch(0.62 0.17 ${d.hue})` }}
                  >
                    {d.shortName.slice(0, 3)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold text-ink">{d.name}</h2>
                    <p className="mt-0.5 text-[12px] text-ink-faint">{d.school}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{d.blurb}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{d.requirements.admissionMode}</Badge>
                  <Badge tone="neutral">GPA {d.requirements.overallGpa.toFixed(2)}</Badge>
                  <Badge tone="neutral">{d.requirements.requiredCredits} credits</Badge>
                  <Badge tone="neutral">{d.curriculum.length} key courses</Badge>
                </div>

                {snap ? (
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <MetricTile label="Median pay" value={`$${Math.round(snap.metrics.medianSalary / 1000)}k`} sub="national, annual" />
                    <MetricTile
                      label="Projected growth"
                      value={`${snap.metrics.projectedGrowth >= 0 ? "+" : ""}${snap.metrics.projectedGrowth.toFixed(1)}%`}
                      sub="next decade"
                      tone={snap.metrics.projectedGrowth >= 0 ? "ok" : "risk"}
                    />
                  </div>
                ) : null}

                {snap ? (
                  <div className="mt-3">
                    <SalaryBand p25={snap.metrics.salaryP25} median={snap.metrics.medianSalary} p75={snap.metrics.salaryP75} hue={d.hue} />
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-[10px] font-semibold tracking-widest text-ink-faint uppercase">Trains these axes</h3>
                    <InterestBars interests={departmentInterestVector(d)} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-[10px] font-semibold tracking-widest text-ink-faint uppercase">Feeds these roles</h3>
                    <ul className="space-y-1">
                      {roles.slice(0, 4).map((r) => (
                        <li key={r.id} className="truncate text-[11px] text-ink-soft">
                          {r.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {snap ? <ProvenanceNote snapshot={snap} className="mt-4" /> : null}

                <Link
                  href="/advisor"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-400 transition-colors hover:text-brand-300"
                >
                  Check your prerequisites against this
                  <ArrowRight className="size-3.5" />
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
