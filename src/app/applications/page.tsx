import type { Metadata } from "next";
import Link from "next/link";
import { pages } from "@/lib/seo";

export const metadata: Metadata = {
  title: pages.applications.title,
  description: pages.applications.description,
};

export default function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Clinical Applications
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
          Translating standardized five-minute HRV into clinical practice and research.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Role of five-minute HRV in clinical assessment
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Short-term HRV recording offers a practical, non-invasive window into
          autonomic cardiovascular regulation. When interpreted within the
          appropriate clinical context, standardized five-minute measurements
          can support the objective characterization of autonomic function in
          conditions where dysregulation is a known or suspected feature. HRV
          parameters alone do not establish a diagnosis of any disorder and must
          be interpreted within the full clinical picture, including symptoms,
          examination findings, rhythm assessment and other clinical
          information.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Autonomic dysfunction
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Standardized five-minute HRV may contribute to the assessment of
          autonomic function in diabetes mellitus with suspected cardiovascular
          autonomic neuropathy, heart failure with reduced or preserved ejection
          fraction, neurodegenerative disorders including Parkinson disease and
          multiple system atrophy, post-acute infection syndromes, orthostatic
          intolerance syndromes and rehabilitation monitoring. In each context,
          HRV findings are interpreted alongside the clinical presentation and
          are not independently diagnostic.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Orthostatic intolerance and POTS
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          The consensus-based diagnostic framework for postural orthostatic
          tachycardia syndrome in adults requires all of the following: chronic
          (&ge;3 months) orthostatic symptoms that worsen with upright posture
          and improve with recumbency; a sustained heart-rate increase of at
          least 30 beats per minute within ten minutes of upright posture (40
          bpm in adolescents aged 12&ndash;19 years); the absence of orthostatic
          hypotension (a sustained fall of at least 20 mmHg systolic or 10 mmHg
          diastolic); and exclusion of alternative explanations such as
          dehydration, anaemia, hyperthyroidism, medications that affect heart
          rate, and other causes of sinus tachycardia. Resting five-minute HRV
          may characterize associated autonomic patterns, but the diagnosis of
          POTS is established through symptoms and orthostatic heart-rate and
          blood-pressure assessment, not HRV alone.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          Studies of short-term HRV in POTS cohorts have reported a range of
          group-level findings including reduced RMSSD, reduced HF power,
          reduced SDNN in some populations, and relative LF predominance in a
          subset of recordings. These group patterns are not mandatory for
          diagnosis, are not present in all individuals with POTS, and should
          not be used in isolation to confirm or exclude the condition.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Post-acute infection syndromes, ME/CFS and Long COVID
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Post-acute infection syndromes (PAIS), including myalgic
          encephalomyelitis/chronic fatigue syndrome (ME/CFS) and the
          post-COVID-19 condition (&ldquo;Long COVID&rdquo;), are characterized
          by a complex constellation of symptoms that may include orthostatic
          intolerance, post-exertional malaise, sleep disturbance, chronic
          fatigue, cognitive dysfunction and palpitations. A growing body of
          evidence points to a bidirectional relationship between the immune
          system and the autonomic nervous system in these conditions, with
          reduced vagal-related HRV metrics observed in some cohorts.
        </p>
        <p className="text-base leading-7 text-foreground/85">
          Within this context, standardized five-minute HRV recording may
          provide a non-invasive objective autonomic measure, support cohort
          characterization in research studies, serve as an outcome measure in
          interventional trials, and facilitate longitudinal monitoring. A
          specific HRV pattern does not diagnose Long COVID or ME/CFS, and HRV
          findings in these populations remain an area of active research.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Cardiometabolic and neurological applications
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Reduced HRV has been associated with adverse outcomes in several
          cardiovascular conditions, although five-minute HRV must not be
          substituted for validated 24-hour risk models. In neurological
          practice, short-term HRV may support the assessment of autonomic
          involvement in Parkinson disease, multiple system atrophy and other
          neurodegenerative disorders.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Longitudinal monitoring
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Standardized short-term HRV recordings can be repeated over time to
          track changes in autonomic function in response to treatment,
          rehabilitation or disease progression. Reliable longitudinal
          comparison requires consistent recording conditions, equipment and
          analysis methods across sessions.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Research applications
        </h2>
        <p className="text-base leading-7 text-foreground/85">
          Standardized resting five-minute HRV recordings can be integrated
          into research protocols for baseline autonomic assessment, comparison
          of autonomic profiles between cohorts, pre- and post-intervention
          analysis, correlation with orthostatic testing and validated symptom
          scales, and reproducible short recordings suitable for larger studies.
        </p>

        <h3 className="mt-8 text-lg font-semibold">
          Minimum reporting standards
        </h3>
        <p className="text-base leading-7 text-foreground/85">
          The following items should be reported in any study using short-term
          HRV to ensure reproducibility and comparability:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-base leading-7 text-foreground/85">
          <li>Device used for recording</li>
          <li>ECG or PPG methodology</li>
          <li>Sampling rate (Hz)</li>
          <li>Recording duration</li>
          <li>Position during recording</li>
          <li>Rest duration before recording</li>
          <li>Breathing protocol (spontaneous or paced)</li>
          <li>Time of day</li>
          <li>Rhythm exclusions (ectopy, arrhythmia)</li>
          <li>Ectopy threshold applied</li>
          <li>Artefact-correction method</li>
          <li>HRV software and version</li>
          <li>Time-domain metrics reported</li>
          <li>Frequency-domain units and transformation</li>
          <li>Age and sex of the study population</li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Worked case
        </h2>

        <h3 className="text-lg font-semibold">Clinical presentation</h3>
        <p className="text-base leading-7 text-foreground/85">
          Female, 20 years old, 27 months after SARS-CoV-2 infection. Symptoms
          include palpitations, cognitive dysfunction and orthostatic dizziness.
        </p>

        <h3 className="mt-6 text-lg font-semibold">Orthostatic findings</h3>
        <p className="text-base leading-7 text-foreground/85">
          Supine heart rate: 65 bpm, supine blood pressure: 104/76 mmHg.
          Standing heart rate after two minutes: 112 bpm, standing blood
          pressure: 107/74 mmHg. The heart-rate increase reaches the adult
          increment threshold after two minutes. A complete orthostatic
          assessment is required to establish that the increase is sustained
          and to exclude alternative causes.
        </p>

        <h3 className="mt-6 text-lg font-semibold">Five-minute HRV</h3>
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
                <td className="py-2 pr-4">RMSSD</td>
                <td className="py-2 pr-4 text-right tabular-nums">18 ms</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">SDNN</td>
                <td className="py-2 pr-4 text-right tabular-nums">23 ms</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">HF power</td>
                <td className="py-2 pr-4 text-right tabular-nums">213 ms&sup2;</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">LF/HF</td>
                <td className="py-2 pr-4 text-right tabular-nums">2.6</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 text-lg font-semibold">Interpretation</h3>
        <p className="text-base leading-7 text-foreground/85">
          Interpreted using the female 18&ndash;29 reference range: RMSSD below
          the 5th percentile, SDNN between the 5th and 25th percentile,
          indicating reduced short-term beat-to-beat and overall variability,
          with relative LF predominance. These findings are compatible with
          associated autonomic dysregulation but are not diagnostic by
          themselves.
        </p>
        <aside className="my-6 border-l-4 border-primary pl-4 text-sm leading-6 text-foreground/80">
          Treatment and clinical outcome for this patient are described in the
          published teaching material. This case is presented for educational
          purposes and does not constitute a treatment recommendation generated
          by 5HRV.
        </aside>
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
