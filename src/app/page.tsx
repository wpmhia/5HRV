"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <section className="border-b border-border pb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          5HRV
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
          Five-minute heart rate variability as a measure of autonomic nervous
          system function.
        </p>
        <p className="mt-4 text-base leading-7 text-foreground/85">
          5HRV provides clinicians and researchers with a standardized method
          for recording, interpreting and applying short-term heart rate
          variability in clinical practice and research.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/calculator"
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open the calculator
          </Link>
          <Link
            href="/method"
            className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Read the method &rarr;
          </Link>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Introduction</h2>
        <p className="text-base leading-7 text-foreground/85">
          Heart rate variability is the variation in time between successive
          normal heartbeats. A healthy cardiovascular system does not behave
          like a rigid metronome. Beat-to-beat variation reflects the capacity
          of the autonomic nervous system to adapt continuously to internal and
          external demands. HRV does not measure heart rate itself; two
          individuals with the same average heart rate may have profoundly
          different HRV profiles, and HRV can change independently of heart
          rate.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Physiological basis of HRV
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          The autonomic nervous system regulates cardiovascular function through
          two principal branches. Sympathetic activity supports cardiovascular
          activation through effects including increased sinus-node rate and
          myocardial contractility. Parasympathetic (vagal) activity slows the
          sinus node and contributes strongly to rapid beat-to-beat variation.
          A healthy autonomic nervous system maintains a dynamic balance between
          these two branches, allowing the heart to respond rapidly to changing
          demands.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          Five-minute HRV provides a non-invasive window into this regulatory
          system. RMSSD, the principal time-domain measure, is strongly
          influenced by cardiac vagal modulation. SDNN reflects the overall
          variability present during the recording period. Spectral analysis
          further decomposes variability into frequency components that provide
          additional physiological information.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Rationale for a five-minute recording
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Twenty-four-hour Holter HRV captures circadian variation and remains
          necessary for several established prognostic applications. However, it
          is resource-intensive and often impractical for routine autonomic
          assessment. A standardized five-minute recording provides a pragmatic
          method for measuring RMSSD, short-term SDNN, pNN50, HF power, LF
          power and the LF/HF spectral distribution under controlled conditions.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          Five-minute and 24-hour HRV values are not interchangeable. Reference
          ranges from 24-hour Holter monitoring must not be applied to
          short-term recordings.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Principal time-domain and frequency-domain measures
        </h2>

        <h3 className="mt-8 text-lg font-semibold">Time-domain measures</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm leading-6">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium">Parameter</th>
                <th className="py-2 pr-4 text-left font-medium">Principal interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 pr-4 align-top font-mono text-xs">RMSSD</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Short-term variability strongly influenced by vagal modulation
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-mono text-xs">SDNN</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Total variability during the five-minute recording
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-mono text-xs">pNN50</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Supporting measure of successive NN-interval variation
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 text-lg font-semibold">Frequency-domain measures</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm leading-6">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium">Parameter</th>
                <th className="py-2 pr-4 text-left font-medium">Principal interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 pr-4 align-top font-mono text-xs">HF</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Respiratory-frequency variability influenced by vagal modulation and breathing
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-mono text-xs">LF</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Mixed autonomic and baroreflex-related variability
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-mono text-xs">LF/HF</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Relative distribution of LF and HF power
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Standardized recording conditions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm leading-6">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium">Element</th>
                <th className="py-2 pr-4 text-left font-medium">Standardized condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 pr-4 font-medium">Position</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Supine, arms relaxed
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Rest</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Quiet rest before recording; no talking
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Breathing</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Quiet spontaneous breathing
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Duration</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Approximately five analysable minutes
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Signal</td>
                <td className="py-2 pr-4 text-foreground/85">
                  ECG preferred; adequate sampling frequency
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Quality</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Sinus rhythm, ectopy review and artefact correction
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Clinical and research applications
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Standardized five-minute HRV recording may be used to characterize
          autonomic function in a range of clinical contexts, including
          suspected autonomic dysfunction, orthostatic intolerance syndromes
          such as POTS, post-acute infection syndromes including ME/CFS and
          Long COVID, and as an outcome measure in interventional research.
          HRV parameters alone do not establish a diagnosis of any of these
          disorders and must be interpreted within the full clinical picture.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Scope and limitations
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          The 5HRV framework provides age- and sex-stratified interpretation of
          short-term HRV using reference percentiles from the DanFunD
          population study. The method is not diagnostic for any condition.
          Interpretation requires integration of clinical context, rhythm
          assessment, medication effects and recording conditions. The
          calculator is an educational and research tool, not a certified
          medical device.
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-12">
        <Link
          href="/calculator"
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Open the calculator
        </Link>
      </section>
    </div>
  );
}
