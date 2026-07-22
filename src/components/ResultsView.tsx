"use client";

import { useState } from "react";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
import { MetricCard } from "@/components/MetricCard";
import { ConfidenceCard } from "@/components/ConfidenceCard";

type Props = {
  interpretation: HrvInterpretation;
  input: MeasurementInput;
  onClear: () => void;
};

function buildPlainText(
  interpretation: HrvInterpretation,
  input: MeasurementInput
): string {
  const lines: string[] = [];
  lines.push("5HRV \u2013 Five-minute HRV interpretation");
  lines.push(`Date: ${new Date().toLocaleDateString("en-GB")}`);
  lines.push("");
  lines.push("INPUT");
  lines.push(`Age: ${input.age} years`);
  lines.push(
    `Reference sex: ${
      input.referenceSex === "none"
        ? "No sex-specific reference"
        : input.referenceSex === "female"
          ? "Female"
          : "Male"
    }`
  );
  lines.push("Method: ECG");
  lines.push("Position: Supine");
  lines.push(`Recording duration: ${input.durationMinutes} min`);
  if (input.rhythm !== "unknown")
    lines.push(`Rhythm: ${input.rhythm.replace(/_/g, " ")}`);
  if (input.artefactCorrection !== "unknown")
    lines.push(`Artefact correction: ${input.artefactCorrection.replace(/_/g, " ")}`);
  if (input.quietRest !== undefined && input.quietRest !== "unknown")
    lines.push(`Quiet rest: ${input.quietRest.replace(/_/g, " ")}`);
  if (input.breathing !== undefined && input.breathing !== "unknown")
    lines.push(`Breathing: ${input.breathing.replace(/_/g, " ")}`);
  if (input.meanHeartRate !== undefined)
    lines.push(`Mean heart rate: ${input.meanHeartRate} bpm`);
  if (input.rmssd !== undefined) lines.push(`RMSSD: ${input.rmssd} ms`);
  if (input.sdnn !== undefined) lines.push(`SDNN: ${input.sdnn} ms`);
  if (input.pnn50 !== undefined) lines.push(`pNN50: ${input.pnn50} %`);
  if (input.hfPower !== undefined) lines.push(`HF power: ${input.hfPower} ms\u00B2`);
  if (input.lfPower !== undefined) lines.push(`LF power: ${input.lfPower} ms\u00B2`);
  if (input.lfhfRatio !== undefined) lines.push(`LF/HF: ${input.lfhfRatio}`);
  lines.push("");
  lines.push(`RECORDING CONFIDENCE: ${interpretation.confidenceLabel}`);
  for (const reason of interpretation.confidenceReasons) {
    lines.push(`- ${reason}`);
  }
  lines.push("");
  lines.push("SUMMARY");
  lines.push(interpretation.summary);
  lines.push("");
  lines.push("METRICS");
  for (const metric of interpretation.metrics) {
    lines.push(
      `${metric.name}: ${metric.value} ${metric.unit}${
        metric.categoryLabel ? ` \u2013 ${metric.categoryLabel}` : ""
      }`
    );
    lines.push(`  ${metric.interpretation}`);
    if (metric.limitation) lines.push(`  Note: ${metric.limitation}`);
  }
  lines.push("");
  lines.push("LIMITATIONS");
  lines.push(
    `HRV is influenced by: ${interpretation.limitations.join(", ").toLowerCase()}.`
  );
  lines.push("");
  lines.push(interpretation.clinicalNote);
  lines.push(interpretation.safetyMessage);
  lines.push("");
  lines.push(
    "5HRV provides contextual interpretation of five-minute HRV measurements for educational and professional reference. It does not diagnose disease, replace ECG review or substitute for clinical assessment."
  );
  return lines.join("\n");
}

export function ResultsView({ interpretation, input, onClear }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = buildPlainText(interpretation, input);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="results" className="mt-10 space-y-6" aria-live="polite">
      <h2 className="text-xl font-bold text-foreground">Interpretation result</h2>

      <section
        aria-labelledby="summary-heading"
        className="rounded-lg border border-border bg-card p-5"
      >
        <h3 id="summary-heading" className="text-base font-semibold text-foreground">
          Summary
        </h3>
        <p className="mt-2 text-base leading-relaxed text-foreground">
          {interpretation.summary}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">
          {interpretation.clinicalNote}
        </p>
        {interpretation.referenceNote && (
          <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-foreground/90">
            {interpretation.referenceNote}
          </p>
        )}
      </section>

      <ConfidenceCard
        confidence={interpretation.confidence}
        label={interpretation.confidenceLabel}
        reasons={interpretation.confidenceReasons}
      />

      {interpretation.metrics.length > 0 && (
        <section aria-labelledby="metrics-heading">
          <h3 id="metrics-heading" className="text-base font-semibold text-foreground">
            Individual metrics
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {interpretation.metrics.map((metric) => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
          </div>
        </section>
      )}

      <section
        aria-labelledby="limitations-heading"
        className="rounded-lg border border-border bg-card p-5"
      >
        <h3 id="limitations-heading" className="text-base font-semibold text-foreground">
          Important limitations
        </h3>
        <p className="mt-2 text-sm text-foreground/90">
          HRV is influenced by many factors that were not part of this
          calculation, including:
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {interpretation.limitations.map((limitation) => (
            <li
              key={limitation}
              className="rounded-md bg-muted px-2 py-1 text-xs text-foreground/80"
            >
              {limitation}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="safety-heading"
        className="rounded-lg border border-border bg-muted p-5"
      >
        <h3 id="safety-heading" className="text-base font-semibold text-foreground">
          Safety
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {interpretation.safetyMessage}
        </p>
      </section>

      <div className="flex flex-col gap-3 print:hidden sm:flex-row">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {copied ? "Copied" : "Copy interpretation"}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Print result
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Clear calculator
        </button>
      </div>
    </div>
  );
}
