"use client";

import { useMemo, useState } from "react";
import type { HrvInterpretation, MeasurementInput, MetricResult } from "@/lib/types";
import { getAgeBand } from "@/data/hrvReferenceData";

type Props = {
  interpretation: HrvInterpretation;
  input: MeasurementInput;
};

function approxPercentile(value: number, ref: number[]): number | null {
  if (ref.length !== 5) return null;
  const [p5, p25, p50, p75, p95] = ref;
  if (value <= p5) return Math.round((value / p5) * 5);
  if (value <= p25) return Math.round(5 + ((value - p5) / (p25 - p5)) * 20);
  if (value <= p75) return Math.round(25 + ((value - p25) / (p75 - p25)) * 50);
  if (value <= p95) return Math.round(75 + ((value - p75) / (p95 - p75)) * 20);
  return Math.round(95 + ((value - p95) / p95) * 5);
}

function PrimaryMetric({
  metric,
}: {
  metric: MetricResult;
}) {
  const pct = metric.referencePercentiles
    ? approxPercentile(metric.value, metric.referencePercentiles)
    : null;
  const refLine = metric.referencePercentiles
    ? `P5 ${metric.referencePercentiles[0]} · P25 ${metric.referencePercentiles[1]} · P50 ${metric.referencePercentiles[2]} · P75 ${metric.referencePercentiles[3]} · P95 ${metric.referencePercentiles[4]} ${metric.unit}`
    : null;

  return (
    <div>
      <div>
        <span className="text-sm font-semibold text-foreground">{metric.name}</span>
        <span className="ml-2 text-lg font-semibold text-foreground tabular-nums">{metric.value}</span>
        {metric.unit && <span className="ml-0.5 text-xs text-muted-foreground">{metric.unit}</span>}
        {pct !== null && <span className="ml-2 text-xs font-medium text-foreground">P{pct}</span>}
        {metric.categoryLabel && <span className="ml-2 text-xs text-muted-foreground">— {metric.categoryLabel}</span>}
      </div>
      {refLine && (
        <p className="mt-0.5 text-xs text-muted-foreground">{refLine}</p>
      )}
    </div>
  );
}

function buildPlainText(
  interpretation: HrvInterpretation,
  input: MeasurementInput
): string {
  const lines: string[] = [];
  lines.push("5HRV Interpretation");
  lines.push("");
  const ageBand = getAgeBand(input.age);
  lines.push(`Age: ${input.age} years`);
  lines.push(
    `Reference: ${input.referenceSex === "none" ? "No sex-specific reference" : input.referenceSex === "female" ? "Female" : "Male"}${ageBand ? `, ${ageBand} years` : ""}`
  );
  lines.push("");
  lines.push("Summary");
  lines.push(interpretation.summary);
  lines.push("");

  for (const m of interpretation.metrics) {
    if (m.key === "rmssd" || m.key === "sdnn") {
      const ref = m.referencePercentiles;
      const pct = ref ? approxPercentile(m.value, ref) : null;
      const label = m.categoryLabel ? ` — ${m.categoryLabel}` : "";
      lines.push(`${m.name}: ${m.value} ${m.unit}${pct !== null ? ` — approximately P${pct}` : ""}${label}`);
    } else {
      lines.push(`${m.name === "LF/HF ratio" ? "LF/HF" : m.name}: ${m.value}${m.unit ? ` ${m.unit}` : ""}`);
    }
  }
  lines.push("");
  lines.push("Interpretation");
  lines.push(interpretation.summary);
  lines.push("");
  lines.push("Interpret HRV together with the ECG, symptoms and clinical context.");
  if (interpretation.referenceNote) {
    lines.push("");
    lines.push(interpretation.referenceNote);
  }
  return lines.join("\n");
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function ResultsView({ interpretation, input }: Props) {
  const [copied, setCopied] = useState(false);

  const ageBand = useMemo(() => getAgeBand(input.age), [input.age]);

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

  const primaryMetrics = interpretation.metrics.filter((m) => m.key === "rmssd" || m.key === "sdnn");
  const secondaryMetrics = interpretation.metrics.filter((m) => m.key !== "rmssd" && m.key !== "sdnn");

  return (
    <div id="results" className="mt-10" aria-live="polite">
      <div className="rounded-lg border border-border bg-card print:border-none">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">5HRV Interpretation</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Age: {input.age} years</span>
              <span>
                Reference: {input.referenceSex === "none" ? "No sex-specific reference" : input.referenceSex === "female" ? "Female" : "Male"}
                {ageBand ? `, ${ageBand} years` : ""}
              </span>
              <span>{formatDate()}</span>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {copied ? "Copied" : "Copy all"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Print result
            </button>
          </div>
        </div>

        {/* Main interpretation */}
        {interpretation.summary && (
          <div className="border-b border-border px-6 py-5">
            <p className="text-base leading-relaxed text-foreground">
              {interpretation.summary}
            </p>
            {interpretation.referenceNote && (
              <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-foreground/80">
                {interpretation.referenceNote}
              </p>
            )}
          </div>
        )}

        {/* Primary metrics: RMSSD + SDNN */}
        {primaryMetrics.length > 0 && (
          <div className="border-b border-border px-6 py-5">
            {primaryMetrics.length === 2 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {primaryMetrics.map((m) => (
                  <PrimaryMetric key={m.key} metric={m} />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {primaryMetrics.map((m) => (
                  <PrimaryMetric key={m.key} metric={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Secondary metrics table */}
        {secondaryMetrics.length > 0 && (
          <div className="border-b border-border px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 text-right font-medium">Result</th>
                  <th className="pb-2 pl-4 font-medium">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {secondaryMetrics.map((m) => (
                  <tr key={m.key} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-sm font-medium text-foreground">
                      {m.key === "lfhf" ? "LF/HF" : m.name}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">
                      {m.value}
                      {m.unit && <span className="ml-0.5 text-xs text-muted-foreground">{m.unit}</span>}
                      {m.key === "lfhf" && m.interpretation.includes("Calculated") && (
                        <span className="ml-1.5 text-[11px] text-[#286d6d]">Calculated</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-4 text-sm text-muted-foreground">
                      {m.interpretation.replace(/\.$/, "")}
                      {m.limitation && (
                        <span className="block text-xs text-muted-foreground/70">
                          {m.limitation}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Clinical note */}
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {interpretation.clinicalNote}
          </p>
        </div>
      </div>
    </div>
  );
}
