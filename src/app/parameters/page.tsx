"use client";

export default function ParametersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          HRV Parameters
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
          A detailed guide to the heart rate variability metrics used in
          standardized five-minute assessment.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Time-domain analysis
        </h2>

        <p className="text-base leading-7 text-foreground/85">
          Time-domain measures quantify the magnitude of beat-to-beat variation
          directly from the NN-interval time series. They are computationally
          straightforward, well validated and the recommended primary approach
          for routine short-term HRV assessment.
        </p>

        <section className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold">RMSSD</h3>
          <p className="text-base leading-7 text-foreground/85">
            The root mean square of successive differences between consecutive
            NN intervals. RMSSD is the preferred primary parameter for
            short-term five-minute HRV assessment because it is strongly
            influenced by cardiac vagal modulation and is relatively robust to
            recording duration and respiratory effects. Values are expressed in
            milliseconds.
          </p>
          <p className="text-base leading-7 text-foreground/85">
            RMSSD is influenced by vagal modulation but is not a direct
            measurement of vagal nerve activity. It reflects the
            parasympathetic contribution to short-term heart rate regulation
            under standardized recording conditions.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold">SDNN</h3>
          <p className="text-base leading-7 text-foreground/85">
            The standard deviation of all NN intervals. SDNN reflects the total
            variability present during the analysed recording period. In
            five-minute recordings, SDNN describes short-term overall
            variability and incorporates both vagal and sympathetic influences.
          </p>
          <p className="text-base leading-7 text-foreground/85">
            Five-minute SDNN and 24-hour SDNN are not equivalent.
            Twenty-four-hour SDNN incorporates circadian and slower
            physiological components not captured in short recordings.
            Reference ranges must not be mixed between short-term and
            long-term recording durations.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold">pNN50</h3>
          <p className="text-base leading-7 text-foreground/85">
            The proportion of successive NN intervals that differ by more than
            50 milliseconds, expressed as a percentage. pNN50 is a
            vagal-related measure of successive NN-interval variation. It is
            strongly influenced by age and recording conditions. No validated
            age- and sex-specific percentile dataset is implemented for pNN50,
            so it serves as a supporting rather than primary metric in the 5HRV
            framework.
          </p>
        </section>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Frequency-domain analysis
        </h2>

        <p className="text-base leading-7 text-foreground/85">
          Frequency-domain analysis decomposes the NN-interval time series into
          its constituent frequency components. Spectral power within specific
          frequency bands provides information about the physiological
          mechanisms contributing to heart rate variability.
        </p>

        <section className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold">HF power (0.15&ndash;0.40 Hz)</h3>
          <p className="text-base leading-7 text-foreground/85">
            High-frequency power corresponds to respiratory-frequency
            variability and is influenced by cardiac vagal modulation and
            breathing. Values depend strongly on respiratory rate, depth and
            spectral methodology. No universal reference range is applied to HF
            power in the 5HRV calculator; descriptive interpretation is
            recommended.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold">LF power (0.04&ndash;0.15 Hz)</h3>
          <p className="text-base leading-7 text-foreground/85">
            Low-frequency power reflects mixed autonomic, vascular and
            baroreflex-related influences. LF power does not directly measure
            sympathetic activity and must not be interpreted as a pure
            sympathetic marker. Within the 5HRV framework, LF is described in
            conjunction with HF and the LF/HF ratio.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold">LF/HF ratio</h3>
          <p className="text-base leading-7 text-foreground/85">
            The ratio of low-frequency to high-frequency power describes the
            relative distribution of spectral power between the LF and HF
            bands. The LF/HF ratio is not a direct quantitative measurement of
            sympathetic&ndash;parasympathetic balance. Permitted descriptors in
            the 5HRV framework are: relative HF predominance, broadly comparable
            LF and HF power, relative LF predominance, and marked relative LF
            predominance.
          </p>
        </section>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Relationship between time- and frequency-domain measures
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Time-domain measures quantify how much beat-to-beat variation is
          present. Frequency-domain analysis describes where that variation
          occurs across frequency bands. RMSSD correlates strongly with HF
          power because both reflect rapid vagal-mediated variation. SDNN
          correlates with total spectral power. The two approaches provide
          complementary information.
        </p>
        <aside className="my-6 border-l-4 border-primary pl-4 text-sm leading-6 text-foreground/80">
          RMSSD is the most robust principal metric for routine short-term
          analysis. HF, LF and LF/HF require greater attention to breathing and
          analysis methodology and serve as supporting spectral measures.
        </aside>
        <p className="text-base leading-7 text-foreground/85">
          Very-low-frequency power (VLF, 0.003&ndash;0.04 Hz) is sometimes
          reported by analysis software, but a single five-minute recording
          contains too few slow oscillatory cycles for robust interpretation. It
          is therefore not included in the practical 5HRV calculator. Discussion
          of VLF is reserved for research contexts with longer recording
          durations.
        </p>
      </section>
    </div>
  );
}
