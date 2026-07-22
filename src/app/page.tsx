"use client";

import Link from "next/link";

function Section({ id, className = "", children, ...props }: React.ComponentPropsWithoutRef<"section"> & { id?: string }) {
  return (
    <section id={id} className={`border-b border-border ${className}`} {...props}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">{children}</div>
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-card p-6 shadow-sm ring-1 ring-border/50 ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-background">
      {/* Section 1 – Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              5HRV
            </h1>
            <p className="mt-4 text-lg text-[#286d6d] sm:text-xl">
              Five-minute heart rate variability as a measure of autonomic nervous system function.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              5HRV provides clinicians and researchers with a standardized method for recording,
              interpreting and applying short-term heart rate variability in clinical practice and
              research.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/calculator"
                className="inline-flex items-center rounded-lg bg-[#286d6d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f5555] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286d6d]"
              >
                Open the calculator
              </Link>
              <Link
                href="/method"
                className="inline-flex items-center rounded-lg border border-[#286d6d] px-6 py-3 text-sm font-semibold text-[#286d6d] transition hover:bg-[#e8f4f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286d6d]"
              >
                Learn the method
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 – What 5HRV measures */}
      <Section className="bg-card/50">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          What 5HRV measures
        </h2>
        <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            Heart rate variability is the variation in time between successive normal heartbeats. A
            healthy cardiovascular system does not behave like a rigid metronome. Beat-to-beat
            variation reflects the capacity of the autonomic nervous system to adapt continuously to
            internal and external demands.
          </p>
          <p>
            HRV does <em className="font-semibold text-foreground">not</em> measure heart rate
            itself. Two individuals with the same average heart rate may have profoundly different
            HRV profiles, and HRV can change independently of heart rate.
          </p>
        </div>
      </Section>

      {/* Section 3 – Autonomic nervous system */}
      <Section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          The autonomic nervous system
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Card>
            <h3 className="text-xl font-semibold text-foreground">Sympathetic activity</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Supports cardiovascular activation through effects including increased sinus-node rate
              and myocardial contractility.
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold text-foreground">Parasympathetic activity</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Cardiac vagal activity slows the sinus node and contributes strongly to rapid
              beat-to-beat variation.
            </p>
          </Card>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Think of the two branches as an accelerator and a brake. A healthy autonomic nervous
          system maintains a dynamic balance between them, allowing the heart to respond rapidly to
          changing demands.
        </p>
      </Section>

      {/* Section 4 – Why HRV matters */}
      <Section className="bg-card/50">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Why HRV matters
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Card>
            <h3 className="text-lg font-semibold text-foreground">Autonomic assessment</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Provides an objective, non-invasive measure related to autonomic regulation.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-foreground">Clinical stratification</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Reduced HRV has been associated with adverse outcomes in several clinical populations,
              although five-minute HRV must not be substituted for validated 24-hour risk models.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-foreground">Monitoring and research</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Allows autonomic function to be evaluated before and after an intervention or across
              research cohorts when measurements are standardized.
            </p>
          </Card>
        </div>
      </Section>

      {/* Section 5 – Why five minutes */}
      <Section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Why five minutes?
        </h2>
        <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            Twenty-four-hour Holter HRV captures circadian variation and remains necessary for
            several established prognostic applications. However, it is resource-intensive and often
            impractical for routine autonomic assessment.
          </p>
          <p>
            A standardized five-minute recording provides a pragmatic method for measuring RMSSD,
            short-term SDNN, pNN50, HF power, LF power and LF/HF spectral distribution.
          </p>
        </div>
      </Section>

      {/* Section 6 – The standardized protocol */}
      <Section className="bg-card/50">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          The standardized protocol
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              Position
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Supine, arms relaxed</p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">Rest</h3>
            <p className="mt-1 text-sm text-muted-foreground">Quiet rest, no talking</p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              Breathing
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Quiet spontaneous</p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              Duration
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Approx. 5 minutes</p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              Quality
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              ECG preferred, &ge;250 Hz, sinus rhythm, artefact correction
            </p>
          </Card>
        </div>
        <div className="mt-6">
          <Link
            href="/method"
            className="inline-flex items-center text-sm font-semibold text-[#286d6d] underline-offset-4 hover:underline"
          >
            Read the full method &rarr;
          </Link>
        </div>
      </Section>

      {/* Section 7 – HRV parameters */}
      <Section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          HRV parameters
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              RMSSD
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Root mean square of successive differences &mdash; reflects parasympathetic activity.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">SDNN</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Standard deviation of all NN intervals &mdash; reflects overall variability.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">pNN50</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Proportion of NN intervals differing by more than 50 ms &mdash; vagal tone index.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              HF power
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              High-frequency power (0.15&ndash;0.40 Hz) &mdash; primarily reflects vagal activity.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              LF power
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Low-frequency power (0.04&ndash;0.15 Hz) &mdash; reflects both sympathetic and vagal
              influences.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#286d6d]">
              LF/HF ratio
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ratio of low- to high-frequency power &mdash; describes the relative distribution
              of spectral power; not a direct measurement of autonomic balance.
            </p>
          </Card>
        </div>
        <div className="mt-6">
          <Link
            href="/parameters"
            className="inline-flex items-center text-sm font-semibold text-[#286d6d] underline-offset-4 hover:underline"
          >
            Detailed parameter guide &rarr;
          </Link>
        </div>
      </Section>

      {/* Section 8 – Clinical interpretation */}
      <Section className="bg-card/50">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Clinical interpretation
        </h2>
        <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            Interpretation uses age- and sex-stratified reference percentiles from the DanFunD
            population study, providing a normative framework for clinical decision-making.
          </p>
          <p>
            Several patterns may be identified: combined reduction in rapid beat-to-beat and overall
            short-term variability, reduced vagal-related variability with better-preserved overall
            variability, or isolated changes in spectral parameters.
          </p>
        </div>
        <div className="mt-6">
          <Link
            href="/interpretation"
            className="inline-flex items-center text-sm font-semibold text-[#286d6d] underline-offset-4 hover:underline"
          >
            Interpretation guide &rarr;
          </Link>
        </div>
      </Section>

      {/* Section 9 – Clinical applications */}
      <Section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Clinical applications
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold text-foreground">Autonomic dysfunction</h3>
            <p className="text-sm text-muted-foreground">
              Screening and monitoring of autonomic impairment in neurologic and systemic disorders.
            </p>
          </Card>
          <Card className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold text-foreground">
              POTS and orthostatic intolerance
            </h3>
            <p className="text-sm text-muted-foreground">
              Assessment of autonomic regulation patterns in postural tachycardia syndrome.
            </p>
          </Card>
          <Card className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold text-foreground">
              PAIS / ME / CFS / Long COVID
            </h3>
            <p className="text-sm text-muted-foreground">
              Evaluation of autonomic dysregulation in post-acute infection syndromes and chronic
              fatigue conditions.
            </p>
          </Card>
          <Card className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold text-foreground">Research applications</h3>
            <p className="text-sm text-muted-foreground">
              Standardized autonomic outcome measurement in clinical trials and observational
              studies.
            </p>
          </Card>
        </div>
        <div className="mt-6">
          <Link
            href="/applications"
            className="inline-flex items-center text-sm font-semibold text-[#286d6d] underline-offset-4 hover:underline"
          >
            Clinical applications &rarr;
          </Link>
        </div>
      </Section>

      {/* Section 10 – Calculator preview */}
      <Section className="bg-card/50">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Apply the method
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Enter a standardized five-minute HRV recording and receive a structured interpretation
            with age- and sex-specific reference percentiles.
          </p>
          <div className="mt-8">
            <Link
              href="/calculator"
              className="inline-flex items-center rounded-lg bg-[#286d6d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f5555] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286d6d]"
            >
              Open the calculator
            </Link>
          </div>
        </div>
      </Section>

      {/* Section 11 – About */}
      <Section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          About the 5HRV method
        </h2>
        <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            The 5HRV framework was developed by Willem Gielen, Cardiologist and Internist, as a
            practical approach to standardized five-minute HRV assessment in clinical practice and
            research.
          </p>
        </div>
        <div className="mt-6">
          <Link
            href="/about"
            className="inline-flex items-center text-sm font-semibold text-[#286d6d] underline-offset-4 hover:underline"
          >
            About &rarr;
          </Link>
        </div>
      </Section>
    </div>
  );
}
