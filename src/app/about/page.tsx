"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        About the 5HRV method
      </h1>
      <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
        The clinical and scientific background of the five-minute HRV framework.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Development of the 5HRV framework
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          The 5HRV framework was developed by Willem Gielen, Cardiologist and
          Internist, as a practical approach to standardized five-minute HRV
          assessment in clinical practice and research. It is derived from the
          five-minute HRV teaching presentation and is intended for physicians,
          clinical researchers, autonomic clinics, cardiologists, internists,
          neurologists, rehabilitation physicians and allied health
          professionals working with autonomic dysfunction.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Intended use</h2>
        <p className="text-base leading-7 text-foreground/85">
          5HRV is an educational and research-oriented tool for clinicians and
          researchers who wish to apply standardized short-term HRV measurement
          in their practice. It provides contextual interpretation of heart rate
          variability measurements using age- and sex-specific reference
          percentiles. It is not a certified medical device and does not provide
          treatment advice.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Components of the method
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          The 5HRV method integrates a standardized recording protocol,
          ECG-based RR-interval analysis, time-domain HRV (RMSSD, SDNN, pNN50),
          frequency-domain HRV (HF, LF, LF/HF), age- and sex-specific reference
          interpretation using the DanFunD population percentiles, and clinical
          context integration.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Scope and clinical boundaries
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          5HRV provides contextual interpretation of heart rate variability
          measurements. It does not diagnose autonomic disorders, POTS,
          cardiovascular disease, ME/CFS, Long COVID or any other condition.
          Results must be interpreted together with symptoms, examination
          findings and other clinical data. POTS and other orthostatic disorders
          require dedicated supine and upright heart-rate and blood-pressure
          measurements; resting five-minute HRV alone cannot establish the
          diagnosis.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          This application is an educational and research-oriented tool. It is
          not a certified medical device. It does not provide treatment advice
          and must not delay or replace appropriate medical care.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Data processing and privacy
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          All calculations run locally in the browser. Entered values are
          processed locally and are not transmitted to a server. They are
          temporarily retained in this browser tab so the result page can be
          displayed. Do not enter names, identification numbers, exact dates of
          birth or other directly identifiable patient information.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Authorship</h2>
        <p className="text-base leading-7 text-foreground/85">
          Willem Gielen, Cardiologist and Internist. Reference implementation
          and explanatory framework adapted from the five-minute HRV teaching
          presentation.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">References</h2>
        <ol className="list-decimal pl-6 space-y-3 text-sm leading-6 text-foreground/85">
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
            sympatho-vagal balance. <em>Frontiers in Physiology</em>.
            2013;4:26.
          </li>
        </ol>
        <div className="mt-6">
          <Link
            href="/evidence"
            className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Full evidence page &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
