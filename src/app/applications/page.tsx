"use client";

export default function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Page header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Clinical Applications
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Translating standardized five-minute HRV into clinical practice and research.
        </p>
      </header>

      <div className="space-y-10">
        {/* Autonomic dysfunction */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Autonomic Dysfunction
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <p className="leading-relaxed text-foreground">
              Short-term HRV recording offers a practical, non-invasive window
              into autonomic cardiovascular regulation. When interpreted within
              the appropriate clinical context, standardized five-minute
              measurements can support the objective characterization of
              autonomic function in conditions where dysregulation is a known or
              suspected feature. Potential applications include diabetes mellitus
              with suspected cardiovascular autonomic neuropathy, heart failure
              with reduced or preserved ejection fraction, neurodegenerative
              disorders such as Parkinson disease and multiple system atrophy,
              post-acute infection syndromes, orthostatic intolerance syndromes
              including postural orthostatic tachycardia syndrome (POTS),
              rehabilitation monitoring, and interventional studies targeting
              autonomic function. HRV parameters alone do not establish a
              diagnosis of any of these disorders and must be interpreted within
              the full clinical picture.
            </p>
          </div>
        </section>

        {/* POTS and orthostatic intolerance */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            POTS and Orthostatic Intolerance
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Clinical Framework
            </h3>
            <p className="leading-relaxed text-foreground">
              The consensus-based diagnostic framework for postural orthostatic
              tachycardia syndrome in adults requires all of the following:
              chronic (&ge;3 months) orthostatic symptoms that worsen with
              upright posture and improve with recumbency; a sustained heart-rate
              increase of at least 30 beats per minute within ten minutes of
              upright posture; a higher threshold of 40 bpm in adolescents aged
              12&ndash;19 years; the absence of orthostatic hypotension (a
              sustained fall of at least 20 mmHg systolic or 10 mmHg diastolic);
              and exclusion of alternative explanations such as dehydration,
              anaemia, hyperthyroidism, medications that affect heart rate, and
              other causes of sinus tachycardia.
            </p>
            <p className="mt-3 leading-relaxed text-foreground">
              An absolute standing heart rate of 120 bpm or higher is
              commonly observed in some patients but is not a mandatory current
              diagnostic criterion.
            </p>
            <p className="mt-3 leading-relaxed text-foreground">
              Orthostatic assessment may be performed using an active stand test,
              tilt-table testing, or the NASA Lean Test, depending on the
              clinical setting and resources available.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                <strong>Important:</strong> Resting five-minute HRV may
                characterize associated autonomic patterns, but POTS is diagnosed
                through symptoms and orthostatic heart-rate and blood-pressure
                assessment&mdash;not HRV alone.
              </p>
            </div>
            <h3 className="mb-2 mt-6 text-lg font-semibold text-foreground">
              Research Observations
            </h3>
            <p className="leading-relaxed text-foreground">
              Studies of short-term HRV in POTS cohorts have reported a range of
              group-level findings compared with healthy controls: reduced RMSSD,
              reduced high-frequency (HF) power, reduced SDNN in some
              populations, and relative low-frequency (LF) predominance in a
              subset of recordings. These group patterns are not mandatory for
              diagnosis, are not present in all individuals with POTS, and should
              not be used in isolation to confirm or exclude the condition.
            </p>
          </div>
        </section>

        {/* PAIS, ME/CFS and Long COVID */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Post-Acute Infection Syndromes, ME/CFS, and Long COVID
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <p className="leading-relaxed text-foreground">
              Post-acute infection syndromes (PAIS), including myalgic
              encephalomyelitis/chronic fatigue syndrome (ME/CFS) and the
              post-COVID-19 condition (&ldquo;Long COVID&rdquo;), are
              characterized by a complex constellation of symptoms that may
              include orthostatic intolerance, post-exertional malaise, sleep
              disturbance, chronic fatigue, cognitive dysfunction, and
              palpitations.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-foreground">
              Immune&ndash;Autonomic Relationship
            </h3>
            <p className="leading-relaxed text-foreground">
              A growing body of evidence points to a bidirectional relationship
              between the immune system and the autonomic nervous system in these
              conditions. Proposed mechanisms include persistent immune
              activation, neuroinflammatory signalling involving brainstem
              autonomic centres, altered autonomic regulation, and reduced
              vagal-related HRV metrics observed in some cohorts.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-foreground">
              Role of Five-Minute HRV
            </h3>
            <p className="leading-relaxed text-foreground">
              Within this context, standardized five-minute HRV recording may
              provide a non-invasive objective autonomic measure, support cohort
              characterization in research studies, serve as an outcome measure
              in interventional trials, and facilitate longitudinal research
            </p>
            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                <strong>Important:</strong> A specific HRV pattern does not
                diagnose Long COVID or ME/CFS. HRV findings in these populations
                remain an area of active research.
              </p>
            </div>
          </div>
        </section>

        {/* Research applications */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Research Applications
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <p className="leading-relaxed text-foreground">
              Standardized resting five-minute HRV recordings can be integrated
              into research protocols for a variety of purposes:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-foreground">
              <li>Standardized baseline autonomic assessment</li>
              <li>Comparison of autonomic profiles between cohorts</li>
              <li>Pre- and post-intervention analysis</li>
              <li>Correlation with orthostatic testing results</li>
              <li>Correlation with validated symptom scales</li>
              <li>Correlation with inflammatory or immunological markers</li>
              <li>Reproducible short recordings suitable for larger studies</li>
            </ul>
          </div>

          <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">
            Recommended Minimum Reporting Checklist
          </h3>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              The following items should be reported in any study using
              short-term HRV to ensure reproducibility and comparability:
            </p>
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {[
                "Device used for recording",
                "ECG or PPG methodology",
                "Sampling rate (Hz)",
                "Recording duration",
                "Position during recording",
                "Rest duration before recording",
                "Breathing protocol (spontaneous or paced)",
                "Time of day",
                "Rhythm exclusions (ectopy, arrhythmia)",
                "Ectopy threshold applied",
                "Artefact-correction method",
                "HRV software and version",
                "Time-domain metrics reported",
                "Frequency-domain units and transformation",
                "Age and sex of the study population",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground">
                  <span className="mt-0.5 text-primary">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Case study: Mette */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Case Study
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Patient
            </h3>
            <ul className="space-y-1.5 text-foreground">
              <li>Female, 20 years old, 27 months after SARS-CoV-2 infection</li>
              <li>
                Symptoms: palpitations, cognitive dysfunction, orthostatic
                dizziness
              </li>
            </ul>

            <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">
              Orthostatic Assessment
            </h3>
            <ul className="space-y-1 text-foreground">
              <li>Supine heart rate: 65 bpm, supine BP: 104/76 mmHg</li>
              <li>Standing HR after 2 min: 112 bpm, standing BP: 107/74 mmHg</li>
            </ul>
            <div className="mt-3 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                The heart-rate increase reaches the adult increment threshold
                after two minutes. A complete orthostatic assessment is required
                to establish that the increase is sustained, evaluate the full
                blood-pressure response and exclude alternative causes.
              </p>
            </div>

            <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">
              HRV (Resting Five-Minute Recording)
            </h3>
            <ul className="space-y-1 text-foreground">
              <li>RMSSD: 18 ms</li>
              <li>SDNN: 23 ms</li>
              <li>HF power: 213 ms&sup2;</li>
              <li>LF/HF: 2.6</li>
            </ul>
            <p className="mt-3 leading-relaxed text-foreground">
              Interpreted using the female 18&ndash;29 reference range: RMSSD
              below the 5th percentile, SDNN between the 5th and 25th percentile,
              indicating reduced short-term beat-to-beat and overall variability,
              with relative LF predominance.
            </p>
            <div className="mt-3 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                Findings compatible with associated autonomic dysregulation but
                not diagnostic by themselves.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Treatment and clinical outcome for this patient are described in
                the published teaching material. This case is presented for
                educational purposes and does not constitute a treatment
                recommendation generated by 5HRV.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
