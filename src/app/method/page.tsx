import type { Metadata } from "next";
import { Backdrop } from "@/components/chrome/theme";
import { Card, Badge } from "@/components/ui/primitives";import { PHASES, INTEREST_AXES } from "@/lib/types";
import { getAllMarketData } from "@/lib/market/provider";
import { WEIGHT_LABELS } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Method · Dept Selection Guide",
  description: "How the scoring works, what it cannot see, and where the data comes from.",
};

export const revalidate = 43_200;

export default async function MethodPage() {
  const market = await getAllMarketData();
  const liveCount = market.filter((m) => m.snapshot.source === "live").length;
  const total = market.length;

  return (
    <div className="relative">
      <Backdrop />
      <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <Badge tone="neutral">Transparency</Badge>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink">How this is calculated</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Every number this tool shows is derived from data you entered plus published statistics you can go and read yourself. Nothing is generated, nothing is
          inferred about you, and no model is guessing what you should do with your life.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">The five phases</h2>
          <ol className="mt-5 space-y-3">
            {PHASES.map((p) => (
              <li key={p.id}>
                <Card glass className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-500/15 font-mono text-sm font-semibold text-brand-400">{p.id}</span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">{p.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{p.blurb}</p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">The composite score</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Each department gets seven component scores on a 0–100 scale. They are combined using weights derived from the priorities you set in Phase 2 — a
            student who cares most about stability gets a stability-heavy weighting, and one who cares most about pay gets a different one.
          </p>
          <div className="mt-5 space-y-2.5">
            {Object.entries(WEIGHT_LABELS).map(([key, label]) => (
              <Card key={key} glass className="p-4">
                <h3 className="text-sm font-medium text-ink">{label}</h3>
              </Card>
            ))}
          </div>
          <Card className="mt-4 border-brand-500/30 bg-brand-500/6 p-5">
            <h3 className="text-sm font-semibold text-ink">Deliberate ordering</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Prerequisites are checked in Phase 3 <em>before</em> any market data is consulted. Pay and demand figures are the last input added and can only
              re-rank departments that already survived the academic audit. A lucrative field you cannot get into is not a recommendation.
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">Interest axes</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Questionnaire answers map onto eight axes. Axes are not independent — some pull against each other, and the tool reports those tensions rather than
            averaging them into a falsely tidy number.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {INTEREST_AXES.map((a) => (
              <Card key={a.key} glass className="p-4">
                <h3 className="text-sm font-medium text-ink">{a.label}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{a.blurb}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">Where the numbers come from</h2>
          <Card glass className="mt-5 p-5">
            <h3 className="text-sm font-semibold text-ink">Labour market</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              US Bureau of Labor Statistics Occupational Employment and Wage Statistics, plus the Employment Projections programme for growth rates. At the time
              this page was generated, {liveCount} of {total} department snapshots came from a live upstream fetch and the rest from a curated copy of published
              figures held in this repository.
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
              Each snapshot reports its own source. If a card says &ldquo;reference data&rdquo;, that is a real published number that was not freshly retrieved —
              the tool does not dress cached figures up as live ones.
            </p>
          </Card>

          <Card glass className="mt-3 p-5">
            <h3 className="text-sm font-semibold text-ink">Curriculum and prerequisites</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              A bundled curriculum database covering 20 departments. Course codes, minimum grades, GPA gates and hard requirements are matched against the courses
              you entered. Matching is deliberately strict: a shared course number across unrelated subjects is not treated as a match, because that would let one
              course satisfy two different departments&rsquo; requirements.
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">Your privacy</h2>
          <Card glass className="mt-5 p-5">
            <ul className="space-y-3 text-[13px] leading-relaxed text-ink-soft">
              <li>
                <span className="font-medium text-ink">Your transcript never leaves your device.</span> Parsing, GPA calculation, prerequisite matching and
                scoring all run in your browser. There is no API route in this application that accepts a grade, a course or any student identifier.
              </li>
              <li>
                <span className="font-medium text-ink">Session data lives in localStorage.</span> It is stored under <code className="font-mono text-ink">dsg-session-v1</code>{" "}
                on your own device. Clearing your browser data removes it. It is never sent anywhere.
              </li>
              <li>
                <span className="font-medium text-ink">Market requests contain no student data.</span> The only thing that crosses the network to our own API is a
                list of department IDs used to look up occupation codes — the same request any visitor would make.
              </li>
              <li>
                <span className="font-medium text-ink">No accounts, no analytics on your answers, no third-party trackers.</span> The export button produces a file
                directly in your browser.
              </li>
            </ul>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">What this cannot see</h2>
          <div className="mt-5 space-y-2.5">
            {[
              "Financial circumstances, tuition burden, and whether you can work while studying.",
              "Family obligations, caregiving responsibilities, or who you have to support.",
              "Health, disability, accommodations, or anything an adviser would need to know privately.",
              "Campus politics, cohort dynamics, specific professors, and whether a department is currently well-run.",
              "Undeclared majors, dual degrees, study-abroad feasibility, or transfer-credit equivalences.",
              "Labour market conditions in the specific geography you plan to work in.",
              "Whether you actually like the work, only what the occupational statistics say about it.",
            ].map((b) => (
              <Card key={b} glass className="flex items-start gap-3 p-4">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-accent" />
                <span className="text-[13px] leading-relaxed text-ink-soft">{b}</span>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">A note on fairness</h2>
          <Card className="mt-5 border-warn/30 bg-warn/5 p-5">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Occupational statistics are averages over entire populations. Applied to one person they are a weak signal, and they encode the pay gaps that
              already exist. This tool does not use gender, race, disability, age, nationality, religion, first-generation status, or income in any calculation, and
              it is not capable of doing so — those fields are not collected. If a result seems to be steering you away from something because of who you are, that
              is a limitation of the underlying data, not a finding about you.
            </p>
          </Card>
        </section>

        <p className="mt-12 text-[12px] leading-relaxed text-ink-faint">
          This tool offers probabilistic suggestions to support a conversation with a real academic adviser. It is not an admissions decision, a guarantee of
          employment or salary, or a substitute for the people at your university who are paid to know you.
        </p>
      </div>
    </div>
  );
}
