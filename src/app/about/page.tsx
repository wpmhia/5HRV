"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        About the 5HRV method
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        The clinical and scientific background of the five-minute HRV framework.
      </p>

      <section className="mt-12 space-y-6 text-base leading-relaxed text-muted-foreground">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">Clinical background</h2>
          <p className="mt-3">
            The 5HRV framework was developed by Willem Gielen, Cardiologist and
            Internist, as a practical approach to standardized five-minute HRV
            assessment in clinical practice and research. It is intended for
            physicians, clinical researchers, autonomic clinics, cardiologists,
            internists, neurologists, rehabilitation physicians and allied health
            professionals working with autonomic dysfunction.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">What the method combines</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Standardized recording protocol</li>
            <li>ECG-based RR-interval analysis</li>
            <li>Time-domain HRV (RMSSD, SDNN, pNN50)</li>
            <li>Frequency-domain HRV (HF, LF, LF/HF)</li>
            <li>Age- and sex-specific reference interpretation</li>
            <li>Clinical context integration</li>
            <li>Application in autonomic and post-acute infection research</li>
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">Clinical boundaries</h2>
          <p className="mt-3">
            5HRV provides contextual interpretation of heart rate variability
            measurements. It does not diagnose autonomic disorders, POTS,
            cardiovascular disease, ME/CFS, Long COVID or any other condition.
            Results must be interpreted together with symptoms, examination
            findings and other clinical data.
          </p>
          <p className="mt-3">
            POTS and other orthostatic disorders require dedicated supine and
            upright heart-rate and blood-pressure measurements. Resting five-minute
            HRV alone cannot establish the diagnosis.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">Privacy</h2>
          <p className="mt-3">
            The calculator runs entirely in the browser. Entered values are not
            transmitted, stored or shared. Do not enter names, identification
            numbers, exact dates of birth or other directly identifiable patient
            information.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">Disclaimer</h2>
          <p className="mt-3">
            5HRV provides contextual information about heart rate variability
            measurements. It does not diagnose autonomic disorders, POTS,
            cardiovascular disease, ME/CFS, Long COVID, or any other condition.
            Results must be interpreted together with symptoms, examination
            findings and other clinical data.
          </p>
          <p className="mt-3">
            This application is an educational and research-oriented tool. It is
            not a certified medical device. It does not provide treatment advice
            and must not delay or replace appropriate medical care.
          </p>
        </div>
      </section>

      <section className="mt-12 rounded-lg bg-accent p-6">
        <h2 className="text-xl font-semibold text-accent-foreground">References</h2>
        <ol className="mt-4 list-decimal pl-6 space-y-2 text-sm text-accent-foreground/90">
          <li>
            Task Force of the European Society of Cardiology and the North
            American Society of Pacing and Electrophysiology. Heart rate
            variability: standards of measurement, physiological interpretation
            and clinical use. <em>Circulation</em>. 1996;93:1043&ndash;1065.
          </li>
          <li>
            Brinth LS, J&oslash;rgensen T, Mehlsen J, et al. Normative values of
            short-term heart rate variability in a cross-sectional study of a
            Danish population: the DanFunD study. <em>Scandinavian Journal of
            Public Health</em>. 2024;52:48&ndash;57.
          </li>
          <li>
            Billman GE. The LF/HF ratio does not accurately measure cardiac
            sympatho-vagal balance. <em>Frontiers in Physiology</em>. 2013;4:26.
          </li>
        </ol>
        <p className="mt-4 text-sm text-accent-foreground/80">
          Reference implementation and explanatory framework adapted from the
          five-minute HRV teaching material of Willem Gielen, Cardiologist and
          Internist.
        </p>
      </section>

      <div className="mt-8">
        <Link
          href="/evidence"
          className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Full evidence page &rarr;
        </Link>
      </div>
    </div>
  );
}
