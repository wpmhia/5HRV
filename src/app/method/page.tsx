import type { Metadata } from "next";
import Link from "next/link";
import { pages } from "@/lib/seo";

export const metadata: Metadata = {
  title: pages.method.title,
  description: pages.method.description,
};

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        The 5-Minute Method
      </h1>
      <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
        A standardized clinical protocol for recording and interpreting short-term
        heart rate variability.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Rationale for five-minute HRV
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Twenty-four-hour Holter HRV captures circadian variation and remains
          necessary for several established prognostic applications. However, it
          is resource-intensive and often impractical for routine autonomic
          assessment. A standardized five-minute recording provides a pragmatic
          method for measuring RMSSD, short-term SDNN, pNN50, HF power, LF power
          and the LF/HF spectral distribution.
        </p>
        <aside className="my-6 border-l-4 border-primary pl-4 text-sm leading-6 text-foreground/80">
          Five-minute values and 24-hour values are not interchangeable.
          Reference ranges from 24-hour Holter monitoring must not be applied
          to short-term recordings.
        </aside>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          ECG and RR-interval acquisition
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          ECG directly records cardiac electrical activity and identifies the R
          peak of the QRS complex, enabling precise RR-interval measurement. ECG
          is the reference method for clinical five-minute HRV analysis.
        </p>
        <ul className="list-disc pl-6 space-y-1 text-base leading-7 text-foreground/85">
          <li>Direct detection of cardiac electrical activity</li>
          <li>Precise RR-interval measurement</li>
          <li>Rhythm assessment and identification of ectopic beats</li>
          <li>Reliable artefact review</li>
          <li>Appropriate time resolution</li>
        </ul>
        <p className="text-base leading-7 text-foreground/85">
          Validated ECG chest straps may also provide accurate RR intervals
          when the recording can be reviewed and artefacts are handled
          appropriately. Photoplethysmography and wearable measurements may be
          useful for screening or exploratory applications, but require
          attention to motion, pulse-transit effects, device algorithms and
          artefact correction.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Conversion from RR to NN intervals
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          HRV analysis begins with the detection of each heart beat from the
          ECG signal. The time between consecutive R peaks is the RR interval.
          However, not every RR interval represents normal sinus-node
          activation. Ectopic beats, atrial or ventricular premature complexes,
          and artefact from motion or electrode disturbance produce spurious
          intervals that must be identified and handled.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          <em className="font-semibold text-foreground">RR interval:</em> the
          time between any two consecutive R peaks.{" "}
          <em className="font-semibold text-foreground">NN interval:</em> an RR
          interval that follows a normal sinus beat, retained after exclusion or
          correction of ectopic beats, arrhythmia-related intervals and
          artefacts. All standard HRV metrics&mdash;RMSSD, SDNN, pNN50, HF and
          LF power&mdash;are computed from the NN-interval time series.
        </p>
        <aside className="my-6 border-l-4 border-primary pl-4 text-sm leading-6 text-foreground/80">
          Failing to distinguish RR from NN intervals is a common source of
          error in HRV interpretation. Devices and software differ in how they
          label their output, and the user must verify whether ectopic and
          artefact filtering has been applied.
        </aside>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Artefact and ectopic-beat handling
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Artefact and ectopic beats must be identified beforeHRV computation.
          Common approaches include exclusion of non-sinus beats,
          interpolation of corrected intervals, and threshold-based artefact
          rejection. The method and threshold applied should be documented
          because artefact handling can significantly influence HRV values,
          particularly RMSSD and pNN50.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Standardized recording protocol
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
                <td className="py-2 pr-4 align-top font-medium">Position</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Supine, arms relaxed alongside the body, comfortable and motionless
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-medium">Rest</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Quiet rest before recording; no conversation during measurement
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-medium">Breathing</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Quiet spontaneous breathing; avoid deliberate deep breathing
                  unless part of research protocol
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-medium">Duration</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Approximately five minutes of analysable NN intervals
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-medium">Sampling rate</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Preferably at least 250 Hz
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-medium">Rhythm</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Sinus rhythm required; do not apply standard HRV interpretation
                  to atrial fibrillation, atrial flutter or paced ventricular rhythms
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-medium">Quality control</td>
                <td className="py-2 pr-4 text-foreground/85">
                  Review ectopic beats; correct or exclude artefacts
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Time-domain analysis
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Time-domain measures quantify the magnitude of beat-to-beat variation
          directly from the NN-interval time series. The principal parameters
          are RMSSD, SDNN and pNN50. RMSSD is the preferred primary parameter
          for short-term five-minute HRV assessment because it is strongly
          influenced by vagal modulation and is relatively robust to recording
          duration.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Frequency-domain analysis
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          After resampling and detrending of the NN-interval time series, the
          power spectrum is computed using fast Fourier transformation or
          autoregressive modelling. The HF band (0.15&ndash;0.40 Hz) reflects
          respiratory-frequency variability influenced by vagal modulation. The
          LF band (0.04&ndash;0.15 Hz) contains mixed autonomic and
          baroreflex-related influences. The LF/HF ratio describes the relative
          distribution of power between the two bands.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          Very-low-frequency power (VLF, 0.003&ndash;0.04 Hz) is sometimes
          reported by analysis software, but a single five-minute recording
          contains too few slow oscillatory cycles for robust characterization.
          VLF is therefore not included in the practical 5HRV parameter set.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Reproducibility and reporting
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Comparisons between recordings require consistent position, time of
          day, rest period, breathing conditions, device, analysis software and
          artefact-correction method. The 5HRV calculator applies the following
          six-measurement set: RMSSD, SDNN, pNN50, HF power, LF power and LF/HF
          ratio.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Practical application</h2>
        <p className="text-base leading-7 text-foreground/85">
          Once a standardized recording has been obtained, the metrics can be
          entered into the calculator for age- and sex-stratified interpretation.
        </p>
        <Link
          href="/calculator"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Open the calculator
        </Link>
      </section>
    </div>
  );
}
