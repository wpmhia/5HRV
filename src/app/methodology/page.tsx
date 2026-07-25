import type { Metadata } from "next";
import { pages } from "@/lib/seo";

export const metadata: Metadata = {
  title: pages.methodology.title,
  description: pages.methodology.description,
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Methodology
      </h1>
      <p className="mt-2 text-base leading-7 text-muted-foreground">
        How 5HRV analyses five-minute HRV recordings — from reference
        populations and percentile placement to the autonomic pattern score.
      </p>

      {/* 1. Scientific foundation */}
      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Scientific foundation
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          5HRV uses three well-established short-term heart rate variability
          metrics, each supported by decades of physiological research.
        </p>

        <h3 className="mt-6 text-lg font-semibold text-foreground">RMSSD</h3>
        <p className="text-base leading-7 text-foreground/85">
          The square root of the mean of the squares of successive NN-interval
          differences. RMSSD isolates high-frequency beat-to-beat variation and
          is widely regarded as the primary time-domain index of cardiac vagal
          (parasympathetic) modulation. Because it filters out slower trends, it
          is less confounded by sympathetic or baroreflex influences than other
          time-domain measures.
        </p>

        <h3 className="mt-6 text-lg font-semibold text-foreground">SDNN</h3>
        <p className="text-base leading-7 text-foreground/85">
          The standard deviation of all NN intervals during the recording.
          In a five-minute recording, SDNN reflects total short-term
          variability, incorporating both sympathetic and parasympathetic
          influences as well as slower regulatory processes. It is not a
          pure marker of any single autonomic branch.
        </p>

        <h3 className="mt-6 text-lg font-semibold text-foreground">LF/HF ratio</h3>
        <p className="text-base leading-7 text-foreground/85">
          The ratio of low-frequency (0.04–0.15 Hz) to high-frequency
          (0.15–0.4 Hz) spectral power. LF/HF provides information about the
          relative distribution of spectral power but is not a direct
          measurement of sympathovagal balance. The LF component contains
          baroreflex, parasympathetic and other influences in addition to
          sympathetic activity.
        </p>

        <h3 className="mt-6 text-lg font-semibold text-foreground">
          Key references
        </h3>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>
            Task Force of the ESC/NASPE. Heart rate variability: standards of
            measurement, physiological interpretation, and clinical use.
            <em> Circulation</em> 1996; 93(5): 1043–1065.
          </li>
          <li>
            Shaffer F, Ginsberg JP. An overview of heart rate variability
            metrics and norms. <em>Front Public Health</em> 2017; 5: 258.
          </li>
          <li>
            Billman GE. The LF/HF ratio does not accurately measure cardiac
            sympatho-vagal balance. <em>Front Physiol</em> 2013; 4: 26.
          </li>
          <li>
            Laborde S, Mosley E, Thayer JF. Heart rate variability and cardiac
            vagal tone in psychophysiological research. <em>Front Psychol</em>
            2017; 8: 213.
          </li>
        </ul>
      </section>

      {/* 2. Reference populations */}
      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Reference populations
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          5HRV uses age- and sex-specific reference percentiles from the
          DanFunD population study.
        </p>

        <h3 className="mt-6 text-lg font-semibold text-foreground">
          The DanFunD cohort
        </h3>
        <p className="text-base leading-7 text-foreground/85">
          The Danish Study of Functional Disorders (DanFunD) is a large,
          population-based cohort study conducted in Denmark. The HRV reference
          data were published by Brinth et al. in 2022.
        </p>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Characteristic</th>
              <th className="py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">Reference</td>
              <td className="py-2">
                Brinth LS et al. <em>Scand J Public Health</em>. DOI:
                10.1177/14034948221124020
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">Cohort</td>
              <td className="py-2">DanFunD (Danish general population)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">
                Age range
              </td>
              <td className="py-2">18–72 years</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">
                Age bands
              </td>
              <td className="py-2">
                18–29, 30–39, 40–49, 50–59, 60–72
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">
                Sex stratification
              </td>
              <td className="py-2">Male / Female</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">
                Published percentiles
              </td>
              <td className="py-2">
                P5, P25, P50, P75, P95 for SDNN, RMSSD and LF/HF
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 text-muted-foreground">
                Recording duration
              </td>
              <td className="py-2">5 minutes</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-sm text-muted-foreground">
          Percentiles are derived from Table 2 (SDNN, RMSSD) and Table 3
          (LF/HF) of the published paper. Reference data cover five age bands
          and two sex categories, providing 10 separate reference distributions
          per metric.
        </p>
      </section>

      {/* 3. 5HRV algorithms */}
      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          5HRV algorithms
        </h2>

        <h3 className="mt-6 text-lg font-semibold text-foreground">
          Percentile interpolation
        </h3>
        <p className="text-base leading-7 text-foreground/85">
          Individual RMSSD and SDNN values are placed within the 5-point
          reference distribution using linear interpolation between the
          published P5, P25, P50, P75 and P95 anchors. The result is a
          continuous percentile estimate (0–100) that avoids the discontinuities
          of band-based classification alone.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          LF/HF percentiles are computed using logarithmic interpolation, which
          better reflects the right-skewed distribution of spectral ratio values
          in the general population. Values below P5 or above P95 are clamped to
          the 5th or 95th percentiles respectively.
        </p>
        <p className="text-sm text-muted-foreground">
          Percentile bands displayed in the report (below P5, P5–P25, P25–P75,
          P75–P95, above P95) are derived from the same reference distribution
          using standard clinical cut-points.
        </p>

        <h3 className="mt-8 text-lg font-semibold text-foreground">
          Autonomic Pattern Score
        </h3>
        <p className="text-base leading-7 text-foreground/85">
          The 5HRV Autonomic Pattern Score is a directional composite developed
          by 5HRV. It combines RMSSD and LF/HF percentiles into a single
          continuous scale from −100 (parasympathetic direction) to +100
          (sympathetic direction). The score provides a research-based summary
          of the autonomic pattern observed in the recording.
        </p>

        <h4 className="mt-6 text-base font-medium text-foreground">
          Calculation steps
        </h4>
        <ol className="list-decimal space-y-3 pl-6 text-base leading-7 text-foreground/85">
          <li>
            <strong>Convert to Z-scores.</strong> RMSSD and LF/HF percentiles
            are transformed to standard normal deviates (Z-scores) using the
            inverse normal (probit) function. This places both metrics on a
            common dimensionless scale.
          </li>
          <li>
            <strong>Directional sign.</strong> The RMSSD Z-score is negated so
            that low RMSSD (negative Z) contributes positively to the
            sympathetic-direction score. The LF/HF Z-score is used directly
            (high LF/HF → positive contribution to sympathetic direction).
          </li>
          <li>
            <strong>Weighted combination.</strong> The directional deviations
            are combined with a 70/30 weighting: RMSSD (vagal modulation)
            contributes 70%, LF/HF (spectral pattern) contributes 30%.
          </li>
          <li>
            <strong>Normalization.</strong> The combined deviation is divided
            by a normalization constant and scaled to 100. The result is
            clamped to the range [−100, +100].
          </li>
        </ol>

        <h4 className="mt-6 text-base font-medium text-foreground">
          Weighting rationale
        </h4>
        <p className="text-base leading-7 text-foreground/85">
          RMSSD receives the larger weight (70%) because it isolates
          high-frequency parasympathetic modulation with fewer confounding
          influences than frequency-domain ratios. LF/HF contributes a smaller
          weight (30%) as a complementary spectral component while acknowledging
          its known limitations as a sympathovagal marker.
        </p>

        <h4 className="mt-6 text-base font-medium text-foreground">
          Pattern classification
        </h4>
        <p className="text-base leading-7 text-foreground/85">
          The score is classified into six directional categories and one
          central category. Concordance between the two axes (RMSSD low/high
          and LF/HF low/high) determines whether the pattern is concordant
          (both metrics point in the same direction), single-axis (one metric
          outside central range while the other is within), mixed (metrics point
          in opposite directions), or central (both within the central range).
        </p>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Score range</th>
              <th className="py-2 font-medium">Pattern label</th>
            </tr>
          </thead>
          <tbody className="text-foreground/85">
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">+75 to +100</td>
              <td className="py-2">Pronounced sympathetic-direction shift</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">+50 to +74</td>
              <td className="py-2">Marked sympathetic-direction shift</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">+25 to +49</td>
              <td className="py-2">Mild sympathetic-direction shift</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">
                −24 to +24
              </td>
              <td className="py-2">
                Central autonomic pattern (when both axes are central); Mixed
                autonomic pattern otherwise
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">−25 to −49</td>
              <td className="py-2">
                Mild parasympathetic-direction shift
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">−50 to −74</td>
              <td className="py-2">
                Marked parasympathetic-direction shift
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">
                −75 to −100
              </td>
              <td className="py-2">
                Pronounced parasympathetic-direction shift
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-2 text-sm text-muted-foreground">
          The concordance classification and single-axis / mixed categories are
          determined by whether each metric (RMSSD and LF/HF percentile) falls
          below P25, above P75, or within the central P25–P75 range.
          Concordance categories are displayed in the report alongside the
          numeric score and pattern label.
        </p>
      </section>

      {/* 4. Scope */}
      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Scope</h2>
        <p className="text-base leading-7 text-foreground/85">
          5HRV is a scientific HRV calculator. It analyses five-minute HRV
          recordings using peer-reviewed physiological research and published
          age- and sex-specific reference populations. The output describes the
          recorded HRV data in relation to these references — it is not a
          clinical assessment of the individual.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          Clinical interpretation remains the responsibility of the healthcare
          professional, who integrates the HRV findings with the patient&apos;s
          history, symptoms, examination, medications, recording conditions and
          other relevant clinical information.
        </p>
      </section>

      {/* 5. Limitations */}
      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Limitations</h2>
        <ul className="list-disc space-y-3 pl-6 text-base leading-7 text-foreground/85">
          <li>
            <strong>Recording context.</strong> HRV is sensitive to body
            position, breathing rate and depth, time of day, prior activity,
            caffeine, nicotine, food intake and medications. Standardized
            recording conditions are required for meaningful interpretation.
          </li>
          <li>
            <strong>Five-minute recordings.</strong> Short-term HRV captures
            resting autonomic modulation but does not reflect circadian
            variation, sleep-stage architecture, or responses to daily
            stressors. Five-minute values are not interchangeable with 24-hour
            Holter metrics.
          </li>
          <li>
            <strong>Recording quality.</strong> Ectopic beats, atrial
            fibrillation, frequent supraventricular or ventricular ectopy and
            movement artefacts can invalidate HRV analysis. The calculator
            assumes technically valid NN-interval data.
          </li>
          <li>
            <strong>Reference population.</strong> The DanFunD cohort reflects
            a Danish general population aged 18–72. Reference percentiles may
            not generalise to all ethnic groups, clinical populations, or
            individuals outside this age range. Above age 72, no age-specific
            reference percentiles are applied.
          </li>
          <li>
            <strong>LF/HF interpretation.</strong> The             LF/HF ratio does not
            directly measure sympathetic activity or sympathovagal balance. The
            LF component can contain baroreflex, respiratory and parasympathetic influences.
            It is used in the score as a directional indicator alongside RMSSD,
            not as an independent diagnostic marker.
          </li>
          <li>
            <strong>Autonomic Pattern Score.</strong> The 5HRV Autonomic
            Pattern Score is a composite metric developed by 5HRV. It is
            intended for research-based analysis of HRV recordings. It has not
            been independently validated as a diagnostic scale and should not
            be used in isolation for clinical decision-making.
          </li>
          <li>
            <strong>Single recording.</strong> A single five-minute recording
            provides a snapshot of autonomic state at one point in time.
            Serial measurements under standardised conditions are more
            informative than a single recording. Observed patterns should not
            be interpreted as chronic or permanent physiological states.
          </li>
        </ul>
      </section>
    </div>
  );
}
