import type { Metadata } from "next";
import Link from "next/link";
import { hrvReferenceData, ageBands } from "@/data/hrvReferenceData";
import { pages } from "@/lib/seo";

export const metadata: Metadata = {
  title: pages.interpretation.title,
  description: pages.interpretation.description,
};

const percentiles = ["P5", "P25", "P50", "P75", "P95"] as const;

function ReferenceTable({
  metric,
  title,
}: {
  metric: "rmssd" | "sdnn";
  title: string;
}) {
  return (
    <div className="my-6 overflow-x-auto">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
      <table className="w-full text-sm leading-6">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-3 text-left font-medium">Age band</th>
            {percentiles.map((p) => (
              <th key={p} className="py-2 px-1 text-right font-medium tabular-nums">
                F {p}
              </th>
            ))}
            {percentiles.map((p) => (
              <th key={p} className="py-2 px-1 text-right font-medium tabular-nums">
                M {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ageBands.map((band) => {
            const female = hrvReferenceData.female[band][metric];
            const male = hrvReferenceData.male[band][metric];
            return (
              <tr key={band}>
                <td className="py-1.5 pr-3 font-medium">{band}</td>
                {female.map((v, i) => (
                  <td key={`f-${i}`} className="py-1.5 px-1 text-right tabular-nums text-foreground/85">
                    {v.toFixed(2)}
                  </td>
                ))}
                {male.map((v, i) => (
                  <td key={`m-${i}`} className="py-1.5 px-1 text-right tabular-nums text-foreground/85">
                    {v.toFixed(2)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function InterpretationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">
          Clinical Interpretation
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
          A structured framework for interpreting short-term HRV measurements.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Principles of interpretation
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          HRV must be interpreted in the context of the individual and the
          recording. Factors that should be considered include age, reference
          sex, recording method, body position, heart rate, rhythm, artefacts,
          breathing pattern, medication and clinical presentation.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Age- and sex-specific reference distributions
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          HRV generally decreases with age and differs between male and female
          reference populations. The DanFunD study, based on 6,891 Danish adults
          aged 18&ndash;72 years, provides age- and sex-specific RMSSD and SDNN
          reference percentiles for short-term recordings. These are population
          reference distributions, not disease thresholds.
        </p>

        <ReferenceTable metric="rmssd" title="RMSSD reference percentiles (ms)" />
        <ReferenceTable metric="sdnn" title="SDNN reference percentiles (ms)" />

        <p className="text-sm leading-6 text-muted-foreground">
          For HF, LF and LF/HF, cautious descriptive interpretation is
          recommended because spectral values are especially sensitive to
          breathing and analysis methodology. See the{" "}
          <Link
            href="/evidence"
            className="text-primary underline-offset-4 hover:underline"
          >
            Evidence page
          </Link>{" "}
          for the full citation and supporting references.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Interpretation of RMSSD
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          RMSSD is the primary metric for short-term vagal-related assessment.
          Its interpretation is based on the age- and sex-specific percentile
          category: values below the 5th percentile are classified as markedly
          reduced; values between the 5th and 25th percentile as reduced; values
          between the 25th and 75th percentile as preserved; values between the
          75th and 95th percentile as high; and values above the 95th percentile
          as very high.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Interpretation of SDNN
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          SDNN reflects total short-term variability. The same percentile
          classification is applied: markedly reduced, reduced, within the
          expected range, high or very high, based on the DanFunD reference
          distribution.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Combined time-domain patterns
        </h2>

        <h3 className="text-lg font-semibold">Reduced RMSSD</h3>
        <p className="text-base leading-7 text-foreground/85">
          Reduced short-term beat-to-beat variability relative to the age- and
          sex-specific reference distribution, interpreted as reduced vagal
          modulation under the recording conditions.
        </p>

        <h3 className="mt-6 text-lg font-semibold">Reduced SDNN</h3>
        <p className="text-base leading-7 text-foreground/85">
          Reduced overall variability during the five-minute recording.
        </p>

        <h3 className="mt-6 text-lg font-semibold">Reduced RMSSD and SDNN</h3>
        <p className="text-base leading-7 text-foreground/85">
          A combined reduction in rapid beat-to-beat variation and overall
          short-term variability. This pattern may indicate reduced vagal
          modulation together with reduced total short-term variability.
        </p>

        <h3 className="mt-6 text-lg font-semibold">
          Reduced RMSSD with preserved SDNN
        </h3>
        <p className="text-base leading-7 text-foreground/85">
          Relatively reduced beat-to-beat vagal-related variability with
          better-preserved total five-minute variability.
        </p>

        <h3 className="mt-6 text-lg font-semibold">
          Preserved RMSSD with reduced SDNN
        </h3>
        <p className="text-base leading-7 text-foreground/85">
          Reduced overall short-term variability without a corresponding
          reduction in RMSSD. This may reflect non-vagal contributions to total
          variability.
        </p>

        <h3 className="mt-6 text-lg font-semibold">High HRV values</h3>
        <p className="text-base leading-7 text-foreground/85">
          Values above upper reference percentiles may be physiological but
          prompt review of bradycardia, ectopic beats, rhythm irregularity,
          artefacts, breathing pattern and analysis quality. Higher HRV is not
          automatically better.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Supporting interpretation of pNN50 and HF
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          pNN50 and HF power provide supporting vagal-related information. When
          RMSSD is preserved but pNN50 is very low (below 1%) or HF power is
          low (below 50 ms&sup2;), this may indicate mixed parasympathetic
          findings, reflecting discordance between the primary and supporting
          vagal-related metrics. HF values depend strongly on respiratory rate
          and depth.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          LF and LF/HF
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          LF power reflects mixed autonomic and baroreflex-related influences
          and must not be described as a pure sympathetic marker. The LF/HF
          ratio describes the relative distribution of spectral power. Permitted
          descriptors are: relative HF predominance, broadly comparable LF and
          HF power, relative LF predominance, and marked relative LF
          predominance. LF/HF does not provide a direct quantitative measurement
          of sympathetic&ndash;parasympathetic balance and cannot independently
          establish sympathetic overactivity.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          The 5HRV Autonomic Score
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          The 5HRV Autonomic Score combines RMSSD and the LF/HF ratio into a
          single numerical index ranging from &minus;100 to +100. A negative
          score indicates parasympathetic predominance, a score near zero
          indicates a balanced or mixed pattern, and a positive score indicates
          a sympathetic shift. The score is a directional framework aid, not a
          diagnostic measurement.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Worked clinical example
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          A 45-year-old male with a resting five-minute recording yields the
          following values: RMSSD 30.40 ms, SDNN 47.63 ms, HF power 125.95
          ms&sup2;, LF/HF ratio 3.28.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm leading-6">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium">Parameter</th>
                <th className="py-2 pr-4 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-1.5 pr-4">RMSSD</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">30.40 ms</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4">SDNN</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">47.63 ms</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4">HF power</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">125.95 ms&sup2;</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4">LF/HF</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">3.28</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-base leading-7 text-foreground/85">
          The LF/HF ratio demonstrates relative LF predominance. RMSSD and SDNN
          must be interpreted against age- and sex-specific reference
          percentiles. The result does not by itself prove sympathetic
          overactivity or vagal failure. The 5HRV Autonomic Score for this
          recording indicates a pattern within the balanced to mild sympathetic
          shift range.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Limitations</h2>
        <p className="text-base leading-7 text-foreground/85">
          The 5HRV interpretation framework is based on a single five-minute
          resting recording under standardized conditions. It does not replace
          comprehensive autonomic testing, tilt-table evaluation or
          twenty-four-hour HRV analysis where indicated. Results must always be
          integrated with the clinical context.
        </p>
      </section>
    </div>
  );
}
