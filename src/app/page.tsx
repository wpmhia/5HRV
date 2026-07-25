import type { Metadata } from "next";
import Link from "next/link";
import { pages } from "@/lib/seo";

export const metadata: Metadata = {
  title: pages.home.title,
  description: pages.home.description,
};

function FeatureCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function ValueItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="text-sm leading-relaxed text-foreground/85">{children}</span>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Five-minute HRV for clinicians and researchers
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Interpret five-minute HRV with clinical context.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                5HRV converts standardized short-term HRV measurements into a
                structured interpretation of parasympathetic activity, total
                variability and autonomic direction.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/calculator"
                  className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                >
                  Open the calculator
                </Link>
                <Link
                  href="/method"
                  className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Explore the method
                </Link>
              </div>
            </div>
            {/* Result preview — right side on large screens */}
            <div className="hidden rounded-xl border border-border bg-card p-5 shadow-sm lg:block">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">5HRV Autonomic Score</span>
                  <span className="text-sm font-semibold text-foreground">+10</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted">
                  <div
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                    style={{ left: "55%" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Parasympathetic</span>
                  <span>Sympathetic</span>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-center text-xs">
                  <div>
                    <p className="font-semibold text-foreground">30.40 ms</p>
                    <p className="text-muted-foreground">RMSSD</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">47.63 ms</p>
                    <p className="text-muted-foreground">SDNN</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">3.28</p>
                    <p className="text-muted-foreground">LF/HF</p>
                  </div>
                </div>
                <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                  Time domain: SDNN 47.63 ms, RMSSD 30.40 ms; frequency domain:
                  HF 125.95 ms&sup2;, LF 400 ms&sup2;, LF/HF 3.28. The pattern
                  shows preserved total variability and preserved parasympathetic
                  activity with relative sympathetic predominance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ValueItem>Five-minute standardized protocol</ValueItem>
            <ValueItem>Age- and sex-specific reference percentiles</ValueItem>
            <ValueItem>Structured research-based analysis</ValueItem>
            <ValueItem>Runs locally in the browser &mdash; no data transmitted</ValueItem>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            HRV reports provide numbers. Clinical interpretation requires context.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Exported HRV reports often contain RMSSD, SDNN, pNN50, HF and LF
            without a coherent interpretation. Values depend on age, sex,
            recording duration, rhythm, breathing and artefact handling.
            5HRV applies a defined framework to turn those measurements into a
            structured, clinically readable report.
          </p>
        </div>
      </section>

      {/* WHAT 5HRV DOES */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            What 5HRV does
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <FeatureCard title="Standardizes">
              Applies a defined five-minute recording and analysis framework.
            </FeatureCard>
            <FeatureCard title="Interprets">
              Places RMSSD and SDNN within age- and sex-specific reference
              distributions from the DanFunD population study.
            </FeatureCard>
            <FeatureCard title="Summarizes">
              Produces a concise scientific summary and structured report that
              can be copied or printed.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Record",
                text: "Obtain a standardized five-minute HRV measurement using ECG or a validated device.",
              },
              {
                step: "2",
                title: "Enter",
                text: "Add RMSSD, SDNN, pNN50, HF and LF, or upload a compatible report to auto-fill.",
              },
              {
                step: "3",
                title: "Interpret",
                text: "Review the autonomic score, reference-based metric placement and scientific analysis.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REPORT PREVIEW */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">5HRV Autonomic Score</span>
                    <span className="text-sm font-semibold text-foreground">+10</span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-blue-400 via-neutral-200 to-orange-400">
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-foreground shadow-sm"
                      style={{ left: "55%" }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Parasympathetic predominance</span>
                    <span>Sympathetic predominance</span>
                  </div>
                  <div className="grid grid-cols-6 gap-3 border-t border-border pt-5 text-center text-xs">
                    <div>
                      <p className="font-semibold text-foreground">30.40</p>
                      <p className="text-muted-foreground">RMSSD</p>
                      <p className="text-[10px] text-muted-foreground/70">ms</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">47.63</p>
                      <p className="text-muted-foreground">SDNN</p>
                      <p className="text-[10px] text-muted-foreground/70">ms</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">3.3</p>
                      <p className="text-muted-foreground">pNN50</p>
                      <p className="text-[10px] text-muted-foreground/70">%</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">126</p>
                      <p className="text-muted-foreground">HF</p>
                      <p className="text-[10px] text-muted-foreground/70">ms&sup2;</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">400</p>
                      <p className="text-muted-foreground">LF</p>
                      <p className="text-[10px] text-muted-foreground/70">ms&sup2;</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">3.28</p>
                      <p className="text-muted-foreground">LF/HF</p>
                      <p className="text-[10px] text-muted-foreground/70"></p>
                    </div>
                  </div>
                  <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                    Time domain: SDNN 47.63 ms, RMSSD 30.40 ms, pNN50 3.3%;
                    frequency domain: HF 125.95 ms&sup2;, LF 400 ms&sup2;, LF/HF
                    3.28. The pattern shows preserved total variability and
                    preserved parasympathetic activity with relative sympathetic
                    predominance.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                A result designed to be read, copied and printed as a clinical report.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Every interpretation includes an autonomic score, individual
                metric placement with percentile categories, and a clinical
                summary paragraph&mdash;all derived from the same underlying
                framework.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SCIENTIFIC FOUNDATION */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Built on established HRV methodology
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            5HRV combines international HRV measurement standards with age- and
            sex-stratified short-term reference data from the DanFunD population
            study. The framework distinguishes robust time-domain
            measures&mdash;RMSSD as the principal short-term vagal-related
            measure, SDNN as total five-minute variability&mdash;from more
            method-sensitive spectral parameters (HF and LF). LF/HF is a
            calculated descriptive ratio, not a direct measurement of autonomic
            balance. Standardized recording conditions are essential for
            reproducible interpretation.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/method"
              className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Read the method &rarr;
            </Link>
            <Link
              href="/evidence"
              className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Review the evidence &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* PROFESSIONAL APPLICATIONS */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Professional applications
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { title: "Autonomic assessment", text: "Non-invasive characterization of autonomic function in clinical practice." },
              { title: "Orthostatic and post-acute infection research", text: "Standardized HRV measurement in POTS, ME/CFS and Long COVID research protocols." },
              { title: "Longitudinal monitoring", text: "Repeatable short-term recordings to track changes over time under consistent conditions." },
              { title: "Clinical and observational studies", text: "Reproducible autonomic outcome measurement suitable for interventional and cohort studies." },
            ].map((item) => (
              <FeatureCard key={item.title} title={item.title}>
                {item.text}
              </FeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY AND PRACTICAL USE */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Designed for practical use
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            All calculations run in the browser. Entered values are not stored
            by the calculator and no patient identifiers are required. Results
            can be copied or printed directly from the report page.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-card/50">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Turn five-minute HRV values into a structured interpretation.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/calculator"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              Open the 5HRV calculator
            </Link>
            <Link
              href="/method"
              className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Read the methodology
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
