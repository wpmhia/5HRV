"use client";

import Link from "next/link";

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        The 5-Minute Method
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        A standardized clinical protocol for recording and interpreting short-term
        heart rate variability.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">Why five minutes?</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Twenty-four-hour Holter HRV captures circadian variation and remains
            necessary for several established prognostic applications. However, it
            is resource-intensive and often impractical for routine autonomic
            assessment.
          </p>
          <p>
            A standardized five-minute recording provides a pragmatic method for
            measuring RMSSD, short-term SDNN, pNN50, HF power, LF power and LF/HF
            spectral distribution.
          </p>
          <p className="rounded-lg bg-accent p-4 text-sm font-medium text-accent-foreground">
            Five-minute values and 24-hour values are not interchangeable.
            Reference ranges from 24-hour Holter monitoring must not be applied
            to short-term recordings.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">
          ECG as the reference method
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            ECG directly records cardiac electrical activity and identifies the R
            peak of the QRS complex, enabling precise RR-interval measurement.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Direct detection of cardiac electrical activity</li>
            <li>Precise RR-interval measurement</li>
            <li>Rhythm assessment and identification of ectopic beats</li>
            <li>Reliable artefact review</li>
            <li>Appropriate time resolution</li>
          </ul>
          <p className="font-medium text-foreground">
            ECG is the reference method for clinical five-minute HRV analysis.
          </p>
          <p>
            Validated ECG chest straps may also provide accurate RR intervals
            when the recording can be reviewed and artefacts are handled
            appropriately. PPG and wearable measurements may be useful for
            screening or exploratory applications, but require attention to
            motion, pulse-transit effects, device algorithms and artefact
            correction.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">
          Standardized recording protocol
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Position</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Supine</li>
              <li>Arms relaxed alongside the body</li>
              <li>Comfortable and motionless</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Rest</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Quiet rest before recording</li>
              <li>No conversation during the measurement</li>
              <li>Calm clinical environment</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Breathing</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Quiet spontaneous breathing</li>
              <li>Avoid deliberate deep breathing unless part of research protocol</li>
              <li>Record respiratory rate when frequency-domain interpretation is important</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Duration</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Approximately five minutes of analysable NN intervals</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Recording quality</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Sampling rate preferably at least 250 Hz</li>
              <li>Identify sinus rhythm</li>
              <li>Review ectopic beats</li>
              <li>Correct or exclude artefacts</li>
              <li>Do not apply standard sinus-rhythm HRV interpretation to AF, atrial flutter or paced ventricular rhythms</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Reproducibility</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comparisons require consistent position, time of day, rest period,
              breathing conditions, device, analysis software and
              artefact-correction method.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">Application</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Once a standardized recording has been obtained, the metrics can be
            entered into the calculator for age- and sex-stratified interpretation.
          </p>
          <Link
            href="/calculator"
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open the calculator
          </Link>
        </div>
      </section>
    </div>
  );
}
