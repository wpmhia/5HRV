"use client";

export default function ParametersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          HRV Parameters
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          A detailed guide to the heart rate variability metrics used in
          standardized five-minute assessment.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
          Time-domain parameters
        </h2>

        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            RMSSD (Root Mean Square of Successive Differences)
          </h3>
          <p className="mb-3 text-foreground">
            Short-term beat-to-beat variability strongly influenced by cardiac
            vagal modulation. RMSSD is the preferred primary parameter for
            short-term five-minute HRV assessment.
          </p>
          <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
            RMSSD is influenced by vagal modulation but is not a direct
            measurement of vagal nerve activity.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            SDNN (Standard Deviation of Normal-to-Normal Intervals)
          </h3>
          <p className="mb-3 text-foreground">
            SDNN reflects the total variability present during the analysed
            recording period.
          </p>
          <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
            Five-minute SDNN describes short-term overall variability.
            Twenty-four-hour SDNN incorporates circadian and slower
            physiological components. Five-minute and 24-hour SDNN reference
            ranges must not be mixed.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            pNN50
          </h3>
          <p className="text-foreground">
            A vagal-related measure of successive NN-interval variation,
            strongly influenced by age and recording conditions.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
          Frequency-domain parameters
        </h2>

        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            HF power (0.15–0.40 Hz)
          </h3>
          <p className="text-foreground">
            Respiratory-frequency variability influenced by cardiac vagal
            modulation and breathing. Values depend strongly on respiratory
            rate, depth and spectral methodology.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            LF power (0.04–0.15 Hz)
          </h3>
          <p className="text-foreground">
            LF power reflects mixed autonomic, vascular and baroreflex-related
            influences. LF must not be described as a pure sympathetic marker.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            VLF power (0.003–0.04 Hz)
          </h3>
          <p className="text-foreground">
            VLF reflects slower physiological oscillations but is not reliably
            characterized by every short five-minute recording.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-xl font-semibold text-foreground">
            LF/HF ratio
          </h3>
          <p className="mb-3 text-foreground">
            LF/HF describes the relative distribution of spectral power between
            the LF and HF bands.
          </p>
          <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
            LF/HF is not a direct quantitative measurement of
            sympathetic–parasympathetic balance.
          </p>
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Permitted descriptors
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Relative HF predominance</li>
              <li>Broadly comparable LF and HF power</li>
              <li>Relative LF predominance</li>
              <li>Marked relative LF predominance</li>
            </ul>
          </div>
          <p className="mt-3 rounded-md bg-accent p-3 text-sm text-accent-foreground">
            The ratio must not be used to claim sympathetic overactivity.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
          Time domain versus frequency domain
        </h2>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-3 text-foreground">
            Time-domain measures quantify how much beat-to-beat variation is
            present. Frequency-domain analysis describes where that variation
            occurs across frequency bands.
          </p>
          <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
            RMSSD is the most robust principal metric for routine short-term
            analysis. HF, LF and LF/HF require greater attention to breathing
            and analysis methodology.
          </p>
        </div>
      </section>
    </div>
  );
}
